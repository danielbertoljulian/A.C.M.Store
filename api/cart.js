import { neon } from '@neondatabase/serverless';

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL, POSTGRES_URL ou NEON_DATABASE_URL nao configurada em Production.');
  }
  return neon(url);
}

async function ensureTable(db) {
  await db`CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    items TEXT NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  try { await db`CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id)`; } catch {}
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function getSessionId(req) {
  const sid = (req.headers && typeof req.headers.get === 'function')
    ? req.headers.get('x-session-id')
    : (req.headers && req.headers['x-session-id']);
  return sid || 'default';
}

export async function GET(req) {
  try {
    const db = getDb();
    await ensureTable(db);
    const sessionId = getSessionId(req);
    const rows = await db`SELECT items FROM carts WHERE session_id = ${sessionId}`;
    const items = rows.length > 0 ? JSON.parse(rows[0].items || '[]') : [];
    return json(items);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function POST(req) {
  try {
    const db = getDb();
    await ensureTable(db);
    const sessionId = getSessionId(req);
    const body = await req.json();
    const items = Array.isArray(body) ? body : (body.items || []);
    await db`INSERT INTO carts (session_id, items, updated_at) VALUES (${sessionId}, ${JSON.stringify(items)}, NOW())
      ON CONFLICT (session_id) DO UPDATE SET items = ${JSON.stringify(items)}, updated_at = NOW()`;
    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
