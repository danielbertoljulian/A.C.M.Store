import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { isAdmin } from './_auth.js';

config({ path: '.env.local', quiet: true });

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured. Set DATABASE_URL in .env.local and restart the dev server.');
  }
  return neon(url);
}

async function ensureTable(db) {
  await db`CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

export async function GET(req) {
  const db = getDb();
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    if (key) {
      const rows = await db`SELECT value FROM admin_settings WHERE key = ${key}`;
      return json({ key, value: rows.length > 0 ? rows[0].value : null });
    }
    const all = await db`SELECT * FROM admin_settings ORDER BY key`;
    const settings = {};
    for (const row of all) {
      settings[row.key] = row.value;
    }
    return json(settings);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function POST(req) {
  if (!(await isAdmin(req))) return json({ error: 'Unauthorized' }, 401);
  const db = getDb();
  try {
    await ensureTable(db);
    const body = await req.json();
    if (body.key && body.value !== undefined) {
      await db`INSERT INTO admin_settings (key, value, updated_at) VALUES (${body.key}, ${body.value}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${body.value}, updated_at = NOW()`;
      return json({ success: true });
    }
    if (typeof body === 'object' && !body.key) {
      for (const [k, v] of Object.entries(body)) {
        await db`INSERT INTO admin_settings (key, value, updated_at) VALUES (${k}, ${String(v)}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = ${String(v)}, updated_at = NOW()`;
      }
      return json({ success: true });
    }
    return json({ error: 'Invalid payload' }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
