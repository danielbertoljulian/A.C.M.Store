import { neon } from '@neondatabase/serverless';

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  return neon(url);
}

async function ensureTable(db) {
  await db`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    slug TEXT, brand TEXT, categories TEXT, image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  try { await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]'`; } catch {}
  try { await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS width TEXT DEFAULT ''`; } catch {}
  try { await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS height TEXT DEFAULT ''`; } catch {}
  try { await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS depth TEXT DEFAULT ''`; } catch {}
  try { await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT DEFAULT ''`; } catch {}
  try { await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS price TEXT DEFAULT ''`; } catch {}
  try { await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS off TEXT DEFAULT ''`; } catch {}
  try { await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS instagram_video TEXT DEFAULT ''`; } catch {}
  try { await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`; } catch {}
}

export async function GET() {
  const db = getDb();
  try {
    const data = await db`SELECT * FROM products ORDER BY sort_order ASC, created_at ASC`;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function POST(req) {
  const { isAdmin } = await import('./_auth.js');
  if (!(await isAdmin(req))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const db = getDb();
  try {
    await ensureTable(db);
    const body = await req.json();
    const allIds = await db`SELECT id FROM products WHERE id ~ '^[0-9]+$'`;
    let maxId = 0;
    for (const row of allIds) {
      const num = parseInt(row.id, 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    }
    let nextId = maxId + 1;
    let exists = await db`SELECT id FROM products WHERE id = ${String(nextId)}`;
    while (exists.length > 0) {
      nextId++;
      exists = await db`SELECT id FROM products WHERE id = ${String(nextId)}`;
    }
    const id = String(nextId);
    const imagesVal = Array.isArray(body.images) ? JSON.stringify(body.images) : (body.images || '[]');
    const maxSortRes = await db`SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort FROM products`;
    const nextSort = maxSortRes[0]?.next_sort || 1;
    await db`INSERT INTO products (id, name, slug, brand, categories, image, images, width, height, depth, colors, price, off, instagram_video, sort_order)
      VALUES (${id}, ${body.name}, ${body.slug || ''}, ${body.brand || ''}, ${body.categories || ''},
              ${body.image || ''}, ${imagesVal}, ${body.width || ''}, ${body.height || ''}, ${body.depth || ''}, ${body.colors || ''}, ${body.price || ''}, ${body.off || ''}, ${body.instagram_video || ''}, ${nextSort})`;
    const product = await db`SELECT * FROM products WHERE id = ${id}`;
    return new Response(JSON.stringify(product[0]), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function PUT(req) {
  const { isAdmin } = await import('./_auth.js');
  if (!(await isAdmin(req))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const db = getDb();
  try {
    await ensureTable(db);
    const body = await req.json();
    const imagesVal = Array.isArray(body.images) ? JSON.stringify(body.images) : (body.images || '[]');
    const sortOrder = body.sort_order !== undefined ? body.sort_order : 0;
    const id = String(body.id);

    const updated = await db`UPDATE products SET
      name = ${body.name}, slug = ${body.slug || ''}, brand = ${body.brand || ''},
      categories = ${body.categories || ''}, image = ${body.image || ''}, images = ${imagesVal},
      width = ${body.width || ''}, height = ${body.height || ''}, depth = ${body.depth || ''},
      colors = ${body.colors || ''}, price = ${body.price || ''}, off = ${body.off || ''}, instagram_video = ${body.instagram_video || ''}, sort_order = ${sortOrder}, updated_at = NOW()
      WHERE id = ${id} RETURNING *`;

    if (!updated.length) {
      return new Response(JSON.stringify({ error: 'Not found', id }), { status: 404 });
    }
    return new Response(JSON.stringify(updated[0]), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  const { isAdmin } = await import('./_auth.js');
  if (!(await isAdmin(req))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const db = getDb();
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    await db`DELETE FROM products WHERE id = ${String(id)}`;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
