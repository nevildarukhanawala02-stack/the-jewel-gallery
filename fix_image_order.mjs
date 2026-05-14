import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Fetch all active products
const [rows] = await conn.execute(
  'SELECT id, name, sku, isBestseller, images, imageTypes FROM products WHERE isActive = 1 ORDER BY id'
);

console.log(`Total products: ${rows.length}\n`);

let fixedCount = 0;
let alreadyOkCount = 0;
let noTypesCount = 0;

for (const row of rows) {
  // Parse images - stored as comma-separated string
  const imagesRaw = typeof row.images === 'string' ? row.images : String(row.images || '');
  const imageTypesRaw = typeof row.imageTypes === 'string' ? row.imageTypes : String(row.imageTypes || '');
  
  const imgs = imagesRaw.split(',').map(s => s.trim()).filter(Boolean);
  const types = imageTypesRaw.split(',').map(s => s.trim()).filter(Boolean);
  
  if (imgs.length === 0) {
    console.log(`[SKIP] ${row.sku} - no images`);
    continue;
  }
  
  if (types.length === 0 || types.length !== imgs.length) {
    console.log(`[NO_TYPES] ${row.sku} - ${imgs.length} imgs, ${types.length} types (mismatch or missing)`);
    noTypesCount++;
    continue;
  }
  
  // Check if first image is already a product type
  const firstType = types[0];
  if (firstType === 'product') {
    alreadyOkCount++;
    continue;
  }
  
  // Find first product-type image
  const firstProductIdx = types.findIndex(t => t === 'product');
  
  if (firstProductIdx === -1) {
    console.log(`[NO_PRODUCT_IMG] ${row.sku} - types: ${types.join(',')}`);
    // No product image at all - keep as is
    noTypesCount++;
    continue;
  }
  
  // Re-order: put product images first, then model/lifestyle
  const pairs = imgs.map((img, i) => ({ img, type: types[i] }));
  const productPairs = pairs.filter(p => p.type === 'product');
  const otherPairs = pairs.filter(p => p.type !== 'product');
  const reordered = [...productPairs, ...otherPairs];
  
  const newImages = reordered.map(p => p.img).join(',');
  const newTypes = reordered.map(p => p.type).join(',');
  
  console.log(`[FIX] ${row.sku} (${row.name.substring(0, 30)}) - was: ${types.join(',')}, now: ${newTypes}`);
  
  await conn.execute(
    'UPDATE products SET images = ?, imageTypes = ? WHERE id = ?',
    [newImages, newTypes, row.id]
  );
  fixedCount++;
}

await conn.end();

console.log(`\n=== Summary ===`);
console.log(`Already correct (product first): ${alreadyOkCount}`);
console.log(`Fixed (reordered):               ${fixedCount}`);
console.log(`No types / no product image:     ${noTypesCount}`);
console.log(`Done!`);
