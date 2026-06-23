import { isAdmin } from './_auth.js';
import { extname } from 'path';

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
      const match = /^data:([^;]+);base64,(.+)$/.exec(body.dataUrl || '');
      if (!match) throw new Error('Imagem invalida');
      fileType = body.type || match[1] || fileType;
      fileBuffer = Buffer.from(match[2], 'base64');
    }

    const uploadName = safeFileName(fileName);
    const dataUrl = `data:${fileType};base64,${fileBuffer.toString('base64')}`;

    return new Response(JSON.stringify({ id: uploadName, dataUrl }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
