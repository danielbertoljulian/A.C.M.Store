import { put } from '@vercel/blob';
import { isAdmin } from './_auth.js';

export async function POST(req) {
  try {
    const authResult = await isAdmin(req);
    if (!authResult) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('image');
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server configuration error: missing blob token' }), { status: 500 });
    }

    const blob = await put(file.name, file, { access: 'public' });
    return new Response(JSON.stringify({ url: blob.url }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
