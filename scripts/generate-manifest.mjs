import mysql from 'mysql2/promise';
import fs from 'fs';

const url = process.env.DATABASE_URL;
const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)/);
const [, user, password, host, port, database] = match;

const conn = await mysql.createConnection({
  host,
  port: parseInt(port || '4000'),
  user,
  password,
  database,
  ssl: { rejectUnauthorized: false },
});

const [rows] = await conn.query('SELECT sku, name, images, imageTypes FROM products ORDER BY sku');

const lines = [
  '# Storage Image Manifest',
  `# Generated: ${new Date().toISOString()}`,
  '# All product image URLs stored in Manus storage (/manus-storage/)',
  '# These URLs are served via the Manus storage proxy',
  '',
];

for (const row of rows) {
  // images may be a Buffer, string, or array depending on DB driver
  let imagesRaw = row.images;
  let typesRaw = row.imageTypes;
  if (Buffer.isBuffer(imagesRaw)) imagesRaw = imagesRaw.toString('utf8');
  if (Buffer.isBuffer(typesRaw)) typesRaw = typesRaw.toString('utf8');
  let images = [];
  let types = [];
  try {
    images = typeof imagesRaw === 'string' ? imagesRaw.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(imagesRaw) ? imagesRaw : []);
  } catch(e) { images = []; }
  try {
    types = typeof typesRaw === 'string' ? typesRaw.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(typesRaw) ? typesRaw : []);
  } catch(e) { types = []; }
  lines.push(`## ${row.sku} - ${row.name}`);
  images.forEach((img, i) => {
    lines.push(`  [${types[i] || 'unknown'}] ${img}`);
  });
  lines.push('');
}

fs.writeFileSync('/tmp/jewel-gallery-backup/assets/storage-image-manifest.md', lines.join('\n'));
console.log(`Manifest written, ${rows.length} products`);

await conn.end();
