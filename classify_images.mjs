/**
 * Classify product images as 'product' (jewellery on plain/white background)
 * or 'model' (person wearing jewellery) using LLM vision.
 * Stores results in the imageTypes JSON column.
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = (process.env.BUILT_IN_FORGE_API_URL || '').replace(/\/+$/, '');
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const LOCAL_SERVER = 'http://localhost:3000';

if (!DATABASE_URL || !FORGE_API_URL || !FORGE_API_KEY) {
  console.error('ERROR: Missing env vars');
  process.exit(1);
}

async function classifyImage(imageUrl) {
  const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${LOCAL_SERVER}${imageUrl}`;
  
  const resp = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: fullUrl, detail: 'low' },
            },
            {
              type: 'text',
              text: 'Is this image: (A) a jewellery product shot on a plain/white/neutral background with no person, or (B) a model/person wearing the jewellery? Reply with only the single letter A or B.',
            },
          ],
        },
      ],
      max_tokens: 5,
    }),
  });

  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(`LLM API error ${resp.status}: ${msg.slice(0, 100)}`);
  }

  const data = await resp.json();
  const answer = data.choices?.[0]?.message?.content?.trim().toUpperCase();
  if (answer === 'A') return 'product';
  if (answer === 'B') return 'model';
  // Default to product if unclear
  console.log(`  [WARN] Unclear answer: "${answer}", defaulting to product`);
  return 'product';
}

async function main() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection(DATABASE_URL);

  const [rows] = await conn.execute(
    'SELECT id, sku, images, imageTypes FROM products WHERE images IS NOT NULL'
  );

  let classified = 0, skipped = 0, errors = 0;

  for (const row of rows) {
    const { id, sku, images, imageTypes } = row;
    if (!images || !images.length) { skipped++; continue; }

    // Skip if already classified
    if (imageTypes && imageTypes.length === images.length) {
      console.log(`  [SKIP] ${sku}: already classified`);
      skipped++;
      continue;
    }

    console.log(`  [CLASSIFY] ${sku}: ${images.length} images`);
    const types = [];

    for (let i = 0; i < images.length; i++) {
      try {
        const type = await classifyImage(images[i]);
        types.push(type);
        console.log(`    [${i}] ${type}: ${images[i].split('/').pop()}`);
        classified++;
      } catch (e) {
        console.error(`    [ERR] image ${i}: ${e.message}`);
        types.push('product'); // default
        errors++;
      }
      // Small delay between requests
      await new Promise(r => setTimeout(r, 200));
    }

    await conn.execute(
      'UPDATE products SET imageTypes = ? WHERE id = ?',
      [JSON.stringify(types), id]
    );
    console.log(`  [DB] ${sku}: saved types [${types.join(', ')}]`);
  }

  await conn.end();
  console.log(`\n=== COMPLETE ===`);
  console.log(`Classified: ${classified}`);
  console.log(`Skipped:    ${skipped}`);
  console.log(`Errors:     ${errors}`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
