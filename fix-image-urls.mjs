/**
 * Fix Google Drive image URLs in the products table.
 * Converts /file/d/{id}/view  →  https://drive.google.com/uc?export=view&id={id}
 * which renders directly as an <img> src.
 */
import mysql from "mysql2/promise";
import { readFileSync } from "fs";

// Load DATABASE_URL from .env if present
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  try {
    const env = readFileSync("/home/ubuntu/the-jewel-gallery/.env", "utf8");
    const match = env.match(/DATABASE_URL=(.+)/);
    if (match) dbUrl = match[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
}
if (!dbUrl) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

function fixDriveUrl(url) {
  if (!url) return url;
  // Already a direct uc link
  if (url.includes("uc?export=view") || url.includes("uc?id=")) return url;
  // Match /file/d/{id}/view or /file/d/{id}
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}

const conn = await mysql.createConnection(dbUrl);
try {
  const [rows] = await conn.execute("SELECT id, images FROM products WHERE images IS NOT NULL");
  let updated = 0;
  for (const row of rows) {
    let images;
    try {
      images = typeof row.images === "string" ? JSON.parse(row.images) : row.images;
    } catch {
      continue;
    }
    if (!Array.isArray(images)) continue;
    const fixed = images.map(fixDriveUrl);
    const changed = fixed.some((u, i) => u !== images[i]);
    if (changed) {
      await conn.execute("UPDATE products SET images = ? WHERE id = ?", [
        JSON.stringify(fixed),
        row.id,
      ]);
      updated++;
      console.log(`  Fixed product id=${row.id}: ${images[0]} → ${fixed[0]}`);
    }
  }
  console.log(`\nDone — updated ${updated} product(s) out of ${rows.length} total.`);
} finally {
  await conn.end();
}
