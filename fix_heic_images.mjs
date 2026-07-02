/**
 * Fix HEIC product images:
 * - For products with _c.jpg URLs (failed first migration), strip _c to get original HEIC URL
 * - Download original HEIC from storage
 * - Convert to JPEG using heic-convert
 * - Re-upload via correct presigned PUT flow (matching storagePut in storage.ts)
 * - Update DB with new URL
 */

import mysql from 'mysql2/promise';
import heicConvert from 'heic-convert';
import crypto from 'crypto';
// Using native fetch (Node 22 has it built-in)

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = (process.env.BUILT_IN_FORGE_API_URL || '').replace(/\/+$/, '');
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const LOCAL_SERVER = 'http://localhost:3000';

if (!DATABASE_URL || !FORGE_API_URL || !FORGE_API_KEY) {
  console.error('ERROR: Missing env vars');
  process.exit(1);
}

function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const lastDot = relKey.lastIndexOf('.');
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

async function storagePut(relKey, data, contentType = 'image/jpeg') {
  const key = appendHashSuffix(relKey.replace(/^\/+/, ''));

  // 1. Get presigned PUT URL
  const presignUrl = new URL('v1/storage/presign/put', FORGE_API_URL + '/');
  presignUrl.searchParams.set('path', key);
  const presignResp = await fetch(presignUrl.toString(), {
    headers: { Authorization: `Bearer ${FORGE_API_KEY}` },
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text();
    throw new Error(`Presign failed (${presignResp.status}): ${msg.slice(0, 200)}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error('Empty presign URL');

  // 2. PUT to S3
  const putResp = await fetch(s3Url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: data,
  });
  if (!putResp.ok) {
    throw new Error(`S3 PUT failed (${putResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

async function downloadFromStorage(storageUrl) {
  const resp = await fetch(`${LOCAL_SERVER}${storageUrl}`);
  if (!resp.ok) throw new Error(`Download failed: ${resp.status} for ${storageUrl}`);
  return Buffer.from(await resp.arrayBuffer());
}

function isHeic(data) {
  const header = data.slice(0, 20).toString('binary');
  return header.includes('ftyp') && (header.includes('heic') || header.includes('mif1') || header.includes('heif'));
}

async function main() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection(DATABASE_URL);

  const [rows] = await conn.execute('SELECT id, sku, images FROM products');
  
  let converted = 0, skipped = 0, errors = 0;

  for (const row of rows) {
    const { id, sku, images } = row;
    if (!images || !images.length) { skipped++; continue; }

    const newImages = [];
    let changed = false;

    for (const imgUrl of images) {
      if (!imgUrl.startsWith('/manus-storage/')) {
        newImages.push(imgUrl);
        continue;
      }

      const filename = imgUrl.split('/').pop();
      
      // Check if this is a broken _c.jpg URL (from failed first migration)
      const isBroken = filename.includes('_c.jpg') || /_c_[a-f0-9]{8}\.jpg$/.test(filename);
      
      if (!isBroken) {
        // Check if it's a working JPEG or still HEIC
        try {
          const data = await downloadFromStorage(imgUrl);
          if (!isHeic(data)) {
            // Already proper JPEG
            newImages.push(imgUrl);
            skipped++;
            continue;
          }
          // It's HEIC but not broken URL - convert it
          console.log(`  [HEIC] ${sku}: converting ${filename}`);
          const jpegBuffer = Buffer.from(await heicConvert({ buffer: data, format: 'JPEG', quality: 0.9 }));
          const baseKey = imgUrl.replace('/manus-storage/', '').replace(/\.jpg$/, '') + '_jpg';
          const { url: newUrl } = await storagePut(baseKey, jpegBuffer, 'image/jpeg');
          console.log(`  [OK]   ${sku}: ${newUrl}`);
          newImages.push(newUrl);
          changed = true;
          converted++;
        } catch (e) {
          console.error(`  [ERR]  ${sku}: ${e.message}`);
          newImages.push(imgUrl);
          errors++;
        }
        continue;
      }

      // It's a broken _c.jpg URL - get the original HEIC URL by stripping _c
      const originalUrl = imgUrl.replace(/_c(\.jpg)$/, '$1').replace(/_c_[a-f0-9]{8}(\.jpg)$/, '$1');
      console.log(`  [FIX]  ${sku}: ${filename} -> original: ${originalUrl.split('/').pop()}`);

      try {
        const data = await downloadFromStorage(originalUrl);
        
        if (!isHeic(data)) {
          // Original was already JPEG - just use it directly
          console.log(`  [OK]   ${sku}: original is JPEG, using directly`);
          newImages.push(originalUrl);
          changed = true;
          converted++;
          continue;
        }

        // Convert HEIC to JPEG
        console.log(`  [CONV] ${sku}: converting HEIC (${data.length} bytes)...`);
        const jpegBuffer = Buffer.from(await heicConvert({ buffer: data, format: 'JPEG', quality: 0.9 }));
        console.log(`  [CONV] ${sku}: JPEG output ${jpegBuffer.length} bytes`);

        // Upload with clean key (no _c suffix)
        const baseKey = originalUrl.replace('/manus-storage/', '').replace(/\.jpg$/, '') + '_jpg';
        const { url: newUrl } = await storagePut(baseKey, jpegBuffer, 'image/jpeg');
        console.log(`  [OK]   ${sku}: uploaded ${newUrl}`);
        newImages.push(newUrl);
        changed = true;
        converted++;

      } catch (e) {
        console.error(`  [ERR]  ${sku}: ${e.message}`);
        newImages.push(imgUrl);
        errors++;
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 150));
    }

    if (changed) {
      await conn.execute(
        'UPDATE products SET images = ? WHERE id = ?',
        [JSON.stringify(newImages), id]
      );
      console.log(`  [DB]   ${sku}: updated ${newImages.length} image(s)`);
    }
  }

  await conn.end();
  console.log(`\n=== COMPLETE ===`);
  console.log(`Converted: ${converted}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Errors:    ${errors}`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
