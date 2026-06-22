import { config } from 'dotenv';
config({ path: '.env.local' });

import { createServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { pathToFileURL } from 'url';

const PORT = process.env.PORT || 3000;

const httpServer = createHttpServer();

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

httpServer.on('request', async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    const parts = pathname.replace('/api/', '').split('/');
    const fileName = parts[parts.length - 1];
    const dirParts = parts.slice(0, -1);
    const dirPath = dirParts.length > 0 ? dirParts.join('/') : '';

    const apiDir = join(process.cwd(), 'api');
    let filePath;
    if (dirPath) {
      filePath = join(apiDir, dirPath, fileName + '.js');
    } else {
      filePath = join(apiDir, fileName + '.js');
    }

    try {
      const moduleUrl = pathToFileURL(filePath).href;
      const mod = await import(moduleUrl + '?t=' + Date.now());
      const method = req.method.toLowerCase();
      const handler = mod[method] || mod[req.method];

      if (!handler) {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Method not allowed' }));
      }

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        const headers = new Headers();
        Object.entries(req.headers).forEach(([k, v]) => {
          if (v) headers.set(k, Array.isArray(v) ? v.join(',') : v);
        });

        const fakeReq = {
          method: req.method,
          url: req.url,
          headers,
          text: async () => body,
          json: async () => JSON.parse(body),
        };

        try {
          const response = await handler(fakeReq);
          const status = response.status || 200;
          const bodyText = await response.text();
          const responseHeaders = {};
          response.headers?.forEach?.((v, k) => { responseHeaders[k] = v; });
          res.writeHead(status, { ...responseHeaders, 'Content-Type': 'application/json' });
          res.end(bodyText);
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    } catch (e) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API route not found: ' + e.message }));
    }
    return;
  }

  vite.middlewares.handle(req, res);
});

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
