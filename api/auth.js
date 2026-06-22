import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

async function ensureTable() {
  const db = neon(DATABASE_URL);
  await db`CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
  )`;
  return db;
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (body.password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Senha incorreta' }), { status: 401 });
    }

    const db = await ensureTable();
    const token = crypto.randomUUID();
    await db`INSERT INTO admin_sessions (token) VALUES (${token})`;

    return new Response(JSON.stringify({ token }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const token = req.headers.get('x-session-token');
    if (!token) {
      return new Response(JSON.stringify({ error: 'No token' }), { status: 400 });
    }
    const db = await ensureTable();
    await db`DELETE FROM admin_sessions WHERE token = ${token}`;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
