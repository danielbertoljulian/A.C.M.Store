import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_OoP5xYUkLRj0@ep-blue-heart-acun8w7v-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

async function ensureTables(db) {
  await db`CREATE TABLE IF NOT EXISTS page_visits (id SERIAL PRIMARY KEY, date DATE NOT NULL DEFAULT CURRENT_DATE, count INTEGER NOT NULL DEFAULT 1, UNIQUE(date))`;
  await db`CREATE TABLE IF NOT EXISTS product_clicks (id SERIAL PRIMARY KEY, product_id TEXT NOT NULL, product_name TEXT NOT NULL DEFAULT '', clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
}

async function test() {
  const db = neon(DATABASE_URL);

  try {
    await ensureTables(db);
    console.log('Tables OK');

    await db`INSERT INTO page_visits (date, count) VALUES (CURRENT_DATE, 1) ON CONFLICT (date) DO UPDATE SET count = page_visits.count + 1`;
    console.log('Visit inserted');

    const [total] = await db`SELECT COALESCE(SUM(count), 0) AS total FROM page_visits WHERE date = CURRENT_DATE`;
    console.log('Total visits today:', total.total);

    await db`INSERT INTO product_clicks (product_id, product_name) VALUES ('1', 'Teste')`;
    console.log('Click inserted');

    const [clicks] = await db`SELECT COUNT(*)::int AS total FROM product_clicks WHERE clicked_at::date = CURRENT_DATE`;
    console.log('Total clicks today:', clicks.total);

  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('Full:', e);
  }
}

test();
