import { neon } from '@neondatabase/serverless';

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  return neon(url);
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response('Image id required', { status: 400 });
    }

    const db = getDb();
    const rows = await db`SELECT mime_type, data_base64 FROM product_images WHERE id = ${id} LIMIT 1`;
    if (!rows.length) {
      return new Response('Image not found', { status: 404 });
    }

    const image = rows[0];
    return new Response(Buffer.from(image.data_base64, 'base64'), {
      status: 200,
      headers: {
        'Content-Type': image.mime_type || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
