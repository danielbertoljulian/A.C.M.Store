import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

function getDb() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL, POSTGRES_URL ou NEON_DATABASE_URL nao configurada.');
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

  await db`
    CREATE INDEX IF NOT EXISTS idx_clicks_product_id
    ON product_clicks(product_id)
  `;
}

async function readJsonBody(req) {
  try {
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch (error) {
    console.error('Erro ao ler JSON do analytics:', error);
    return {};
  }
}

function normalizeType(type) {
  if (!type) return 'visit';

  const value = String(type).trim().toLowerCase();

  if (['visit', 'view', 'pageview', 'page_view', 'page-visit'].includes(value)) {
    return 'visit';
  }

  if (['click', 'product_click', 'productclick', 'product-click'].includes(value)) {
    return 'click';
  }

  return value;
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
    const body = await readJsonBody(req);

    const type = normalizeType(
      url.searchParams.get('type') ||
      body.type ||
      body.event
    );

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
      const productId =
        body.product_id ||
        body.productId ||
        body.id ||
        url.searchParams.get('product_id') ||
        url.searchParams.get('productId') ||
        url.searchParams.get('id');

      const productName =
        body.product_name ||
        body.productName ||
        body.name ||
        body.title ||
        url.searchParams.get('product_name') ||
        url.searchParams.get('productName') ||
        url.searchParams.get('name') ||
        '';

      if (!productId) {
        console.warn('Analytics click ignorado: product_id ausente.', { body });

        return json({
          success: true,
          ignored: true,
          reason: 'product_id missing',
        });
      }

      await db`
        INSERT INTO product_clicks (product_id, product_name)
        VALUES (${String(productId)}, ${String(productName)})
      `;

      return json({ success: true, type: 'click' });
    }

    console.warn('Analytics type desconhecido ignorado:', type, body);

    return json({
      success: true,
      ignored: true,
      reason: 'unknown type',
      type,
    });
  } catch (error) {
    console.error('Analytics Error:', error);

    return json(
      {
        success: false,
        error: error.message || 'Erro interno no analytics.',
      },
      500
    );
  }
}

export async function GET() {
  return json({
    success: true,
    service: 'analytics',
    status: 'online',
  });
}
