import { put } from '@vercel/blob';
import { isAdmin } from './_auth.js';
import { neon } from '@neondatabase/serverless';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';

function safeFileName(name = 'produto.png') {
  const ext = extname(name).toLowerCase() || '.png';
  const base = name
    .replace(extname(name), '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'produto';

  return `${Date.now()}-${base}${ext}`;
}

function dataUrlToBuffer(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) throw new Error('Imagem invalida');
  return {
    type: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
}

function getDb() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  return neon(url);
}

async function saveImageToDb({ id, fileName, fileType, fileBuffer }) {
  const db = getDb();
  await db`CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    filename TEXT,
    mime_type TEXT NOT NULL,
    data_base64 TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await db`INSERT INTO product_images (id, filename, mime_type, data_base64)
    VALUES (${id}, ${fileName}, ${fileType}, ${fileBuffer.toString('base64')})
    ON CONFLICT (id) DO UPDATE SET
      filename = EXCLUDED.filename,
      mime_type = EXCLUDED.mime_type,
      data_base64 = EXCLUDED.data_base64`;
}

export async function POST(req) {
  try {
    const authResult = await isAdmin(req);
    if (!authResult) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let fileName = '';
    let fileType = 'image/png';
    let fileBuffer = null;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data') && typeof req.formData === 'function') {
      const formData = await req.formData();
      const file = formData.get('image');
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
      }
      fileName = file.name || 'produto.png';
      fileType = file.type || fileType;
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      const body = await req.json();
      if (!body?.dataUrl) {
        return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
      }
      fileName = body.name || 'produto.png';
      const parsed = dataUrlToBuffer(body.dataUrl);
      fileType = body.type || parsed.type || fileType;
      fileBuffer = parsed.buffer;
    }

    const uploadName = safeFileName(fileName);

    if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL) {
      await saveImageToDb({ id: uploadName, fileName, fileType, fileBuffer });
      return new Response(JSON.stringify({ url: `/api/images?id=${encodeURIComponent(uploadName)}` }), { status: 200 });
    }

    const blob = await put(uploadName, fileBuffer, { access: 'private', contentType: fileType });
    return new Response(JSON.stringify({ url: blob.url }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
