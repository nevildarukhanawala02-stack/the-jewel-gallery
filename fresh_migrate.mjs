/**
 * Fresh migration: reads original Google Drive URLs from CSV,
 * downloads each image, and uploads to Manus storage with
 * hyphenated keys (no spaces) to avoid S3 signed URL issues.
 */
import mysql2 from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const FORGE_URL = (process.env.BUILT_IN_FORGE_API_URL || '').replace(/\/+$/, '');
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const DB_URL = process.env.DATABASE_URL;
const CSV_PATH = '/home/ubuntu/tjg_skus_v3.csv';

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

function extractFileId(driveUrl) {
  // Handle /file/d/{id}/view format
  const match = driveUrl.match(/\/file\/d\/([^/]+)/);
  if (match) return match[1];
  // Handle id= query param
  const idMatch = driveUrl.match(/[?&]id=([^&]+)/);
  if (idMatch) return idMatch[1];
  return null;
}

function buildDirectUrl(driveUrl) {
  const fileId = extractFileId(driveUrl);
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

async function downloadDriveImage(driveUrl) {
  const directUrl = buildDirectUrl(driveUrl);
  if (!directUrl) throw new Error(`Cannot extract file ID from: ${driveUrl}`);
  
  const res = await fetch(directUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; image-downloader)',
    },
    redirect: 'follow',
  });
  
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${directUrl}`);
  
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buf = Buffer.from(await res.arrayBuffer());
  
  // Check if we got an HTML page (Google's virus warning page)
  if (buf.length < 1000 || contentType.includes('text/html')) {
    // Try the thumbnail URL as fallback
    const fileId = extractFileId(driveUrl);
    const thumbUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    const thumbRes = await fetch(thumbUrl);
    if (!thumbRes.ok) throw new Error(`Thumbnail also failed: HTTP ${thumbRes.status}`);
    const thumbBuf = Buffer.from(await thumbRes.arrayBuffer());
    return { buf: thumbBuf, contentType: 'image/jpeg' };
  }
  
  return { buf, contentType: contentType.split(';')[0] };
}

// Parse CSV
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
});

// Build SKU -> Drive URLs map
const skuToUrls = {};
for (const row of records) {
  const sku = (row['SKU'] || '').trim();
  const imageUrls = (row['Image URLS'] || '').trim();
  if (!sku || !imageUrls) continue;
  
  const urls = imageUrls.split(',').map(u => u.trim()).filter(u => u.includes('drive.google.com'));
  if (urls.length > 0) {
    skuToUrls[sku] = urls;
  }
}

console.log(`Found ${Object.keys(skuToUrls).length} SKUs with Drive URLs in CSV`);

const conn = await mysql2.createConnection(DB_URL);
const [products] = await conn.query('SELECT id, sku, CAST(images AS CHAR) as imgs FROM products');

let totalMigrated = 0;
let totalFailed = 0;

for (const product of products) {
  const driveUrls = skuToUrls[product.sku];
  if (!driveUrls || driveUrls.length === 0) continue;
  
  console.log(`\nProcessing ${product.sku} (${driveUrls.length} images)...`);
  
  const newImages = [];
  let migrated = 0;
  
  for (let i = 0; i < driveUrls.length; i++) {
    const driveUrl = driveUrls[i];
    const fileId = extractFileId(driveUrl);
    // Use hyphenated SKU and file ID - no spaces
    const safeSku = product.sku.replace(/\s+/g, '-');
    const key = `products/${safeSku}_${fileId ? fileId.slice(0, 8) : i}.jpg`;
    
    try {
      console.log(`  [${i+1}/${driveUrls.length}] Downloading ${fileId}...`);
      const { buf, contentType } = await downloadDriveImage(driveUrl);
      console.log(`  Downloaded ${buf.length} bytes (${contentType})`);
      
      const { url: newUrl } = await storagePut(key, buf, contentType);
      console.log(`  -> ${newUrl}`);
      newImages.push(newUrl);
      migrated++;
    } catch (e) {
      console.log(`  Error: ${e.message}`);
      totalFailed++;
    }
  }
  
  if (migrated > 0) {
    await conn.query('UPDATE products SET images = ? WHERE id = ?', [JSON.stringify(newImages), product.id]);
    console.log(`  Updated ${product.sku} with ${migrated} new images`);
    totalMigrated += migrated;
  }
}

await conn.end();
console.log(`\n=== Done! ===`);
console.log(`Migrated: ${totalMigrated} images`);
console.log(`Failed: ${totalFailed} images`);
