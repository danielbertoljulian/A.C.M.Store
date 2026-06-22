import { neon } from '@neondatabase/serverless';
import { isAdmin } from './_auth.js';

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  return neon(url);
}

export async function POST(req) {
  if (!(await isAdmin(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const db = getDb();
  try {
    try { await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`; } catch {}
    const body = await req.json();
    for (const item of body.orders) {
      await db`UPDATE products SET sort_order = ${item.sort_order} WHERE id = ${String(item.id)}`;
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
