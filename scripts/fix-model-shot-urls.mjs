import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Map of SKU -> old broken URL -> new clean URL
const fixes = {
  'TJG-001': { old: '/manus-storage/Untitled design - 1_cea2c393.PNG', new: '/manus-storage/tjg-001-model_fedd5da4.png' },
  'TJG-002': { old: '/manus-storage/Untitled design - 2_79d590ce.PNG', new: '/manus-storage/tjg-002-model_5918970a.png' },
  'TJG-003': { old: '/manus-storage/Untitled design - 3_ae91c948.PNG', new: '/manus-storage/tjg-003-model_e1c46afd.png' },
  'TJG-004': { old: '/manus-storage/Untitled design - 1_a8513d34.jpg', new: '/manus-storage/tjg-004-model_ddab4db6.jpg' },
  'TJG-005': { old: '/manus-storage/Untitled design - 2_d13b480a.PNG', new: '/manus-storage/tjg-005-model_c3033ca5.png' },
  'TJG-006': { old: '/manus-storage/Untitled design - 3_be2ee600.PNG', new: '/manus-storage/tjg-006-model_2a8372ba.png' },
  'TJG-029': { old: '/manus-storage/Untitled design - 2_22474120.PNG', new: '/manus-storage/tjg-029-model_d155b4f1.png' },
  'TJG-030': { old: '/manus-storage/Untitled design - 3_ed64f1a0.PNG', new: '/manus-storage/tjg-030-model_0bd52b95.png' },
  'TJG-032': { old: '/manus-storage/Untitled design - 4_3387fd04.PNG', new: '/manus-storage/tjg-032-model_537b6a2c.png' },
};

const conn = await createConnection(process.env.DATABASE_URL);

let success = 0;
for (const [sku, { old: oldUrl, new: newUrl }] of Object.entries(fixes)) {
  const [rows] = await conn.execute('SELECT id, images, imageTypes FROM products WHERE sku = ?', [sku]);
  if (!rows.length) { console.log(`[MISS] ${sku}`); continue; }
  
  const product = rows[0];
  const images = Array.isArray(product.images) ? product.images : [];
  const idx = images.indexOf(oldUrl);
  
  if (idx === -1) {
    console.log(`[SKIP] ${sku}: old URL not found (may already be fixed)`);
    continue;
  }
  
  images[idx] = newUrl;
  await conn.execute('UPDATE products SET images = ?, updatedAt = NOW() WHERE id = ?', [JSON.stringify(images), product.id]);
  console.log(`[OK] ${sku}: replaced broken URL at index ${idx}`);
  success++;
}

await conn.end();
console.log(`\nFixed ${success} products`);
