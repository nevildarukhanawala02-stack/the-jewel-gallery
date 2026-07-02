/**
 * Re-categorise all products using LLM vision.
 * Classifies each product as: rings | necklaces | earrings | bracelets
 * based on the first (product close-up) image.
 */
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import fs from 'fs';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.ai';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function classifyJewelleryType(imageUrl) {
  // Build absolute URL if relative
  const absoluteUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `https://jewelshop-dwan7zv7.manus.space${imageUrl}`;

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: absoluteUrl, detail: 'low' },
          },
          {
            type: 'text',
            text: `Look at this jewellery image and classify it into exactly ONE of these categories:
- rings (finger rings)
- necklaces (necklaces, pendants, chains, chokers, mangalsutras)
- earrings (earrings, jhumkas, studs, danglers, ear cuffs)
- bracelets (bracelets, bangles, kadas, anklets, wristbands)

Respond with ONLY one word: rings, necklaces, earrings, or bracelets.`,
          },
        ],
      },
    ],
    max_tokens: 10,
  };

  const res = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim().toLowerCase() || '';
  const valid = ['rings', 'necklaces', 'earrings', 'bracelets'];
  return valid.find(v => raw.includes(v)) || null;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const logFile = '/tmp/recategorise_log.txt';
  fs.writeFileSync(logFile, `=== Category Fix Started ${new Date().toISOString()} ===\n`);

  const log = (msg) => {
    fs.appendFileSync(logFile, msg + '\n');
    process.stdout.write(msg + '\n');
  };

  const [rows] = await conn.execute(
    'SELECT id, sku, name, category, images FROM products WHERE isActive=1 ORDER BY sku'
  );

  log(`Total active products: ${rows.length}`);

  let fixed = 0;
  let correct = 0;
  let failed = 0;
  const changes = [];

  for (const row of rows) {
    const images = Array.isArray(row.images) ? row.images : [];
    if (images.length === 0) {
      log(`[${row.sku}] SKIP — no images`);
      failed++;
      continue;
    }

    const firstImage = images[0];
    try {
      const detected = await classifyJewelleryType(firstImage);
      if (!detected) {
        log(`[${row.sku}] UNCLEAR — could not classify (current: ${row.category})`);
        failed++;
        continue;
      }

      if (detected === row.category) {
        log(`[${row.sku}] OK — ${row.category} ✓`);
        correct++;
      } else {
        log(`[${row.sku}] FIX: ${row.category} → ${detected} | "${row.name}"`);
        await conn.execute('UPDATE products SET category = ? WHERE id = ?', [detected, row.id]);
        changes.push({ sku: row.sku, name: row.name, from: row.category, to: detected });
        fixed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      log(`[${row.sku}] ERROR: ${err.message}`);
      failed++;
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`Correct: ${correct} | Fixed: ${fixed} | Failed/Unclear: ${failed}`);
  if (changes.length > 0) {
    log(`\nChanges made:`);
    changes.forEach(c => log(`  ${c.sku}: ${c.from} → ${c.to} | "${c.name}"`));
  }
  log(`=== DONE ${new Date().toISOString()} ===`);

  await conn.end();
}

main().catch(console.error);
