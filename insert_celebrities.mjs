import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

const dbUrl = process.env.DATABASE_URL;
console.log('DB URL:', dbUrl ? 'found' : 'not found');

const conn = await mysql.createConnection(dbUrl);

const celebrities = [
  {
    name: 'Poonam Pandey',
    slug: 'poonam-pandey',
    designation: 'Actress & Model',
    imageUrl: '/manus-storage/poonam-pandey-photo-untitled-design_54ed3361.jpg',
    bio: 'Poonam Pandey is a celebrated actress and model known for her bold fashion choices and stunning jewelry looks. Her signature style blends contemporary glamour with timeless elegance.',
    style: 'Statement Pieces',
    occasion: 'Awards Show',
  },
  {
    name: 'Isha Koppikar',
    slug: 'isha-koppikar',
    designation: 'Actress',
    imageUrl: '/manus-storage/isha-koppikar-photo-untitled-design_7435eb2a.jpg',
    bio: 'Isha Koppikar is a renowned actress celebrated for her grace and sophisticated jewelry sensibility. Her timeless style has made her a fashion icon in Indian cinema.',
    style: 'Evening Wear',
    occasion: 'Red Carpet',
  },
  {
    name: 'Bindu Madhavi',
    slug: 'bindu-madhavi',
    designation: 'Actress',
    imageUrl: '/manus-storage/bindu-madhavi-photo-untitled-design_f955b960.jpg',
    bio: 'Bindu Madhavi is a versatile actress known for her elegant and understated jewelry choices. She effortlessly combines traditional craftsmanship with modern aesthetics.',
    style: 'Casual Luxury',
    occasion: 'Event',
  },
  {
    name: 'Neha Chudasama',
    slug: 'neha-chudasama',
    designation: 'Model & Actress',
    imageUrl: '/manus-storage/neha-chudasama-photo-untitled-design_d7581956.jpg',
    bio: 'Neha Chudasama is a celebrated model and actress whose jewelry choices reflect her bold and contemporary style. She is known for wearing statement pieces that command attention.',
    style: 'Statement Pieces',
    occasion: 'Awards Show',
  },
  {
    name: 'Avneet Kaur',
    slug: 'avneet-kaur',
    designation: 'Actress & Influencer',
    imageUrl: '/manus-storage/avneet-kaur-photo-untitled-design_36863a4d.jpg',
    bio: 'Avneet Kaur is a popular actress and social media influencer known for her youthful and vibrant jewelry style. Her looks blend classic elegance with modern trends.',
    style: 'Evening Wear',
    occasion: 'Awards Show',
  },
];

const now = Date.now();
for (const c of celebrities) {
  try {
    const [result] = await conn.execute(
      'INSERT INTO celebrities (name, slug, designation, imageUrl, bio, style, occasion, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [c.name, c.slug, c.designation, c.imageUrl, c.bio, c.style, c.occasion, 1]
    );
    console.log('Inserted:', c.name, 'ID:', result.insertId);
  } catch (err) {
    console.error('Error inserting', c.name, ':', err.message);
  }
}

await conn.end();
console.log('Done!');
