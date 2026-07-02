/**
 * Re-classify all product images using LLM vision API
 * and reorder so product close-up images come first.
 */

import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { appendFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/$/, '') || 'https://forge.manus.ai';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const BASE_URL = 'https://3000-imp0xi5h7q0v1dhphme9c-3a4dd9ab.sg1.manus.computer';
const LOG_FILE = '/tmp/reclassify_log.txt';

function log(msg) {
  console.log(msg);
  appendFileSync(LOG_FILE, msg + '\n');
}

// Clear log file
writeFileSync(LOG_FILE, `=== Reclassify started at ${new Date().toISOString()} ===\n`);
log(`API URL: ${FORGE_API_URL}`);
log(`API KEY: ${FORGE_API_KEY ? FORGE_API_KEY.substring(0,12) + '...' : 'MISSING'}`);

async function classifyImage(imageUrl) {
  const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
  
  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Classify this jewellery image. Reply with ONLY one word:\n- "product" = jewellery on plain/neutral background, NO human visible\n- "model" = jewellery worn by a person\n- "lifestyle" = jewellery in a scene/context\n\nReply with just: product, model, or lifestyle'
          },
          {
            type: 'image_url',
            image_url: { url: fullUrl, detail: 'low' }
          }
        ]
      }
    ],
    max_tokens: 10
  };

  try {
    const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FORGE_API_KEY}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      const err = await response.text();
      log(`  API error ${response.status}: ${err.substring(0, 100)}`);
      return 'product';
    }

    const json = await response.json();
    const text = (json.choices?.[0]?.message?.content || '').trim().toLowerCase();
    if (text.includes('model')) return 'model';
    if (text.includes('lifestyle')) return 'lifestyle';
    return 'product';
  } catch (e) {
    log(`  Error: ${e.message}`);
    return 'product';
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  'SELECT id, name, sku, isBestseller, images, imageTypes FROM products WHERE isActive = 1 ORDER BY isBestseller DESC, id'
);

log(`\nProcessing ${rows.length} products...\n`);

let fixedCount = 0;
let skippedCount = 0;

for (const row of rows) {
  const imgs = Array.isArray(row.images) ? row.images : [];
  
  if (imgs.length === 0) {
    log(`[SKIP] ${row.sku} - no images`);
    skippedCount++;
    continue;
  }

  log(`[${row.sku}] ${row.name.substring(0, 35)} (${imgs.length} imgs, BS:${row.isBestseller})`);
  
  const newTypes = [];
  for (let i = 0; i < imgs.length; i++) {
    const type = await classifyImage(imgs[i]);
    newTypes.push(type);
    log(`  img[${i+1}]: ${type} - ...${imgs[i].slice(-30)}`);
    await sleep(300);
  }

  // Reorder: product images first, then model, then lifestyle
  const pairs = imgs.map((img, i) => ({ img, type: newTypes[i] }));
  const productPairs = pairs.filter(p => p.type === 'product');
  const modelPairs = pairs.filter(p => p.type === 'model');
  const lifestylePairs = pairs.filter(p => p.type === 'lifestyle');
  const reordered = [...productPairs, ...modelPairs, ...lifestylePairs];

  const newImages = reordered.map(p => p.img);
  const newImageTypes = reordered.map(p => p.type);
  const oldTypes = Array.isArray(row.imageTypes) ? row.imageTypes : [];

  const imagesChanged = JSON.stringify(newImages) !== JSON.stringify(imgs);
  const typesChanged = JSON.stringify(newImageTypes) !== JSON.stringify(oldTypes);

  if (imagesChanged || typesChanged) {
    log(`  → FIXED: [${newImageTypes.join(',')}]`);
    await conn.execute(
      'UPDATE products SET images = ?, imageTypes = ? WHERE id = ?',
      [JSON.stringify(newImages), JSON.stringify(newImageTypes), row.id]
    );
    fixedCount++;
  } else {
    log(`  ✓ Already correct`);
  }
}

await conn.end();

log(`\n=== Summary ===`);
log(`Fixed/updated: ${fixedCount}`);
log(`Skipped:       ${skippedCount}`);
log(`DONE!`);
