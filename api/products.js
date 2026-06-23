import { neon } from '@neondatabase/serverless';

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL, POSTGRES_URL ou NEON_DATABASE_URL nao configurada em Production.');
  }
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

async function saveProductImages(db, productId, imageUrls) {
  await db`CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    filename TEXT,
    mime_type TEXT NOT NULL,
    data_base64 TEXT NOT NULL,
    product_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  try { await db`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS product_id TEXT`; } catch {}

  for (const url of imageUrls) {
    const match = /^\/api\/images\?id=(.+)$/.exec(url);
    if (match) {
      await db`UPDATE product_images SET product_id = ${productId} WHERE id = ${decodeURIComponent(match[1])}`;
      continue;
    }
    const dataMatch = /^data:([^;]+);base64,(.+)$/.exec(url);
    if (dataMatch) {
      const id = `${productId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const mimeType = dataMatch[1];
      const base64 = dataMatch[2];
      await db`INSERT INTO product_images (id, filename, mime_type, data_base64, product_id)
        VALUES (${id}, ${id}, ${mimeType}, ${base64}, ${productId})`;
    }
  }
}

export async function GET() {
  try {
    const db = getDb();
    await ensureTable(db);
    const data = await db`SELECT * FROM products ORDER BY sort_order ASC, created_at ASC`;

    let wholesaleExported = [];
    try {
      const ws = await db`SELECT * FROM wholesale_products WHERE export_to_retail = true AND active = true ORDER BY sort_order ASC, created_at ASC`;
      wholesaleExported = ws.map(p => ({
        id: `ws_${p.id}`,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        categories: p.categories,
        image: p.image,
        images: p.images,
        price: p.price_varejo || p.price_wholesale || '',
        off: p.off,
        colors: p.colors,
        width: '',
        height: '',
        depth: '',
        instagram_video: '',
        sort_order: p.sort_order,
        is_wholesale_export: true,
        wholesale_id: p.id,
        price_wholesale: p.price_wholesale,
        price_varejo: p.price_varejo,
        description: p.description,
        sizes: p.sizes,
        min_quantity: p.min_quantity,
        grade_info: p.grade_info,
        stock_status: p.stock_status
      }));
    } catch {}

    const merged = [...data, ...wholesaleExported].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return new Response(JSON.stringify(merged), {
      status: 200,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Vary': 'Accept-Encoding' }
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
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const body = await req.json();

    if (action === 'seed') {
      const defaultProducts = [
        { id: '1', name: 'Camiseta Lacoste Color Block', slug: 'camiseta-lacoste-color-block', brand: 'Lacoste', categories: 'camisetas', image: '/Produtos_1/Produto_1.png', price: '399,00', off: '10' },
        { id: '2', name: 'Polo Tommy Hilfiger Classic', slug: 'polo-tommy-hilfiger-classic', brand: 'Tommy Hilfiger', categories: 'polos', image: '/Produtos_1/Produto_2.png', price: '449,00', off: '' },
        { id: '3', name: 'Camiseta Quiksilver Surf', slug: 'camiseta-quiksilver-surf', brand: 'Quiksilver', categories: 'camisetas,esportivo', image: '/Produtos_1/Produto_1.png', price: '299,00', off: '15' },
        { id: '4', name: 'Tenis Mizuno Wave', slug: 'tenis-mizuno-wave', brand: 'Mizuno', categories: 'tenis,esportivo', image: '/Produtos_1/Produto_2.png', price: '599,00', off: '' }
      ];
      let count = 0;
      for (let i = 0; i < defaultProducts.length; i++) {
        const p = defaultProducts[i];
        const existing = await db`SELECT id FROM products WHERE id = ${p.id}`;
        if (!existing.length) {
          await db`INSERT INTO products (id, name, slug, brand, categories, image, images, price, off, sort_order)
            VALUES (${p.id}, ${p.name}, ${p.slug}, ${p.brand}, ${p.categories}, ${p.image}, '[]', ${p.price}, ${p.off}, ${i + 1})`;
          count++;
        }
      }
      return new Response(JSON.stringify({ imported: count, total: defaultProducts.length }), { status: 200 });
    }

    if (action === 'reorder') {
      for (const item of (body.orders || [])) {
        await db`UPDATE products SET sort_order = ${item.sort_order} WHERE id = ${String(item.id)}`;
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

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

    let imageUrls = [];
    try { imageUrls = JSON.parse(imagesVal); } catch {}
    if (imageUrls.length > 0) {
      await saveProductImages(db, id, imageUrls);
    }

    const product = await db`SELECT * FROM products WHERE id = ${id}`;
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

    let imageUrls = [];
    try { imageUrls = JSON.parse(imagesVal); } catch {}
    await db`DELETE FROM product_images WHERE product_id = ${id}`;
    if (imageUrls.length > 0) {
      await saveProductImages(db, id, imageUrls);
    }

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
    await db`DELETE FROM product_images WHERE product_id = ${String(id)}`;
    await db`DELETE FROM products WHERE id = ${String(id)}`;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
