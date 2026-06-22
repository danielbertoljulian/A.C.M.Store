import { neon } from '@neondatabase/serverless';
import { isAdmin } from './_auth.js';

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  return neon(url);
}

function getSearchParams(url) {
  const idx = url.indexOf('?');
  if (idx === -1) return new URLSearchParams();
  return new URLSearchParams(url.slice(idx));
}

async function ensureAllTables(db) {
  await db`CREATE TABLE IF NOT EXISTS page_visits (id SERIAL PRIMARY KEY, date DATE NOT NULL DEFAULT CURRENT_DATE, count INTEGER DEFAULT 1, UNIQUE(date))`;
  await db`CREATE TABLE IF NOT EXISTS product_clicks (id SERIAL PRIMARY KEY, product_id TEXT NOT NULL, product_name TEXT NOT NULL, clicked_at TIMESTAMPTZ DEFAULT NOW())`;
  await db`CREATE TABLE IF NOT EXISTS daily_reports (date TEXT PRIMARY KEY, visits_total INTEGER DEFAULT 0, clicks_total INTEGER DEFAULT 0, top_products TEXT DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT NOW())`;
}

export async function GET(req) {
  if (!(await isAdmin(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const db = getDb();
  try {
    const params = getSearchParams(req.url);
    await ensureAllTables(db);

    if (params.get('all') === 'true') {
      const data = await db`SELECT * FROM daily_reports ORDER BY date DESC`;
      return new Response(JSON.stringify(data), { status: 200 });
    }

    const date = params.get('date') || new Date().toISOString().slice(0, 10);
    const [totalVisits] = await db`SELECT COALESCE(SUM(count), 0) AS total FROM page_visits WHERE date = ${date}`;
    const [totalClicks] = await db`SELECT COUNT(*)::int AS total FROM product_clicks WHERE clicked_at::date = ${date}`;
    const topProducts = await db`SELECT product_id, product_name, COUNT(*)::int AS clicks FROM product_clicks WHERE clicked_at::date = ${date} GROUP BY product_id, product_name ORDER BY clicks DESC LIMIT 20`;

    return new Response(JSON.stringify({ date, visits: { total: totalVisits.total }, clicks: { total: totalClicks.total, topProducts } }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function POST(req) {
  if (!(await isAdmin(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const db = getDb();
    const date = new Date().toISOString().slice(0, 10);
    await ensureAllTables(db);

    const [totalVisits] = await db`SELECT COALESCE(SUM(count), 0) AS total FROM page_visits WHERE date = ${date}`;
    const [totalClicks] = await db`SELECT COUNT(*)::int AS total FROM product_clicks WHERE clicked_at::date = ${date}`;
    const topProducts = await db`SELECT product_id, product_name, COUNT(*)::int AS clicks FROM product_clicks WHERE clicked_at::date = ${date} GROUP BY product_id, product_name ORDER BY clicks DESC`;

    await db`INSERT INTO daily_reports (date, visits_total, clicks_total, top_products) VALUES (${date}, ${totalVisits.total}, ${totalClicks.total}, ${JSON.stringify(topProducts)}) ON CONFLICT (date) DO UPDATE SET visits_total = EXCLUDED.visits_total, clicks_total = EXCLUDED.clicks_total, top_products = EXCLUDED.top_products, created_at = NOW()`;

    return new Response(JSON.stringify({ success: true, date }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  if (!(await isAdmin(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const db = getDb();
    const date = getSearchParams(req.url).get('date');
    await ensureAllTables(db);
    await db`DELETE FROM daily_reports WHERE date = ${date}`;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
