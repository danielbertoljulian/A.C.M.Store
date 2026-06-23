import { neon } from '@neondatabase/serverless';

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL nao configurada.');
  return neon(url);
}

async function ensureTable(db) {
  await db`CREATE TABLE IF NOT EXISTS wholesale_requests (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_store TEXT DEFAULT '',
    client_phone TEXT DEFAULT '',
    client_email TEXT DEFAULT '',
    client_cnpj TEXT DEFAULT '',
    products TEXT DEFAULT '[]',
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

export async function GET(req) {
  const { isAdmin } = await import('./_auth.js');
  if (!(await isAdmin(req))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  try {
    const db = getDb();
    await ensureTable(db);
    const data = await db`SELECT * FROM wholesale_requests ORDER BY created_at DESC`;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const db = getDb();
    await ensureTable(db);
    const body = await req.json();

    const id = `WR_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const productsVal = Array.isArray(body.products) ? JSON.stringify(body.products) : '[]';

    await db`INSERT INTO wholesale_requests (id, client_name, client_store, client_phone, client_email, client_cnpj, products, notes)
      VALUES (${id}, ${body.client_name}, ${body.client_store || ''}, ${body.client_phone || ''},
              ${body.client_email || ''}, ${body.client_cnpj || ''}, ${productsVal}, ${body.notes || ''})`;

    return new Response(JSON.stringify({ id, success: true }), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function PUT(req) {
  const { isAdmin } = await import('./_auth.js');
  if (!(await isAdmin(req))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  try {
    const db = getDb();
    await ensureTable(db);
    const body = await req.json();
    const id = String(body.id);

    const updated = await db`UPDATE wholesale_requests SET status = ${body.status}, updated_at = NOW()
      WHERE id = ${id} RETURNING *`;

    if (!updated.length) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(JSON.stringify(updated[0]), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  const { isAdmin } = await import('./_auth.js');
  if (!(await isAdmin(req))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  try {
    const db = getDb();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    await db`DELETE FROM wholesale_requests WHERE id = ${String(id)}`;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
