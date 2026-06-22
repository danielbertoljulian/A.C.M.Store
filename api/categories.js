import { neon } from '@neondatabase/serverless';

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  return neon(url);
}

async function ensureTable(db) {
  await db`CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  try { await db`ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT DEFAULT ''`; } catch {}
  try { await db`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`; } catch {}
}

export async function GET() {
  const db = getDb();
  try {
    await ensureTable(db);
    const data = await db`SELECT * FROM categories ORDER BY name ASC`;
    return new Response(JSON.stringify(data), { status: 200 });
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
    if (!body.name || !body.name.trim()) {
      return new Response(JSON.stringify({ error: 'Nome e obrigatorio' }), { status: 400 });
    }
    const name = body.name.trim().toLowerCase();
    const slug = body.slug ? body.slug.trim().toLowerCase().replace(/\s+/g, '-') : name.replace(/\s+/g, '-');
    const image = body.image || '';
    const description = body.description || '';
    const existing = await db`SELECT id FROM categories WHERE name = ${name} OR slug = ${slug}`;
    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: 'Categoria ja existe' }), { status: 409 });
    }
    const result = await db`INSERT INTO categories (name, slug, image, description) VALUES (${name}, ${slug}, ${image}, ${description}) RETURNING *`;
    return new Response(JSON.stringify(result[0]), { status: 201 });
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
    if (!body.id) {
      return new Response(JSON.stringify({ error: 'ID e obrigatorio' }), { status: 400 });
    }
    const image = body.image !== undefined ? body.image : '';
    const description = body.description !== undefined ? body.description : '';
    const updated = await db`UPDATE categories SET image = ${image}, description = ${description} WHERE id = ${parseInt(body.id)} RETURNING *`;
    if (!updated.length) {
      return new Response(JSON.stringify({ error: 'Categoria nao encontrada' }), { status: 404 });
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
    await ensureTable(db);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID e obrigatorio' }), { status: 400 });
    }
    await db`DELETE FROM categories WHERE id = ${parseInt(id)}`;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
