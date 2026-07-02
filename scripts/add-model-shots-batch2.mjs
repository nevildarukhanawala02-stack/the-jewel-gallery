import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// SKU -> new model shot storage URL
const modelShots = {
  'TJG-008': '/manus-storage/tjg-008-model_9dcce6ed.jpg',
  'TJG-009': '/manus-storage/tjg-009-model_03d8a65a.jpg',
  'TJG-010': '/manus-storage/tjg-010-model_2b3cfcb6.jpg',
  'TJG-011': '/manus-storage/tjg-011-model_1ccc6b0e.jpg',
  'TJG-012': '/manus-storage/tjg-012-model_ee9707cf.jpg',
  'TJG-013': '/manus-storage/tjg-013-model_fa969e22.jpg',
  'TJG-014': '/manus-storage/tjg-014-model_302cd210.jpg',
  'TJG-015': '/manus-storage/tjg-015-model_d4cf9a8f.jpg',
  'TJG-017': '/manus-storage/tjg-017-model_e5c4ac35.png',
  'TJG-018': '/manus-storage/tjg-018-model_0521d74a.png',
  'TJG-019': '/manus-storage/tjg-019-model_1ec5674c.png',
  'TJG-020': '/manus-storage/tjg-020-model_81817478.png',
  'TJG-021': '/manus-storage/tjg-021-model_6de0b9b3.png',
  'TJG-022': '/manus-storage/tjg-022-model_107c5948.jpg',
  'TJG-023': '/manus-storage/tjg-023-model_4e7c03ad.jpg',
};

const conn = await createConnection(process.env.DATABASE_URL);

let success = 0;
let skipped = 0;

for (const [sku, modelUrl] of Object.entries(modelShots)) {
  const [rows] = await conn.execute(
    'SELECT id, images, imageTypes FROM products WHERE sku = ?',
    [sku]
  );
  
  if (!rows.length) {
    console.log(`[MISS] ${sku}: not found in DB`);
    continue;
  }
  
  const product = rows[0];
  const images = Array.isArray(product.images) ? product.images : [];
  const imageTypes = Array.isArray(product.imageTypes) ? product.imageTypes : [];
  
  // Check if this model URL already exists
  if (images.includes(modelUrl)) {
    console.log(`[SKIP] ${sku}: model shot already added`);
    skipped++;
    continue;
  }
  
  // Remove any existing model type at index 3+ (replace if already has 4 images)
  let newImages, newImageTypes;
  if (images.length >= 4) {
    // Replace the 4th image
    newImages = [...images];
    newImageTypes = [...imageTypes];
    newImages[3] = modelUrl;
    newImageTypes[3] = 'model';
    console.log(`[REPL] ${sku}: replacing 4th image (was ${images[3]})`);
  } else {
    // Append as 4th image
    newImages = [...images, modelUrl];
    newImageTypes = [...imageTypes, 'model'];
    console.log(`[ADD] ${sku}: appending as image #${newImages.length}`);
  }
  
  await conn.execute(
    'UPDATE products SET images = ?, imageTypes = ?, updatedAt = NOW() WHERE id = ?',
    [JSON.stringify(newImages), JSON.stringify(newImageTypes), product.id]
  );
  success++;
}

await conn.end();
console.log(`\nDone: ${success} updated, ${skipped} skipped (already done)`);
