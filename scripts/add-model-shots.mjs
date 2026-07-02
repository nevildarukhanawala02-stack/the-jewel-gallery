import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load env
dotenv.config({ path: '.env' });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// SKU -> storage URL mapping (27 SKUs from Google Drive)
const skuModelUrls = {
  'TJG-001': '/manus-storage/Untitled design - 1_cea2c393.PNG',
  'TJG-002': '/manus-storage/Untitled design - 2_79d590ce.PNG',
  'TJG-003': '/manus-storage/Untitled design - 3_ae91c948.PNG',
  'TJG-004': '/manus-storage/Untitled design - 1_a8513d34.jpg',
  'TJG-005': '/manus-storage/Untitled design - 2_d13b480a.PNG',
  'TJG-006': '/manus-storage/Untitled design - 3_be2ee600.PNG',
  'TJG-024': '/manus-storage/IMG_2610_f86cf866.jpg',
  'TJG-025': '/manus-storage/IMG_2611_7ca2ed65.jpg',
  'TJG-026': '/manus-storage/IMG_2612_a25fdb59.jpg',
  'TJG-027': '/manus-storage/IMG_2613_9c54df14.jpg',
  'TJG-028': '/manus-storage/IMG_2614_8c316d4a.jpg',
  'TJG-029': '/manus-storage/Untitled design - 2_22474120.PNG',
  'TJG-030': '/manus-storage/Untitled design - 3_ed64f1a0.PNG',
  'TJG-032': '/manus-storage/Untitled design - 4_3387fd04.PNG',
  'TJG-033': '/manus-storage/IMG_2615_c9e2e4ad.jpg',
  'TJG-034': '/manus-storage/IMG_2616_7451dda8.jpg',
  'TJG-035': '/manus-storage/IMG_2617_2b6c7e85.jpg',
  'TJG-036': '/manus-storage/IMG_2618_867169dd.jpg',
  'TJG-037': '/manus-storage/IMG_2619_c753bf4b.jpg',
  'TJG-038': '/manus-storage/IMG_2624_8c48861b.jpg',
  'TJG-039': '/manus-storage/IMG_6402_848c7990.jpg',
  'TJG-040': '/manus-storage/IMG_6360_f67de4b2.jpg',
  'TJG-041': '/manus-storage/IMG_6413_fcfe4bde.jpg',
  'TJG-042': '/manus-storage/IMG_6417_c244b018.jpg',
  'TJG-043': '/manus-storage/IMG_6421_3da77236.jpg',
  'TJG-044': '/manus-storage/IMG_6426_120bebf8.jpg',
  'TJG-045': '/manus-storage/IMG_6431_55658698.jpg',
};

const conn = await createConnection(DATABASE_URL);

let success = 0, skipped = 0, failed = 0;

for (const [sku, modelUrl] of Object.entries(skuModelUrls)) {
  // Get current product
  const [rows] = await conn.execute('SELECT id, sku, images, imageTypes FROM products WHERE sku = ?', [sku]);
  
  if (!rows.length) {
    console.log(`[MISS] ${sku}: not found in DB`);
    failed++;
    continue;
  }
  
  const product = rows[0];
  // mysql2 auto-parses JSON columns into arrays
  const currentImages = Array.isArray(product.images) ? product.images : (product.images ? product.images.split(',') : []);
  const currentTypes = Array.isArray(product.imageTypes) ? product.imageTypes : (product.imageTypes ? product.imageTypes.split(',') : []);
  
  // Check if this exact model URL already exists
  if (currentImages.includes(modelUrl)) {
    console.log(`[SKIP] ${sku}: model shot already present`);
    skipped++;
    continue;
  }
  
  // Append model shot
  const newImages = [...currentImages, modelUrl];
  const newTypes = [...currentTypes, 'model'];
  
  await conn.execute(
    'UPDATE products SET images = ?, imageTypes = ?, updatedAt = NOW() WHERE id = ?',
    [JSON.stringify(newImages), JSON.stringify(newTypes), product.id]
  );
  
  console.log(`[OK] ${sku} (id=${product.id}): ${currentImages.length} → ${newImages.length} images`);
  success++;
}

await conn.end();
console.log(`\nDone: ${success} added, ${skipped} skipped, ${failed} not found`);
