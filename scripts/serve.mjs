/** Loopback-only static server. Mirrors production headers; never modifies browser policy. */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv[2] || '.');
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const headers = Object.fromEntries(config.headers[0].headers.map(h => [h.key, h.value]));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.md':'text/plain; charset=utf-8', '.json':'application/json; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, {Allow:'GET, HEAD'}).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.split('/').some(segment => segment.startsWith('.'))) { res.writeHead(403).end(); return; }
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (!(await stat(file)).isFile()) { res.writeHead(404).end(); return; }
    const specific = pathname === '/becoming.html' ? {'Content-Disposition':'attachment; filename="becoming.html"'} : {};
    res.writeHead(200, {...headers, ...specific, 'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch { res.writeHead(404, {'Content-Type':'text/plain'}).end('Not found'); }
});
server.on('error', error => { console.error(error.message); process.exitCode=1; });
server.listen(port, '127.0.0.1', () => console.log(`Becoming → http://127.0.0.1:${port}`));
