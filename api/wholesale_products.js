import { neon } from '@neondatabase/serverless';

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL nao configurada.');
  return neon(url);
}

async function ensureTable(db) {
  await db`CREATE TABLE IF NOT EXISTS wholesale_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT DEFAULT '',
    brand TEXT DEFAULT '',
    categories TEXT DEFAULT '',
    image TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    description TEXT DEFAULT '',
    sizes TEXT DEFAULT '{}',
    colors TEXT DEFAULT '',
    min_quantity INTEGER DEFAULT 1,
    grade_info TEXT DEFAULT '',
    price_wholesale TEXT DEFAULT '',
    price_varejo TEXT DEFAULT '',
    off TEXT DEFAULT '',
    stock_status TEXT DEFAULT 'pronta_entrega',
    export_to_retail BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  try { await db`ALTER TABLE wholesale_products ADD COLUMN IF NOT EXISTS export_to_retail BOOLEAN DEFAULT false`; } catch {}
}

export async function GET() {
  try {
    const db = getDb();
    await ensureTable(db);
    const data = await db`SELECT * FROM wholesale_products WHERE active = true ORDER BY sort_order ASC, created_at ASC`;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function POST(req) {
  const { isAdmin } = await import('./_auth.js');
  if (!(await isAdmin(req))) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  try {
    const db = getDb();
    await ensureTable(db);
    const body = await req.json();

    const allIds = await db`SELECT id FROM wholesale_products WHERE id ~ '^[0-9]+$'`;
    let maxId = 0;
    for (const row of allIds) {
      const num = parseInt(row.id, 10);
      if (!isNaN(num) && num > maxId) maxId = num;
    }
    let nextId = maxId + 1;
    let exists = await db`SELECT id FROM wholesale_products WHERE id = ${String(nextId)}`;
    while (exists.length > 0) { nextId++; exists = await db`SELECT id FROM wholesale_products WHERE id = ${String(nextId)}`; }
    const id = String(nextId);

    const sizesVal = typeof body.sizes === 'string' ? body.sizes : JSON.stringify(body.sizes || {});
    const imagesVal = Array.isArray(body.images) ? JSON.stringify(body.images) : (body.images || '[]');
    const maxSortRes = await db`SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort FROM wholesale_products`;
    const nextSort = maxSortRes[0]?.next_sort || 1;

    await db`INSERT INTO wholesale_products (id, name, slug, brand, categories, image, images, description, sizes, colors, min_quantity, grade_info, price_wholesale, price_varejo, off, stock_status, export_to_retail, sort_order)
      VALUES (${id}, ${body.name}, ${body.slug || ''}, ${body.brand || ''}, ${body.categories || ''},
              ${body.image || ''}, ${imagesVal}, ${body.description || ''}, ${sizesVal}, ${body.colors || ''},
              ${body.min_quantity || 1}, ${body.grade_info || ''}, ${body.price_wholesale || ''},
              ${body.price_varejo || ''}, ${body.off || ''}, ${body.stock_status || 'pronta_entrega'},
              ${body.export_to_retail === true}, ${nextSort})`;

    const product = await db`SELECT * FROM wholesale_products WHERE id = ${id}`;
    return new Response(JSON.stringify(product[0]), { status: 201 });
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
    const sizesVal = typeof body.sizes === 'string' ? body.sizes : JSON.stringify(body.sizes || {});
    const imagesVal = Array.isArray(body.images) ? JSON.stringify(body.images) : (body.images || '[]');
    const sortOrder = body.sort_order !== undefined ? body.sort_order : 0;

    const updated = await db`UPDATE wholesale_products SET
      name = ${body.name}, slug = ${body.slug || ''}, brand = ${body.brand || ''},
      categories = ${body.categories || ''}, image = ${body.image || ''}, images = ${imagesVal},
      description = ${body.description || ''}, sizes = ${sizesVal}, colors = ${body.colors || ''},
      min_quantity = ${body.min_quantity || 1}, grade_info = ${body.grade_info || ''},
      price_wholesale = ${body.price_wholesale || ''}, price_varejo = ${body.price_varejo || ''},
      off = ${body.off || ''}, stock_status = ${body.stock_status || 'pronta_entrega'},
      export_to_retail = ${body.export_to_retail === true},
      sort_order = ${sortOrder}, active = ${body.active !== false}, updated_at = NOW()
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
    await db`DELETE FROM wholesale_products WHERE id = ${String(id)}`;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
