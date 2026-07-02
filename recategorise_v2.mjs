/**
 * Re-categorise products using improved LLM vision prompt.
 * Specifically targets the rings category to fix earring misclassifications.
 */
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import fs from 'fs';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.ai';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function classifyJewellery(imageUrl) {
  const absoluteUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `https://jewelshop-dwan7zv7.manus.space${imageUrl}`;

  const body = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: absoluteUrl, detail: 'high' },
          },
          {
            type: 'text',
            text: `Classify this jewellery image into exactly ONE category. Be very precise:

- "rings" = ONLY finger rings (worn on a finger). Do NOT include nose rings/nose pins.
- "necklaces" = necklaces, chains, pendants, chokers, mangalsutras
- "earrings" = earrings, jhumkas, studs, danglers, chandbalis, ear cuffs. A PAIR of matching jewellery pieces shown together is almost always earrings.
- "bracelets" = bracelets, bangles, kadas, wristbands
- "nose-rings" = nose pins, nose rings, nath (small single piece with a curved wire for nose)

Key rules:
- If you see TWO matching pieces side by side, it's earrings.
- If you see a small piece with a curved/screw wire (not a full ring band), it's a nose-ring.
- If you see a full circular band meant for a finger, it's rings.

Respond with ONLY one word: rings, necklaces, earrings, bracelets, or nose-rings.`,
          },
        ],
      },
    ],
    max_tokens: 15,
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
  const valid = ['rings', 'necklaces', 'earrings', 'bracelets', 'nose-rings'];
  return valid.find(v => raw.includes(v.replace('-', '')) || raw.includes(v)) || null;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const logFile = '/tmp/recategorise_v2_log.txt';
  fs.writeFileSync(logFile, `=== Category Fix V2 Started ${new Date().toISOString()} ===\n`);

  const log = (msg) => {
    fs.appendFileSync(logFile, msg + '\n');
    process.stdout.write(msg + '\n');
  };

  // Only re-check products currently in 'rings' category to find misclassified earrings
  const [rows] = await conn.execute(
    "SELECT id, sku, name, category, JSON_UNQUOTE(JSON_EXTRACT(images, '$[0]')) as first_image FROM products WHERE isActive=1 AND category='rings' ORDER BY sku"
  );

  log(`Checking ${rows.length} products currently in 'rings' category...`);

  let fixed = 0;
  let correct = 0;
  const changes = [];

  for (const row of rows) {
    if (!row.first_image) {
      log(`[${row.sku}] SKIP — no image`);
      continue;
    }

    try {
      const detected = await classifyJewellery(row.first_image);
      if (!detected) {
        log(`[${row.sku}] UNCLEAR`);
        continue;
      }

      // Map nose-rings to rings for DB storage (or keep as separate subcategory)
      const dbCategory = detected === 'nose-rings' ? 'rings' : detected;

      if (dbCategory === row.category) {
        log(`[${row.sku}] OK — ${detected} ✓`);
        correct++;
      } else {
        log(`[${row.sku}] FIX: ${row.category} → ${detected} | "${row.name}"`);
        await conn.execute('UPDATE products SET category = ? WHERE id = ?', [dbCategory, row.id]);
        changes.push({ sku: row.sku, name: row.name, from: row.category, to: detected });
        fixed++;
      }

      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      log(`[${row.sku}] ERROR: ${err.message}`);
    }
  }

  log(`\n=== SUMMARY ===`);
  log(`Correct: ${correct} | Fixed: ${fixed}`);
  if (changes.length > 0) {
    log(`\nChanges made:`);
    changes.forEach(c => log(`  ${c.sku}: ${c.from} → ${c.to} | "${c.name}"`));
  }
  log(`=== DONE ${new Date().toISOString()} ===`);

  await conn.end();
}

main().catch(console.error);
