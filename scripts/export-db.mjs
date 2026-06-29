import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse the URL
const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)/);
if (!match) {
  console.error('Could not parse DATABASE_URL');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

console.log(`Connecting to ${host}:${port || 4000} database: ${database}`);

const conn = await mysql.createConnection({
  host,
  port: parseInt(port || '4000'),
  user,
  password,
  database,
  ssl: { rejectUnauthorized: false },
});

const outputFile = '/tmp/jewel-gallery-backup/database/jewel_gallery_dump.sql';
const lines = [];

lines.push(`-- The Jewel Gallery Database Dump`);
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push(`-- Database: ${database}`);
lines.push(`-- Host: ${host}`);
lines.push(``);
lines.push(`SET FOREIGN_KEY_CHECKS=0;`);
lines.push(`SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";`);
lines.push(`SET time_zone = "+00:00";`);
lines.push(``);

// Get all tables
const [tables] = await conn.query(`SHOW TABLES`);
const tableNames = tables.map(row => Object.values(row)[0]);
console.log(`Found tables: ${tableNames.join(', ')}`);

for (const tableName of tableNames) {
  console.log(`Exporting table: ${tableName}`);
  
  // Get CREATE TABLE statement
  const [createResult] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
  const createStatement = createResult[0]['Create Table'];
  
  lines.push(`-- ----------------------------`);
  lines.push(`-- Table structure for ${tableName}`);
  lines.push(`-- ----------------------------`);
  lines.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
  lines.push(createStatement + ';');
  lines.push(``);
  
  // Get all rows
  const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``);
  
  if (rows.length > 0) {
    lines.push(`-- ----------------------------`);
    lines.push(`-- Records of ${tableName} (${rows.length} rows)`);
    lines.push(`-- ----------------------------`);
    
    // Get column names
    const columns = Object.keys(rows[0]);
    
    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const values = batch.map(row => {
        const vals = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 1 : 0;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          // Escape string
          const escaped = String(val)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
          return `'${escaped}'`;
        });
        return `(${vals.join(', ')})`;
      });
      
      lines.push(`INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES`);
      lines.push(values.join(',\n') + ';');
    }
    lines.push(``);
  }
}

lines.push(`SET FOREIGN_KEY_CHECKS=1;`);
lines.push(`-- End of dump`);

fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');
console.log(`\nDatabase dump written to: ${outputFile}`);
console.log(`File size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);

await conn.end();
console.log('Done!');
