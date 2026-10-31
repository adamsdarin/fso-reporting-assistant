// Serve src/ on http://localhost:5193 for development, with the same
// no-network Content-Security-Policy as the built pages (plus 'self', since
// src/ loads its scripts and styles as separate files). --dist serves dist/.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', process.argv.includes('--dist') ? 'dist' : 'src');
const PORT = 5193;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";

createServer((req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  if (path === '' || path.endsWith('/')) path += 'index.html';
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Content-Security-Policy': CSP, 'Cache-Control': 'no-store' });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`Serving ${ROOT} on http://localhost:${PORT}/`));
