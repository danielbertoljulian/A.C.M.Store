import { neon } from '@neondatabase/serverless';

const db = neon('postgresql://neondb_owner:npg_OoP5xYUkLRj0@ep-blue-heart-acun8w7v-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

try {
  const r = await db`SELECT 1 as test`;
  console.log('DB OK:', r);
} catch (e) {
  console.error('DB ERRO:', e.message);
}
