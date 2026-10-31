// Build the offline edition into dist/: each page in src/ becomes one
// self-contained HTML file, with its stylesheets and scripts inlined and a
// Content-Security-Policy that forbids every network connection. Open
// dist/index.html from disk; the pages link to each other.
//
//   npm run build
//
// Nothing here fetches anything; the output depends only on src/ and the
// git commit it was built from. The pattern is the FSO ITPM Assistant's.

import '../src/assets/ra-citation-links.js';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'dist');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

// Inline scripts and styles only; no connections, forms, frames or base URL.
export const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";

let commit = 'uncommitted';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  if (execSync('git status --porcelain src', { cwd: ROOT }).toString().trim()) commit += '+changes';
} catch {
  // not a git checkout
}
const version = `Version ${pkg.version} · ${commit} · built ${new Date().toISOString().slice(0, 10)}`;

const asset = (name) => readFileSync(join(SRC, 'assets', name), 'utf8');
// '</script' or '</style' inside an inlined file would end the element early.
const safe = (text, tag) => text.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const pages = readdirSync(SRC).filter((f) => f.endsWith('.html'));
for (const page of pages) {
  let html = readFileSync(join(SRC, page), 'utf8');
  const scripts = [];
  html = html.replace(/<script src="assets\/([a-z0-9-]+\.js)" defer><\/script>/g, (_, f) => {
    scripts.push(`<script>/* ${f} */\n${safe(asset(f), 'script')}</script>`);
    return '';
  });
  html = html.replace(/<link rel="stylesheet" href="assets\/([a-z0-9-]+\.css)" \/>/g, (_, f) => `<style>/* ${f} */\n${safe(asset(f), 'style')}</style>`);
  // Deferred scripts ran after parsing; inline ones at the end of the body do the same.
  // Replacements go through functions: a replacement string would read the
  // scripts' own "$$" and "$&" as patterns and corrupt them.
  html = html.replace('</body>', () => `${scripts.join('\n')}\n</body>`);
  html = html.replace('<meta charset="UTF-8" />', () => `<meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
  html = html.replace('{{VERSION}}', () => version);
  if (/(src|href)="assets\//.test(html)) throw new Error(`${page}: an asset was not inlined`);
  html = globalThis.FsoSources.linkHtml(html, 'reporting/industry');
  writeFileSync(join(OUT, page), html);
}
console.log(`Built ${pages.length} pages -> dist/ (${version})`);
