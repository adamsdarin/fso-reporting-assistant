# FSO Reporting Assistant

A program-wide "do I report this, to whom, by when" decision aid for the FSO
of a cleared contractor under 32 CFR Part 117, SEAD 3 and DCSA ISL 2021-02,
with a printable file note and a reporting log. Three pages and a workbook:

| Page | What it does | Exports |
|---|---|---|
| `index.html` | Overview, and the blank workbook (made in the browser) | Workbook: Read Me, Reporting Log, File Notes |
| `decide.html` | The guided path: who or what it is about → what happened (27 events from the reviewed guide) → the clarifying questions that change the answer → the outcome: Report? (Yes / Not under these rules, but consider… / Stop: emergency route / Settle before deciding / Not yet: preliminary inquiry), each recipient on its own line, the rule's own clock with a computed due date where the rule has a number, what to include, what to do next, the authority with links; a session reporting log | Reporting Log sheet |
| `file-note.html` | One printable page per event: when and how learned, event and outcome, facts as known, recipients and channels, due date, submission, prepared by, reviewed by, follow-up; prefilled from the decision page | Print to PDF; File Notes and Reporting Log sheets |

It complements the FSO ITPM Assistant's insider-threat-only "Is this
reportable?" page (https://fsotools.ai/itp/app/reportable): the espionage,
adverse-information and suspicious-contact events here are the same reports,
worded for the whole program.

**Status: draft.** The 32 CFR §117.8 citations were checked against the eCFR
text current as of 29 October 2026, SEAD 3 against the ODNI text and DFARS
252.204-7012 against acquisition.gov; ISL 2021-02 wording follows the reviewed
table on fsotools.ai because the DCSA PDF could not be fetched: see
`CITATIONS.md` and the Open Questions in `HANDOFF.md`.

## Where the data lives

Nowhere but the user's machine. The pages make no network connections (their
Content-Security-Policy sets `connect-src 'none'`), store nothing in the
browser, and forget everything when the tab closes. The records live in the
Excel workbook, which the user keeps in access-restricted company storage.
The decision page hands the event, the answer codes and the dates to the file
note page in the URL query; nothing the user typed goes in it.

Every sheet is defined once, in `src/assets/ra-workbook.js`. The blank
workbook and each export are built from those definitions, so they share
columns, widths, drop-downs and formulas, and exported rows paste straight
into the master workbook. Due dates and alerts are Excel formulas; the pages
apply the same rules in JavaScript, and the tests pin both.

**Compatibility with the FSO ITPM Assistant.** The Reporting Log sheet has
exactly the columns, widths, lists and formula of the ITPM Assistant's
Reporting Log, so rows paste between the two workbooks in either direction.
The test suite compares the two definitions when `fso-itpm-assistant` is
checked out beside this repository.

## The events

`src/assets/ra-events.js` holds the 27 rows of the cleared industry reporting
guide on fsotools.ai (8 SEAD 3 / ISL rows: the individual's reports to the
FSO; 19 company rows under §117.8), each with the website's trigger, route,
timing and authority verbatim (`SITE_ROWS`, pinned by
`test/fixtures/industry-rows.json`), a plain-language label, the branches it
belongs to, the clarifying questions it asks, and the rules that produce the
outcome. Each outcome links to its row (`https://fsotools.ai/reporting/industry/#<id>`)
and to the eCFR paragraph. `decide(eventId, answers)` is a pure function.

## Layout

```
src/                 the app (edit here)
  *.html             one page per tool; relative links, no server needed
  assets/base.css           tokens, page chrome, question cards (from the ITPM Assistant)
  assets/ra.css             tool styles, the file note's print layout
  assets/ra-identity.css    the FSOtools index-folder identity (loaded last)
  assets/ra-xlsx.js         .xlsx writer (SpreadsheetML + stored ZIP, no library; copied from the ITPM Assistant)
  assets/ra-workbook.js     sheet definitions, formulas, matching rules, shared helpers
  assets/ra-events.js       the 27 events, questions, clocks and the decision engine
  assets/ra-citation-links.js  turns citations into links to the official texts
  assets/ra-decide.js       the guided path page
  assets/ra-file-note.js    the file note page
  assets/ra-hub.js          the blank workbook download
scripts/build.js     src/ → dist/: each page as one self-contained HTML file
scripts/serve.js     serve src/ (or dist/ with --dist) on localhost:5193
scripts/site-bundle.js  dist/ + offline .zip + manifest → site-bundle/, for fsotools-website
test/                node --test; test/fixtures/industry-rows.json pins the website rows
docs/sources/        the eCFR texts the citations were checked against (public texts)
```

## Commands

```bash
npm test             # builds dist/, then runs the tests
npm run build        # dist/: the offline edition (open dist/index.html from disk)
npm run serve        # develop against src/ at http://localhost:5193/
npm run serve:dist   # build, then serve dist/
npm run site-bundle  # site-bundle/: pages, offline .zip and reporting.json (hashes) for the website
```

Node 22 or later. No dependencies.

## Relationship to fsotools.ai

This repository is the product. The FSOtools website (`fsotools-website`)
only presents it, as it does for the FSO ITPM Assistant, DD-254 Interactive
and the Adjudication Atlas. The import contract, for the website's import
script to follow:

- Produce the bundle here with `npm run site-bundle` from a clean, committed
  tree. It writes `site-bundle/`:
  - `app/index.html`, `app/decide.html`, `app/file-note.html`: the built
    pages, byte for byte from `dist/`, each self-contained with the
    no-network CSP;
  - `fso-reporting-assistant-offline.zip`: the same pages plus a README.txt;
  - `reporting.json`: the manifest, same shape as the ITPM `itpm.json`:
    `{ name, version, commit, dirty, built, zip, zipBytes, pages, files }`
    where `files` maps `app/<page>` and the zip name to their SHA-256.
- The website copies the files unchanged (refusing a bundle whose hashes do
  not match the manifest, or one built from uncommitted changes) and serves
  them under `/reporting/aid/app/` with the zip beside them; the landing page
  is `/reporting/aid/`. Each page's canonical and Open Graph URLs already
  point at `https://fsotools.ai/reporting/aid/app/…`; sibling links keep
  `.html` so the offline zip works from `file://`, and the website's redirects
  map them to extensionless URLs as they do for `/itp/app/`.
