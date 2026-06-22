import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });

export async function isAdmin(req) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

  const password = (req.headers && typeof req.headers.get === 'function')
    ? req.headers.get('x-admin-password')
    : (req.headers && req.headers['x-admin-password']);

  const sessionToken = (req.headers && typeof req.headers.get === 'function')
    ? req.headers.get('x-session-token')
    : (req.headers && req.headers['x-session-token']);

  if (password && ADMIN_PASSWORD && password === ADMIN_PASSWORD) return true;

  if (sessionToken && DATABASE_URL) {
    try {
      const db = neon(DATABASE_URL);
      await db`CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
      )`;
      const result = await db`SELECT 1 FROM admin_sessions WHERE token = ${sessionToken} AND expires_at > NOW()`;
      return result.length > 0;
    } catch (e) {
      console.error('_auth.js DB Error:', e);
      return false;
    }
  }

  return false;
}
