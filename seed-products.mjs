import "dotenv/config";
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 100);
}

function parseTitle(title) {
  const parts = title.split("|");
  return parts[0].trim();
}

function parseCategory(cat) {
  const mapping = {
    rings: "rings",
    earrings: "earrings",
    necklaces: "necklaces",
    bracelets: "bracelets",
    necklace: "necklaces",
    bracelet: "bracelets",
    ring: "rings",
    earring: "earrings",
  };
  return mapping[cat.trim().toLowerCase()] ?? "rings";
}

function parseImages(imgStr) {
  if (!imgStr || !imgStr.trim()) return [];
  return imgStr
    .split(/[,\n]+/)
    .map((u) => u.trim())
    .filter(Boolean);
}

function parsePrice(priceStr) {
  if (!priceStr || !priceStr.trim()) return 0;
  const clean = priceStr.replace(/[₹,\s]/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num);
}

function readCsv(filePath) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  let i = 1;
  while (i < lines.length) {
    // Accumulate lines until we have a complete record (handle multi-line fields)
    let record = lines[i];
    while (i + 1 < lines.length && countUnescapedQuotes(record) % 2 !== 0) {
      i++;
      record += "\n" + lines[i];
    }
    if (record.trim()) {
      const values = parseCSVLine(record);
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
      rows.push(row);
    }
    i++;
  }
  return rows;
}

function countUnescapedQuotes(str) {
  let count = 0;
  let inEscape = false;
  for (const ch of str) {
    if (ch === '"') count++;
  }
  return count;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  const csvPath = path.join(__dirname, "../tjg_skus_v2.csv");
  const rows = readCsv(csvPath);
  console.log(`Read ${rows.length} rows from CSV`);

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Get existing SKUs
  const [existing] = await conn.execute("SELECT sku FROM products");
  const existingSkus = new Set(existing.map((r) => r.sku));
  console.log(`Existing SKUs in DB: ${existingSkus.size}`);

  const seenSlugs = new Set();
  // Get existing slugs
  const [existingSlugs] = await conn.execute("SELECT slug FROM products");
  existingSlugs.forEach((r) => seenSlugs.add(r.slug));

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const sku = row["SKU"]?.trim();
    if (!sku) { skipped++; continue; }

    const rawTitle = row["Title"]?.trim() ?? "";
    const name = parseTitle(rawTitle);
    const category = parseCategory(row["Category"] ?? "rings");
    const subcategoryRaw = row["Sub Category"]?.trim();
    const subcategory = subcategoryRaw
      ? subcategoryRaw.toLowerCase().replace(/\s+/g, "-")
      : null;
    const description = row["Description"]?.trim() ?? "";
    const price = parsePrice(row["Price"]);
    const images = parseImages(row["Image URLS"]);
    const titleParts = rawTitle.split("|");
    const collection = titleParts.length > 1 ? titleParts[titleParts.length - 1].trim() : null;

    // Generate unique slug
    let baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    while (seenSlugs.has(slug) && !existingSkus.has(sku)) {
      slug = `${baseSlug}-${counter++}`;
    }
    seenSlugs.add(slug);

    if (existingSkus.has(sku)) {
      // Update existing product (don't update slug to avoid unique constraint conflicts)
      await conn.execute(
        `UPDATE products SET name=?, category=?, subcategory=?, collection=?, description=?, price=?, isActive=1, images=? WHERE sku=?`,
        [name, category, subcategory, collection, description, price, JSON.stringify(images), sku]
      );
      updated++;
    } else {
      // Insert new product
      await conn.execute(
        `INSERT INTO products (sku, name, slug, category, subcategory, collection, description, price, stock, isActive, isFeatured, isNewArrival, isBestseller, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 10, 1, 0, 1, 0, ?)`,
        [sku, name, slug, category, subcategory, collection, description, price, JSON.stringify(images)]
      );
      existingSkus.add(sku);
      inserted++;
    }
  }

  await conn.end();
  console.log(`\nDone! Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);

  // Verify
  const conn2 = await mysql.createConnection(process.env.DATABASE_URL);
  const [counts] = await conn2.execute(
    "SELECT category, COUNT(*) as cnt, SUM(isActive) as active FROM products GROUP BY category"
  );
  console.log("\nProducts by category:");
  counts.forEach((r) => console.log(`  ${r.category}: ${r.cnt} total, ${r.active} active`));
  const [total] = await conn2.execute("SELECT COUNT(*) as total FROM products");
  console.log(`\nTotal products: ${total[0].total}`);
  await conn2.end();
}

main().catch(console.error);
