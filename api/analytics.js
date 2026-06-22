import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

function getDb() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL not configured.');
  }

  return neon(connectionString);
}

async function ensureTables(db) {
  await db`
    CREATE TABLE IF NOT EXISTS page_visits (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      count INTEGER NOT NULL DEFAULT 1,
      UNIQUE(date)
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS product_clicks (
      id SERIAL PRIMARY KEY,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL DEFAULT '',
      clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(req) {
  try {
    const db = getDb();
    await ensureTables(db);

    const url = new URL(req.url);
    let body = {};
    try {
      const text = await req.text();
      if (text && text.trim()) body = JSON.parse(text);
    } catch {
      try { body = await req.json(); } catch {}
    }

    const type = (url.searchParams.get('type') || body.type || 'visit').toLowerCase();

    if (type === 'visit') {
      await db`
        INSERT INTO page_visits (date, count)
        VALUES (CURRENT_DATE, 1)
        ON CONFLICT (date)
        DO UPDATE SET count = page_visits.count + 1
      `;
      return json({ success: true, type: 'visit' });
    }

    if (type === 'click') {
      const productId = body.product_id || url.searchParams.get('product_id');
      const productName = body.product_name || url.searchParams.get('product_name') || '';

      if (!productId) return json({ success: true, ignored: true, reason: 'product_id missing' });

      await db`
        INSERT INTO product_clicks (product_id, product_name)
        VALUES (${String(productId)}, ${String(productName)})
      `;
      return json({ success: true, type: 'click' });
    }

    return json({ success: true, ignored: true, reason: 'unknown type', type });
  } catch (error) {
    return json({ success: false, error: error.message }, 500);
  }
}

export async function GET() {
  return json({ success: true, service: 'analytics', status: 'online' });
}
