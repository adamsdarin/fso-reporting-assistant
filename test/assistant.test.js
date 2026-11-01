// Tests for the FSO Reporting Assistant: the event data and decision engine,
// the workbook writer and rules (run in a sandbox, since they are browser
// scripts), the source pages, the citations, and the offline build in dist/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { crc32 } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => readFileSync(join(ROOT, 'src', p), 'utf8');
const dist = (p) => readFileSync(join(ROOT, 'dist', p), 'utf8');
const PAGES = ['index.html', 'decide.html', 'file-note.html'];
const SCRIPTS = ['ra-citation-links.js', 'ra-xlsx.js', 'ra-workbook.js', 'ra-events.js', 'ra-hub.js', 'ra-decide.js', 'ra-file-note.js'];
const WEBSITE = join(ROOT, '..', 'fsotools-website', 'site', 'reporting', 'industry', 'index.html');
const ITPM_XLSX = join(ROOT, '..', 'fso-itpm-assistant', 'src', 'assets', 'itp-xlsx.js');
const ITPM_WORKBOOK = join(ROOT, '..', 'fso-itpm-assistant', 'src', 'assets', 'itp-workbook.js');

execFileSync(process.execPath, [join(ROOT, 'scripts', 'build.js')], { cwd: ROOT, stdio: 'pipe' });

// The modules are browser scripts; load them into a sandbox to test them.
function sandbox() {
  const ctx = { TextEncoder };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ['ra-xlsx.js', 'ra-workbook.js', 'ra-events.js']) vm.runInContext(src(`assets/${f}`), ctx);
  return ctx;
}
// Read a stored (uncompressed) ZIP: name -> text, checking every CRC.
function unzipStored(bytes) {
  const buf = Buffer.from(bytes);
  const files = {};
  let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    assert.equal(buf.readUInt16LE(p + 8), 0, 'stored, not compressed');
    const crc = buf.readUInt32LE(p + 14);
    const size = buf.readUInt32LE(p + 18);
    const nameLen = buf.readUInt16LE(p + 26);
    const name = buf.subarray(p + 30, p + 30 + nameLen).toString('utf8');
    const data = buf.subarray(p + 30 + nameLen, p + 30 + nameLen + size);
    assert.equal(crc32(data), crc, `CRC of ${name}`);
    files[name] = data.toString('utf8');
    p += 30 + nameLen + size;
  }
  assert.equal(buf.readUInt32LE(buf.length - 22), 0x06054b50, 'end of central directory');
  return files;
}
// The website table, the way test/fixtures/industry-rows.json was extracted.
function websiteRows(html) {
  // Build-time placeholders ({{…}}) are the website's, not its wording.
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\{\{[A-Z_]+\}\}/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const rows = {};
  for (const m of html.matchAll(/<tr id="([a-z0-9-]+)"><th scope="row">([\s\S]*?)<\/th>([\s\S]*?)<\/tr>/g)) {
    const cells = [...m[3].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => strip(c[1]));
    const company = /^(c-|company-changes)/.test(m[1]);
    rows[m[1]] = company
      ? { layer: 'company', heading: strip(m[2]), trigger: strip(m[2]), route: cells[0], timing: cells[1], authority: cells[2] }
      : { layer: 'sead3', heading: strip(m[2]), trigger: cells[0], route: cells[1], timing: '', authority: cells[2] };
  }
  return rows;
}
const FIXTURE = JSON.parse(readFileSync(join(ROOT, 'test', 'fixtures', 'industry-rows.json'), 'utf8'));
const IDS = ['travel', 'foreign-contacts', 'peer-concerns', 'foreign-interests', 'targeting-criminal', 'conduct-financial', 'isl-crypto-row', 'isl-mental-health-row', 'c-sead3-procedures', 'c-espionage', 'c-adverse', 'c-suspicious', 'c-status', 'c-laa', 'c-withdraw', 'c-nda', 'company-changes', 'c-storage', 'c-emergency', 'c-subcontract', 'c-rediscovered', 'c-foreign-contract', 'c-foreign-material', 'c-loss', 'c-culpability', 'c-cyber', 'c-isoo'];

test('source pages load only their own scripts and state where the data stays', () => {
  for (const p of PAGES) {
    const html = src(p);
    assert.ok(!/<script(?![^>]*src=)[^>]*>/.test(html), `${p}: no inline script in src/ (the build inlines them)`);
    for (const m of html.matchAll(/<script src="([^"]+)"/g)) assert.match(m[1], /^assets\/ra-[a-z-]+\.js$/, p);
    assert.match(html, /class="itp-privacy"/, `${p}: states where the data stays`);
    assert.match(html, /preparation aid, not a determination/, `${p}: says it is a preparation aid`);
  }
  for (const f of SCRIPTS) {
    const js = src(`assets/${f}`);
    assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB/.test(js), `${f} must not use the network or browser storage`);
  }
});

test('events: the 27 website rows, verbatim, in the data module', () => {
  const { RaEvents: E } = sandbox();
  assert.deepEqual([...E.EVENTS.map((e) => e.id)], IDS);
  assert.deepEqual([...Object.keys(E.SITE_ROWS)], IDS);
  assert.equal(Object.keys(FIXTURE).length, 27);
  for (const id of IDS) {
    for (const k of ['layer', 'heading', 'trigger', 'route', 'timing', 'authority']) assert.equal(E.SITE_ROWS[id][k], FIXTURE[id][k], `${id}.${k}`);
    const ev = E.byId(id);
    assert.equal(ev.layer, FIXTURE[id].layer, id);
    assert.ok(ev.branches.length >= 1 && ev.label.length > 10 && ev.group, id);
    assert.match(FIXTURE[id].authority, /§117\.8|SEAD 3|ISL/, id);
  }
  // The authority of a SEAD 3 row names SEAD 3 or the ISL; a company row names §117.8.
  for (const id of IDS.slice(0, 8)) assert.match(E.SITE_ROWS[id].authority, /SEAD 3|ISL/, id);
  for (const id of IDS.slice(8)) assert.match(E.SITE_ROWS[id].authority, /32 CFR §117\.8/, id);
});

test('events: the data module matches the website table when the checkout is beside this repository', (t) => {
  if (!existsSync(WEBSITE)) {
    t.skip('fsotools-website is not checked out beside this repository');
    return;
  }
  const live = websiteRows(readFileSync(WEBSITE, 'utf8'));
  assert.deepEqual(Object.keys(live), IDS, 'the website still has these 27 rows');
  assert.deepEqual(live, FIXTURE, 'test/fixtures/industry-rows.json is the current website table (re-extract it if the website changed)');
});

test('decision engine: every answer path ends in a complete outcome, and "Not sure" always settles', () => {
  const { RaEvents: E } = sandbox();
  const kinds = {};
  let walks = 0;
  function walk(id, answers) {
    const o = E.decide(id, answers);
    walks++;
    if (o.kind === 'question') {
      assert.ok(o.options.length >= 2 && o.q, `${id}: question ${o.id}`);
      for (const opt of o.options) walk(id, { ...answers, [o.id]: opt.v });
      return;
    }
    kinds[o.kind] = (kinds[o.kind] || 0) + 1;
    assert.ok(o.title, `${id}: outcome has a title`);
    assert.ok(o.prep, `${id}: says it is a preparation aid`);
    const unsure = Object.values(answers).includes('unsure');
    if (unsure) assert.equal(o.kind, 'settle', `${id}: an unsure answer settles, never guesses: ${JSON.stringify(answers)}`);
    if (answers.danger === 'yes') assert.equal(o.kind, 'stop', `${id}: danger stops`);
    if (['yes', 'duty', 'inquiry'].includes(o.kind)) {
      assert.ok(o.recipients.length >= 1, `${id}: a recipient`);
      for (const r of o.recipients) assert.ok(r.who && r.via && r.basis && ['required', 'conditional', 'practice'].includes(r.kind), `${id}: recipient ${JSON.stringify(r)}`);
      assert.ok(o.when && o.when.text, `${id}: a clock`);
      assert.ok(o.include.length >= 1 && o.next.length >= 1, `${id}: include and next`);
      assert.equal(o.authority, E.SITE_ROWS[id].authority, `${id}: the website's authority`);
      assert.equal(o.links.site, `https://fsotools.ai/reporting/industry/#${id}`);
      assert.match(o.links.cfr, /^https:\/\/www\.ecfr\.gov\/current\/title-32\/subtitle-A\/chapter-I\/subchapter-D\/part-117\/section-117\.8#p-117\.8/);
      if (o.when.days) assert.ok(/five business days|72 hours/.test(o.when.text), `${id}: only the rule's numeric clocks compute a date`);
    }
    if (o.kind === 'consider' || o.kind === 'settle') assert.ok(o.text && o.text.length > 40, `${id}: explains`);
  }
  for (const e of [...E.EVENTS, E.FALLBACK]) walk(e.id, {});
  assert.ok(walks > 300, `walked ${walks} paths`);
  assert.deepEqual([...Object.keys(kinds)].sort(), ['consider', 'duty', 'inquiry', 'settle', 'stop', 'yes']);
  // Every branch offers events, grouped, plus the fallback.
  for (const b of E.BRANCHES) {
    const evs = E.eventsFor(b.id);
    assert.ok(evs.length >= 4 && evs.at(-1) === E.FALLBACK, b.id);
    assert.ok(E.groupsFor(b.id).length >= 2, b.id);
  }
  for (const id of IDS) assert.ok(E.EVENTS.find((e) => e.id === id).branches.every((b) => E.BRANCHES.some((x) => x.id === b)), id);
  // Specific rule points, checked against the texts (CITATIONS.md).
  const travel = E.decide('travel', { covered: 'yes', dod: 'yes', travelPhase: 'after' });
  assert.deepEqual([travel.when.days, travel.when.business, travel.when.from], [5, true, 'return']);
  const cyber = E.decide('c-cyber', { cdc: 'yes', classifiedSystem: 'no', dfars: 'yes' });
  assert.deepEqual([cyber.when.days, cyber.when.from, cyber.recipients[0].who], [3, 'discovery', 'DoD at dibnet.dod.mil']);
  const classified = E.decide('c-cyber', { cdc: 'yes', classifiedSystem: 'yes', fgi: 'yes' });
  assert.match(classified.when.text, /^Immediately/);
  assert.ok(classified.recipients.some((r) => /DTSA/.test(r.who)), 'foreign government information adds DTSA (§117.8(f)(1)(iii))');
  const loss = E.decide('c-loss', { danger: 'no', dod: 'yes', confirmed: 'no' });
  assert.equal(loss.kind, 'inquiry');
  assert.match(loss.when.text, /^Immediately/);
  const confirmed = E.decide('c-loss', { danger: 'no', dod: 'yes', confirmed: 'yes', govsite: 'yes', fgi: 'no' });
  assert.ok(confirmed.recipients.some((r) => /Head of the U\.S\. Government facility/.test(r.who)));
  const adverse = E.decide('c-adverse', { danger: 'no', rumor: 'yes', covered: 'yes', dod: 'yes', govsite: 'yes' });
  assert.ok(adverse.recipients.some((r) => /USG security point of contact/.test(r.who)));
  assert.equal(E.decide('c-adverse', { danger: 'no', rumor: 'no' }).kind, 'consider', 'rumor is never reported');
  assert.equal(E.decide('travel', { covered: 'no' }).kind, 'consider');
  const espionage = E.decide('c-espionage', { danger: 'no', dod: 'yes' });
  assert.equal(espionage.recipients[0].who, 'FBI, nearest field office');
  assert.match(espionage.when.text, /^Promptly/);
  const foci = E.decide('company-changes', { dod: 'yes', changeType: 'foci', sub: 'yes' });
  assert.ok(foci.recipients.some((r) => r.who === 'Prime contractor'), '§117.8(c)(14)');
  assert.ok(foci.include.some((t) => /SF 328/.test(t)));
  assert.equal(E.decide('foreign-interests', { covered: 'yes', dod: 'yes', level: 's', interestType: 'voting' }).kind, 'consider', 'voting is §H (TS) only');
  assert.equal(E.decide('isl-crypto-row', { covered: 'yes', dod: 'yes', cryptoType: 'fund' }).kind, 'consider');
  assert.equal(E.decide('c-sead3-procedures', { dod: 'yes' }).kind, 'duty');
  assert.match(E.whenText(E.WHEN.promptly), /No fixed clock in the rule: enter your company standard/);
  assert.equal(E.whenText(E.WHEN.fiveBusiness), 'Within five business days after return.');
});

test('workbook: a valid .xlsx whose exports match the blank workbook column for column', () => {
  const { ItpXlsx: X, RaWorkbook: W } = sandbox();
  const blank = W.blankWorkbook();
  assert.deepEqual([...blank.map((s) => s.name)], ['Read Me', 'Reporting Log', 'File Notes']);
  const files = unzipStored(X.buildWorkbook(blank));
  for (const part of ['[Content_Types].xml', 'xl/workbook.xml', 'xl/styles.xml', 'xl/worksheets/sheet3.xml']) assert.ok(files[part], part);
  assert.match(files['xl/workbook.xml'], /fullCalcOnLoad="1"/);
  assert.ok(!/dc:creator|lastModifiedBy|<Company>/.test(files['docProps/core.xml'] + files['docProps/app.xml']));
  const sheetXml = (sheets, name) => unzipStored(X.buildWorkbook(sheets))[`xl/worksheets/sheet${sheets.findIndex((s) => s.name === name) + 1}.xml`];
  const shape = (xml) => ({ header: /<row r="1"[\s\S]*?<\/row>/.exec(xml)[0], cols: /<cols>[\s\S]*?<\/cols>/.exec(xml)[0], lists: [...xml.matchAll(/<formula1>(.*?)<\/formula1>/g)].map((m) => m[1]), row2formulas: [.../<row r="2">[\s\S]*?<\/row>/.exec(xml)[0].matchAll(/<f>(.*?)<\/f>/g)].map((m) => m[1]), cf: [...xml.matchAll(/<cfRule[^>]*>[\s\S]*?<\/cfRule>/g)].map((m) => m[0]) });
  const sample = {
    log: [['1', '2026-01-05', 'SAMPLE-01', 'Unofficial foreign travel', 'DCSA (your CSA)', 'DISS', 'Within five business days after return.', '2026-01-12', '', '', 'Open', 'No', 'SEAD 3 §F.1(b)', '', '']],
    notes: [['SAMPLE-01', '2026-01-05', '09:00', 'FSO', 'self', 'Unofficial foreign travel', 'Report: yes', 'facts', 'DCSA', 5, 'business', '', '', '', 'Open', '', 'FSO/AB', '', '', '', 'SEAD 3 §F.1(b)']],
  };
  for (const [key, rows] of Object.entries(sample)) {
    const name = W.SHEETS[key].name;
    assert.deepEqual(JSON.parse(JSON.stringify(shape(sheetXml([W.sheet(key, rows)], name)))), JSON.parse(JSON.stringify(shape(sheetXml(blank, name)))), name);
  }
  // Dates are real Excel dates, and the formula columns hold formulas, not the placeholders.
  const notes = sheetXml([W.sheet('notes', sample.notes)], 'File Notes').replace(/&quot;/g, '"');
  assert.match(notes, /<c r="B2" s="2"><v>46027<\/v><\/c>/);
  assert.match(notes, /<c r="L2" s="4"><f>IF\(OR\(B2="",J2=""\),"",IF\(K2="business",WORKDAY\(B2,J2\),B2\+J2\)\)<\/f><\/c>/);
  assert.match(notes, /<c r="P2" s="5"><f>IF\(A2="","",IF\(O2="Open",IF\(L2="","No clock: company standard",IF\(L2&lt;TODAY\(\),"Overdue",IF\(L2-TODAY\(\)&lt;=2,"Due soon","On track"\)\)\),""\)\)<\/f><\/c>/);
  const log = sheetXml([W.sheet('log', sample.log)], 'Reporting Log').replace(/&quot;/g, '"');
  assert.match(log, /<formula>AND\(H2&lt;&gt;"",H2&lt;TODAY\(\),K2="Open"\)<\/formula>/, 'Overdue highlight on Due by');
  assert.match(log, /<c r="O2" s="5"><f>IF\(B2="","",IF\(I2="",TODAY\(\)-B2,I2-B2\)\)<\/f><\/c>/);
});

test('workbook: the Reporting Log has exactly the FSO ITPM Assistant’s columns, so rows paste across', (t) => {
  const { RaWorkbook: W } = sandbox();
  const headers = [...W.SHEETS.log.columns.map((c) => c.header)];
  assert.deepEqual(headers, ['Log no.', 'Date learned', 'Subject: name or internal ID', 'What happened (trigger)', 'Report to', 'Channel or system', 'Timing', 'Due by', 'Date submitted', 'Reference or confirmation no.', 'Status', 'ITPSO reviewed', 'Authority', 'Notes', 'Days open']);
  if (!existsSync(ITPM_WORKBOOK)) {
    t.diagnostic('fso-itpm-assistant is not checked out beside this repository: compared with the pinned headers only');
    return;
  }
  const box = { TextEncoder };
  box.globalThis = box;
  vm.createContext(box);
  vm.runInContext(readFileSync(ITPM_WORKBOOK, 'utf8'), box);
  const theirs = box.ItpWorkbook.SHEETS.log.columns;
  const spec = (cols) => JSON.parse(JSON.stringify(cols.map((c) => [c.header, c.width, c.type || '', c.list || null, c.formula ? c.formula(2) : ''])));
  assert.deepEqual(spec(W.SHEETS.log.columns), spec(theirs));
});

test('workbook rules: the page gives the same due date and alert as the Excel formulas', () => {
  const { RaWorkbook: W } = sandbox();
  // WORKDAY(start, n): n working days after start, weekends skipped (checked by hand against a calendar; no holiday list).
  assert.equal(W.workday('2026-10-30', 5), '2026-11-06'); // Friday + 5
  assert.equal(W.workday('2026-10-31', 5), '2026-11-06'); // Saturday start is not counted
  assert.equal(W.workday('2026-11-02', 5), '2026-11-09'); // Monday + 5
  assert.equal(W.workday('2026-11-05', 1), '2026-11-06');
  assert.equal(W.workday('2026-11-06', 1), '2026-11-09'); // Friday + 1 = Monday
  assert.equal(W.dueDate('2026-11-05', { days: 3 }), '2026-11-08'); // B2+J2
  assert.equal(W.dueDate('2026-11-05', { days: 5, business: true }), '2026-11-12');
  assert.equal(W.dueDate('2026-11-05', { text: 'Promptly.' }), '');
  assert.equal(W.dueDate('', { days: 3 }), '');
  const now = '2026-11-10';
  const cases = [
    [{ caseId: '', learned: '2026-11-01', clockDays: 3, clockBasis: 'calendar', status: 'Open' }, ''],
    [{ caseId: 'SAMPLE-01', learned: '2026-11-01', clockDays: '', clockBasis: 'calendar', status: 'Open' }, 'No clock: company standard'],
    [{ caseId: 'SAMPLE-02', learned: '2026-11-01', clockDays: 3, clockBasis: 'calendar', status: 'Open' }, 'Overdue'], // due 11-04
    [{ caseId: 'SAMPLE-03', learned: '2026-11-05', clockDays: 5, clockBasis: 'business', status: 'Open' }, 'Due soon'], // due 11-12
    [{ caseId: 'SAMPLE-04', learned: '2026-11-09', clockDays: 5, clockBasis: 'business', status: 'Open' }, 'On track'], // due 11-16
    [{ caseId: 'SAMPLE-05', learned: '2026-11-01', clockDays: 3, clockBasis: 'calendar', status: 'Submitted' }, ''],
    [{ caseId: 'SAMPLE-06', learned: '2026-11-01', clockDays: 3, clockBasis: 'calendar', status: 'Not reportable' }, ''],
    [{ caseId: 'SAMPLE-07', learned: '2026-11-08', clockDays: 2, clockBasis: 'calendar', status: 'Open' }, 'Due soon'], // due 11-10, today
  ];
  for (const [row, want] of cases) assert.equal(W.noteAlert(row, now), want, row.caseId || 'blank');
  assert.equal(W.logOverdue({ due: '2026-11-09', status: 'Open' }, now), true);
  assert.equal(W.logOverdue({ due: '2026-11-09', status: 'Submitted' }, now), false);
  assert.equal(W.logOverdue({ due: '', status: 'Open' }, now), false);
  assert.equal(W.normalizeDate('1/5/2026'), '2026-01-05');
  assert.equal(W.normalizeDate('46024'), '2026-01-02');
  assert.match(W.caseId(3), /^CASE-\d{4}-\d{2}-\d{2}-03$/);
});

test('the .xlsx writer is the FSO ITPM Assistant’s, unchanged apart from the header', (t) => {
  const ours = src('assets/ra-xlsx.js');
  assert.match(ours, /^\/\/ Minimal \.xlsx writer for the FSO Reporting Assistant\. Copied unchanged/);
  const body = (s) => s.slice(s.indexOf('// Sheet definition:'));
  assert.ok(body(ours).length > 10000);
  if (!existsSync(ITPM_XLSX)) {
    t.diagnostic('fso-itpm-assistant is not checked out beside this repository: header checked only');
    return;
  }
  assert.equal(body(ours), body(readFileSync(ITPM_XLSX, 'utf8')), 'ra-xlsx.js body differs from itp-xlsx.js');
});

test('every regulatory citation on the pages and in the data module appears in CITATIONS.md', () => {
  const citations = readFileSync(join(ROOT, 'CITATIONS.md'), 'utf8').replace(/\s+/g, ' ');
  const re = /(?:32 CFR )?§{1,2}\s?117\.\d+(?:\([a-z0-9]+\))*(?:[–-]\([a-z0-9]+\))*|SEAD 3 §{1,2}[A-H](?:\.\d+)?(?:\([a-z]\))?(?:\(\d\)\([a-z]\))?(?:\([a-z]\))?(?:[–-](?:§?[A-H]?\.?\d*)?(?:\([a-z]\))?)?|SEAD 3 App\. A(?:\.\d+)?(?:\([a-z]\))?(?:[–-](?:A\.)?\d+(?:\([a-z]\))?)?|ISL (?:Tables? [\d–-]+|Appendix A|2021-02)|DFARS 252\.204-7012(?:\([a-z0-9]+\))*(?:[–-]\([a-z0-9]+\))*/g;
  const texts = [...PAGES.map(src), src('assets/ra-events.js'), src('assets/ra-workbook.js')];
  const missing = new Set();
  for (const text of texts) for (const m of text.replace(/\s+/g, ' ').matchAll(re)) {
    const cite = m[0].replace(/^32 CFR /, '').replace(/§§/, '§').replace(/§ /, '§');
    if (!citations.includes(cite)) missing.add(cite);
  }
  assert.deepEqual([...missing].sort(), [], 'citations not in CITATIONS.md');
  assert.match(citations, /current as of 29 October 2026/);
});

test('every page has the same navigation, marking its own page, and links resolve offline', () => {
  const navs = PAGES.map((p) => /<nav aria-label="Tools">[\s\S]*?<\/nav>/.exec(src(p))[0]);
  const plain = navs.map((n) => n.replace(' aria-current="page"', ''));
  assert.equal(new Set(plain).size, 1, 'navigation differs between pages');
  PAGES.forEach((p, i) => assert.match(navs[i], new RegExp(`<a href="${p}" aria-current="page">`), p));
  for (const p of PAGES) for (const m of src(p).matchAll(/href="([^"#]+)"/g)) {
    if (/^https:\/\//.test(m[1]) || m[1].startsWith('data:')) continue;
    assert.ok(PAGES.includes(m[1]) || m[1].startsWith('assets/'), `${p}: link ${m[1]} does not resolve offline`);
  }
  // The decide page hands off to the file note page by a relative link with a query (no storage).
  assert.match(src('assets/ra-decide.js'), /`file-note\.html\?\$\{p\.toString\(\)\}`/);
});

test('the offline build: one self-contained file per page, with no network access', () => {
  for (const p of PAGES) {
    const html = dist(p);
    assert.match(html, /<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'" \/>/, p);
    assert.ok(!/<script src=|<link rel="stylesheet"|src="assets\//.test(html), `${p}: every script and stylesheet is inlined`);
    assert.ok(!/\{\{[A-Z_]+\}\}/.test(html), `${p}: placeholders filled`);
    assert.match(html, /Version \d+\.\d+\.\d+ · /, `${p}: shows its version`);
    for (const m of src(p).matchAll(/assets\/([a-z0-9-]+\.(?:js|css))/g)) {
      assert.ok(html.includes(`/* ${m[1]} */\n${src(`assets/${m[1]}`)}`), `${p}: ${m[1]} inlined unchanged`);
    }
    assert.ok(html.lastIndexOf('<script>') > html.indexOf('<main>'), `${p}: scripts at the end of the body`);
    // No script in the built page reaches the network or browser storage, and no external URL sits in script.
    for (const s of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      assert.ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|WebSocket|<img|new Image\(/.test(s[1]), `${p}: script uses the network or storage`);
      // URLs in script are the citation targets and the fsotools.ai row links, used only as href text.
      for (const u of s[1].matchAll(/https?:\/\/[^\s'"`)]+/g)) assert.match(u[0], /^http:\/\/(schemas\.openxmlformats\.org|purl\.org|www\.w3\.org)\/|^https:\/\/(www\.ecfr\.gov|www\.dni\.gov|www\.odni\.gov|www\.dcsa\.mil|fsotools\.ai|www\.acquisition\.gov|www\.govinfo\.gov|www\.esd\.whs\.mil|www\.archives\.gov|uscode\.house\.gov|www\.gao\.gov|assets\.performance\.gov|dibnet\.dod\.mil)(?:\/|$)/, `${p}: unexpected URL in script: ${u[0]}`);
    }
  }
});

test('site bundle: pages byte-identical to dist, an offline zip, and a manifest of hashes', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'site-bundle.js')], { cwd: ROOT, stdio: 'pipe' });
  const manifest = JSON.parse(readFileSync(join(ROOT, 'site-bundle', 'reporting.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest), ['name', 'version', 'commit', 'dirty', 'built', 'zip', 'zipBytes', 'pages', 'files']);
  assert.equal(manifest.name, 'fso-reporting-assistant');
  assert.equal(manifest.zip, 'fso-reporting-assistant-offline.zip');
  assert.deepEqual(manifest.pages, [...PAGES].sort());
  for (const [path, hash] of Object.entries(manifest.files)) {
    assert.equal(createHash('sha256').update(readFileSync(join(ROOT, 'site-bundle', path))).digest('hex'), hash, path);
  }
  for (const p of PAGES) assert.equal(readFileSync(join(ROOT, 'site-bundle', 'app', p), 'utf8'), dist(p), `${p} matches dist/`);
  const files = unzipStored(readFileSync(join(ROOT, 'site-bundle', manifest.zip)));
  for (const p of PAGES) assert.equal(files[`fso-reporting-assistant/${p}`], dist(p), `zip holds ${p}`);
  assert.ok(files['fso-reporting-assistant/README.txt']);
});

test('every page offers the blank workbook, and each tool names the sheet its export fits', () => {
  const sheets = { 'decide.html': ['Reporting Log'], 'file-note.html': ['File Notes', 'Reporting Log'] };
  for (const p of PAGES) {
    const html = src(p);
    assert.match(html, /<button[^>]*id="ra-blank"[^>]*>Download the blank workbook \(\.xlsx\)<\/button>/, p);
    assert.ok(html.includes('<script src="assets/ra-hub.js" defer></script>'), `${p} loads the download handler`);
    if (sheets[p]) {
      const strip = html.slice(html.indexOf('class="itp-workbook'), html.indexOf('</div>', html.indexOf('class="itp-workbook')));
      for (const s of sheets[p]) assert.ok(strip.includes(s), `${p} names the ${s} sheet`);
      assert.ok(strip.includes('itp-noprint'), `${p}: the strip stays out of printouts`);
    }
  }
  const { RaWorkbook: W } = sandbox();
  const names = [...W.blankWorkbook().map((s) => s.name)];
  for (const s of Object.values(sheets).flat()) assert.ok(names.includes(s), `${s} is a sheet of the blank workbook`);
});

test('the file note has every required field, labelled, and prints alone', () => {
  const html = src('file-note.html');
  for (const id of ['fn-learned', 'fn-time', 'fn-how', 'fn-case', 'fn-event', 'fn-outcome', 'fn-facts', 'fn-recipients', 'fn-due', 'fn-submitted', 'fn-ref', 'fn-prepared', 'fn-reviewed', 'fn-followup', 'fn-followup-due', 'fn-status']) {
    assert.match(html, new RegExp(`<label class="itp-field"><span>[^<]+</span>(?:<[^>]+>)?<(?:input|select|textarea)[^>]*id="${id}"`), `${id} is labelled`);
  }
  assert.match(html, /No diagnoses, no rumor or innuendo/);
  assert.match(html, /§117\.8\(c\)\(1\)/);
  assert.match(html, /A name may be entered only in the company’s protected records/);
  assert.match(src('assets/ra.css'), /body\.ra-printing > \*:not\(main\), body\.ra-printing main > \*:not\(\.ra-note-section\) \{ display: none !important; \}/);
});

test('every page fits search results and has a complete link preview', () => {
  const unescape = (s) => s.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"');
  for (const p of PAGES) {
    const html = src(p);
    const meta = (name) => (new RegExp(`<meta (?:property|name)="${name}" content="([^"]*)"`).exec(html) || [])[1];
    const url = `https://fsotools.ai/reporting/aid/app/${p === 'index.html' ? '' : p.replace(/\.html$/, '')}`;
    assert.ok(/<title>[^<]+ · FSO Reporting Assistant<\/title>/.test(html), `${p}: title`);
    assert.ok(unescape(meta('description')).length <= 160, `${p}: description at most 160 characters`);
    assert.equal(meta('og:description'), meta('description'), `${p}: preview text matches the description`);
    assert.equal(meta('og:url'), url, p);
    assert.ok(html.includes(`<link rel="canonical" href="${url}" />`), `${p}: canonical`);
    assert.equal(meta('og:image'), 'https://fsotools.ai/assets/fsotools-share-v2.png', p);
    for (const name of ['og:title', 'twitter:card']) assert.ok(meta(name), `${p}: ${name}`);
  }
});
