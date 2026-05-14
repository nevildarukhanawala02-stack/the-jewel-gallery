import mysql2 from 'mysql2/promise';
import crypto from 'crypto';

const FORGE_URL = (process.env.BUILT_IN_FORGE_API_URL || '').replace(/\/+$/, '');
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const DB_URL = process.env.DATABASE_URL;

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

async function migrateProduct(conn, product) {
  let images;
  try { images = JSON.parse(product.imgs); } catch { return 0; }
  if (!Array.isArray(images)) return 0;
  
  let migrated = 0;
  const newImages = [];
  for (const url of images) {
    if (!url || !String(url).includes('drive.google.com')) {
      newImages.push(url);
      continue;
    }
    try {
      console.log(`  Downloading: ${String(url).substring(0, 70)}...`);
      const res = await fetch(url);
      if (!res.ok) { 
        console.log(`  HTTP ${res.status}, keeping original`);
        newImages.push(url); 
        continue; 
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const fileId = String(url).match(/id=([^&]+)/)?.[1] || 'unknown';
      const key = `products/${product.sku}_${fileId.substring(0,8)}.jpg`;
      const { url: newUrl } = await storagePut(key, buf, 'image/jpeg');
      console.log(`  -> ${newUrl}`);
      newImages.push(newUrl);
      migrated++;
    } catch (e) {
      console.log(`  Error: ${e.message}, keeping original`);
      newImages.push(url);
    }
  }
  if (migrated > 0) {
    await conn.query('UPDATE products SET images = ? WHERE id = ?', [JSON.stringify(newImages), product.id]);
    console.log(`  Updated ${product.sku} (${migrated} images migrated)`);
  }
  return migrated;
}

const conn = await mysql2.createConnection(DB_URL);
const [rows] = await conn.query('SELECT id, sku, CAST(images AS CHAR) as imgs FROM products');
const driveProducts = rows.filter(r => String(r.imgs).includes('drive'));
console.log(`Found ${driveProducts.length} products still on Drive`);

let total = 0;
for (const p of driveProducts) {
  console.log(`\nProcessing ${p.sku} (id=${p.id})...`);
  total += await migrateProduct(conn, p);
}
await conn.end();
console.log(`\nDone! Migrated ${total} images total.`);
