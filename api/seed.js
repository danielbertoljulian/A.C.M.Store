import { neon } from '@neondatabase/serverless';
import products from '../src/data/products.js';
import { isAdmin } from './_auth.js';

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
const sql = neon(DATABASE_URL);

export async function POST(req) {
  if (!(await isAdmin(req))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  try {
    await sql`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT, brand TEXT,
      categories TEXT, image TEXT, images TEXT DEFAULT '[]',
      width TEXT, height TEXT, depth TEXT, colors TEXT, price TEXT DEFAULT '', off TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    let count = 0;
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const existing = await sql`SELECT id FROM products WHERE id = ${p.id}`;
      if (!existing.length) {
        await sql`INSERT INTO products (id, name, slug, brand, categories, image, images, price, off, sort_order)
          VALUES (${p.id}, ${p.name}, ${p.slug || ''}, ${p.brand || ''}, ${p.categories || ''},
                  ${p.image || ''}, '[]', ${p.price || ''}, ${p.off || ''}, ${i + 1})`;
        count++;
      }
    }
    return new Response(JSON.stringify({ imported: count, total: products.length }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
