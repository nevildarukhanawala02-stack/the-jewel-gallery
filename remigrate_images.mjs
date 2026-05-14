/**
 * Re-migrate all product images to storage keys without spaces.
 * Spaces in S3 keys cause signed URL mismatches (403 Access Denied).
 * This script downloads each image from the old manus-storage URL and
 * re-uploads it with a hyphenated key (no spaces).
 */
import mysql2 from 'mysql2/promise';
import crypto from 'crypto';

const FORGE_URL = (process.env.BUILT_IN_FORGE_API_URL || '').replace(/\/+$/, '');
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const DB_URL = process.env.DATABASE_URL;
const BASE_URL = 'http://localhost:3000';

function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const lastDot = relKey.lastIndexOf('.');
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

async function storagePut(relKey, data, contentType = 'image/jpeg') {
  const key = appendHashSuffix(relKey.replace(/^\/+/, ''));
  const presignUrl = new URL('v1/storage/presign/put', FORGE_URL + '/');
  presignUrl.searchParams.set('path', key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${FORGE_KEY}` },
  });
  if (!presignResp.ok) throw new Error(`Presign failed: ${presignResp.status} ${await presignResp.text()}`);
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error('Forge returned empty presign URL');
  
  const blob = new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!uploadResp.ok) throw new Error(`Upload failed: ${uploadResp.status}`);
  return { key, url: `/manus-storage/${key}` };
}

async function getSignedUrl(key) {
  const getUrl = new URL('v1/storage/presign/get', FORGE_URL + '/');
  getUrl.searchParams.set('path', key);
  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${FORGE_KEY}` },
  });
  if (!resp.ok) throw new Error(`Get presign failed: ${resp.status}`);
  const { url } = await resp.json();
  return url;
}

async function migrateProduct(conn, product) {
  let images;
  try { images = JSON.parse(product.imgs); } catch { return 0; }
  if (!Array.isArray(images) || images.length === 0) return 0;
  
  let migrated = 0;
  const newImages = [];
  
  for (const url of images) {
    const urlStr = String(url || '');
    
    // Check if this URL has a space in the key (the problematic ones)
    if (!urlStr.includes('manus-storage') || !urlStr.includes(' ')) {
      // Already good (no space) or not a manus-storage URL
      newImages.push(url);
      continue;
    }
    
    try {
      // Extract the key from the URL
      const key = urlStr.replace('/manus-storage/', '');
      console.log(`  Re-uploading key with space: ${key}`);
      
      // Get signed URL to download the existing image
      const signedUrl = await getSignedUrl(key);
      const res = await fetch(signedUrl);
      if (!res.ok) {
        console.log(`  Download failed: HTTP ${res.status}`);
        newImages.push(url);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      
      // Create new key with hyphens instead of spaces
      const newKey = key.replace(/ /g, '-');
      const { url: newUrl } = await storagePut(newKey, buf, 'image/jpeg');
      console.log(`  -> ${newUrl}`);
      newImages.push(newUrl);
      migrated++;
    } catch (e) {
      console.log(`  Error: ${e.message}`);
      newImages.push(url);
    }
  }
  
  if (migrated > 0) {
    await conn.query('UPDATE products SET images = ? WHERE id = ?', [JSON.stringify(newImages), product.id]);
    console.log(`  Updated ${product.sku} (${migrated} images re-uploaded)`);
  }
  return migrated;
}

const conn = await mysql2.createConnection(DB_URL);
const [rows] = await conn.query('SELECT id, sku, CAST(images AS CHAR) as imgs FROM products');

// Find products with spaces in their manus-storage keys
const problemProducts = rows.filter(r => {
  const s = String(r.imgs || '');
  return s.includes('manus-storage') && s.includes(' ');
});

console.log(`Found ${problemProducts.length} products with spaces in storage keys`);

let total = 0;
for (const p of problemProducts) {
  console.log(`\nProcessing ${p.sku} (id=${p.id})...`);
  total += await migrateProduct(conn, p);
}
await conn.end();
console.log(`\nDone! Re-uploaded ${total} images total.`);
