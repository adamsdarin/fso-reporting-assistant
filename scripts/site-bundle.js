// Package the offline edition for the FSOtools website (fsotools-website,
// an import script like its `npm run import-itpm`), the way the FSO ITPM
// Assistant and the Adjudication Atlas are packaged:
//
//   npm run site-bundle
//
// writes site-bundle/:
//   app/*.html                              the built pages, byte for byte from dist/
//   fso-reporting-assistant-offline.zip     the same pages in one download
//   reporting.json                          version, commit, whether the tree was
//                                           clean, and the SHA-256 of every file
//
// The website refuses a bundle whose files do not match reporting.json, or one
// built from uncommitted changes, so what goes live traces to a commit.

import { createHash } from 'node:crypto';
import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'site-bundle');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

execFileSync(process.execPath, [join(ROOT, 'scripts', 'build.js')], { cwd: ROOT, stdio: 'inherit' });

let commit = 'uncommitted';
let dirty = true;
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  dirty = execSync('git status --porcelain', { cwd: ROOT }).toString().trim() !== '';
} catch {
  // not a git checkout: stays dirty
}

// The same store-only ZIP writer the pages use for .xlsx files.
const ctx = { TextEncoder };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(join(ROOT, 'src', 'assets', 'ra-xlsx.js'), 'utf8'), ctx);

const pages = readdirSync(DIST).filter((f) => f.endsWith('.html')).sort();
const readme = `FSO Reporting Assistant ${pkg.version} (${commit})

Reporting decision aid for the FSO of a cleared contractor: do I report
this, to whom, by when; a printable file note; a reporting log. Open
index.html in a web browser. The pages work offline, make no network
connections and save nothing: keep your records in the Excel workbook
they create, in access-restricted company storage.

A preparation aid, not a determination and not legal advice.
https://fsotools.ai/reporting/aid/
`;
const ZIP = 'fso-reporting-assistant-offline.zip';
const zip = ctx.ItpXlsx.zip([...pages.map((p) => [`fso-reporting-assistant/${p}`, readFileSync(join(DIST, p), 'utf8')]), ['fso-reporting-assistant/README.txt', readme]]);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'app'), { recursive: true });
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const files = {};
for (const p of pages) {
  const bytes = readFileSync(join(DIST, p));
  writeFileSync(join(OUT, 'app', p), bytes);
  files[`app/${p}`] = sha(bytes);
}
writeFileSync(join(OUT, ZIP), zip);
files[ZIP] = sha(zip);
const manifest = { name: pkg.name, version: pkg.version, commit, dirty, built: new Date().toISOString().slice(0, 10), zip: ZIP, zipBytes: zip.length, pages, files };
writeFileSync(join(OUT, 'reporting.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`site-bundle/: ${pages.length} pages + ${ZIP} (${Math.round(zip.length / 1024)} KB) · ${commit}${dirty ? ' (dirty: commit before importing)' : ''}`);
