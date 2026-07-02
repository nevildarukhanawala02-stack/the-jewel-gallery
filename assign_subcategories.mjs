import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import fs from 'fs';

config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.ai';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const LOG_FILE = '/tmp/subcategory_log.txt';
fs.writeFileSync(LOG_FILE, `=== Subcategory Assignment Started ${new Date().toISOString()} ===\n`);

function log(msg) {
  fs.appendFileSync(LOG_FILE, msg + '\n');
}

// Subcategory options per category
const SUBCATEGORY_OPTIONS = {
  necklaces: ['pendant', 'choker', 'layered', 'chain', 'statement'],
  bracelets: ['bangle', 'cuff', 'charm', 'tennis', 'stackable'],
  rings: ['solitaire', 'cocktail', 'stackable', 'engagement', 'statement'],
  earrings: ['studs', 'hoops', 'drops', 'chandeliers', 'jhumkas'],
};

// Subcategory descriptions for better LLM understanding
const SUBCATEGORY_DESCRIPTIONS = {
  necklaces: {
    pendant: 'A chain with a single decorative charm or gemstone hanging from it',
    choker: 'A short necklace that sits tightly around the neck',
    layered: 'Multiple chains worn together or a multi-strand necklace',
    chain: 'A simple chain necklace without a prominent pendant',
    statement: 'A bold, large, eye-catching necklace with multiple elements',
  },
  bracelets: {
    bangle: 'A rigid circular bracelet that slips over the wrist (Indian-style bangle/kada)',
    cuff: 'A wide, open-ended rigid bracelet',
    charm: 'A bracelet with small decorative charms attached',
    tennis: 'A thin bracelet with a continuous line of gemstones',
    stackable: 'A thin delicate bracelet meant to be worn with others',
  },
  rings: {
    solitaire: 'A ring with a single prominent gemstone',
    cocktail: 'A bold ring with a large decorative centerpiece',
    stackable: 'A thin delicate ring meant to be worn with others',
    engagement: 'A ring designed for engagement with a prominent diamond or gemstone',
    statement: 'A large bold ring that makes a fashion statement',
  },
  earrings: {
    studs: 'Small earrings that sit directly on the earlobe',
    hoops: 'Circular or semi-circular earrings',
    drops: 'Earrings that hang below the earlobe with a simple drop design',
    chandeliers: 'Elaborate multi-tiered hanging earrings',
    jhumkas: 'Traditional Indian bell-shaped hanging earrings',
  },
};

async function classifySubcategory(imageUrl, category) {
  const options = SUBCATEGORY_OPTIONS[category];
  const descriptions = SUBCATEGORY_DESCRIPTIONS[category];
  
  const descText = options.map(o => `- "${o}": ${descriptions[o]}`).join('\n');
  
  const prompt = `You are a jewellery expert. Look at this image of a ${category.slice(0, -1)} (jewellery item).

Classify it into EXACTLY ONE of these subcategories:
${descText}

Important rules:
- For Indian traditional jewellery with bell shapes → jhumkas (not chandeliers)
- For nose rings/nath (worn on nose) → classify as "statement" for rings
- For beaded/pearl necklaces → pendant or chain depending on design
- For multi-strand or layered designs → layered
- For simple chain with pendant → pendant

Respond with ONLY the subcategory name, nothing else. Choose from: ${options.join(', ')}`;

  const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'low' },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 20,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content.trim().toLowerCase().replace(/[^a-z]/g, '');
  
  // Find best match
  const match = options.find(o => raw.includes(o.replace(/[^a-z]/g, '')));
  return match || options[0];
}

async function getImageUrl(conn, productId) {
  const [rows] = await conn.execute(
    'SELECT images FROM products WHERE id = ?',
    [productId]
  );
  if (!rows.length) return null;
  
  const images = rows[0].images;
  let imageArr;
  if (typeof images === 'string') {
    try { imageArr = JSON.parse(images); } catch { imageArr = [images]; }
  } else {
    imageArr = images;
  }
  
  if (!imageArr || !imageArr.length) return null;
  
  const firstImage = imageArr[0];
  if (firstImage.startsWith('http')) return firstImage;
  
  // Convert /manus-storage/ path to full URL
  return `https://jewelshop-dwan7zv7.manus.space${firstImage}`;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all active products
  const [products] = await conn.execute(
    'SELECT id, sku, name, category, subcategory FROM products WHERE isActive = 1 ORDER BY sku'
  );
  
  log(`Found ${products.length} active products to process`);
  
  let fixed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const product of products) {
    const { id, sku, name, category, subcategory } = product;
    
    if (!SUBCATEGORY_OPTIONS[category]) {
      log(`[${sku}] Unknown category "${category}" — skipping`);
      skipped++;
      continue;
    }
    
    try {
      const imageUrl = await getImageUrl(conn, id);
      if (!imageUrl) {
        log(`[${sku}] No image URL found — skipping`);
        skipped++;
        continue;
      }
      
      const newSubcategory = await classifySubcategory(imageUrl, category);
      
      if (newSubcategory === subcategory) {
        log(`[${sku}] ${name} (${category}) → Already "${subcategory}"`);
      } else {
        await conn.execute(
          'UPDATE products SET subcategory = ? WHERE id = ?',
          [newSubcategory, id]
        );
        log(`[${sku}] ${name} (${category}) → FIXED: "${subcategory}" → "${newSubcategory}"`);
        fixed++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
      
    } catch (err) {
      log(`[${sku}] ERROR: ${err.message}`);
      errors++;
    }
  }
  
  log(`\n=== SUMMARY ===`);
  log(`Total: ${products.length} | Fixed: ${fixed} | Unchanged: ${products.length - fixed - skipped - errors} | Skipped: ${skipped} | Errors: ${errors}`);
  log(`=== DONE ${new Date().toISOString()} ===`);
  
  await conn.end();
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
