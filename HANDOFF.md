# HANDOFF — FSO Reporting Assistant

Last updated: 2026-11-01 by Claude

## Current State
Draft, first complete build. Three pages (overview, guided path, file note)
and the blank workbook (Read Me, Reporting Log, File Notes). The 27 reporting
events are the reviewed rows of https://fsotools.ai/reporting/industry/ with
the website's authorities verbatim; the decision engine asks only the
questions that change the answer and never guesses on "Not sure". `npm test`
passes (15 tests); `npm run build` makes the offline edition in `dist/`,
exercised from `file://` in headless Chromium: every export downloads (blank
workbook, reporting log, file note, session notes), no console errors, no
network requests, no horizontal scroll at 390 px, and the file note prints
alone on one page. `npm run site-bundle` writes `site-bundle/` with
`reporting.json`.

Citations: the website's 27 authorities (fsotools-website commit 91cb8bc)
match the texts. 32 CFR §117.8 (and §117.7(d)–(e), §117.19) checked against eCFR
current as of 2026-10-29; SEAD 3 checked against the ODNI text; DFARS
252.204-7012 against acquisition.gov. ISL 2021-02 not re-read (DCSA returned
HTTP 403 to the build environment); its wording follows the website's reviewed
table. See `CITATIONS.md`.

## Next
- Owner review of the plain-language labels, the "Not under these rules, but
  consider…" texts (good-practice guidance, not rule text) and the file note
  layout, in a desktop browser and in Excel (the owner confirmed the ITPM
  workbook pattern works in desktop Excel on 2026-09-24; this workbook uses
  the same writer and adds a WORKDAY formula).
- Verify ISL 2021-02 Tables 1–4 from a machine that can open the DCSA PDF and
  remove the "wording from the fsotools.ai reviewed table" labels.
- Website integration (in `fsotools-website`, not here): landing page at
  `/reporting/aid/`, an import script following README's contract, the CSP
  header for `/reporting/aid/app/`, and the `.html` → extensionless redirects.

## Open Questions
- **ISL 2021-02 not re-read.** The DCSA PDF could not be fetched from the
  build environment. ISL-only outcomes (foreign cryptocurrency, specified
  mental-health events, Tables 1–4 references, the SPP duty) say so on the
  page and in CITATIONS.md.
- **Excel formulas not machine-checked.** The ITPM Assistant checked its
  formulas with the Python `formulas` library; it is not available here. The
  File Notes "Due by" (WORKDAY) and "Alert" formulas and the Reporting Log
  "Due by" highlight were checked by hand against the JavaScript rules on the
  test table. Open the blank workbook in desktop Excel and type a row.
- **Business days ignore holidays**: WORKDAY without a holiday list, and the
  page says so. SEAD 3 says "business days" without defining them.
- **`ra-xlsx.js` is the ITPM writer verbatim**, so the file properties still
  say "FSOtools ITP workbook" (docProps/app.xml). A product-neutral string
  would be a change in both repositories.
- **The ITPM "international plan" trigger** (ISP route, §117.19(d)) is not
  included: it is not a §117.8 report and not a row of the website table.
- **"Not under these rules, but consider…" and "settle" texts** are the aid's
  own guidance built on the rule text; they are labelled good practice where
  the rule does not require the step. Owner's call on wording.
- Repository visibility (private for now) and license.

## Log
- 2026-11-01 Claude — The website fixed its three SEAD 3 cites (fsotools-website
  PR #55, commit 91cb8bc; found here against the SEAD 3 text on 2026-10-31).
  Re-extracted the fixture and `SITE_ROWS`; dropped the correction notes from
  the outcome cards; CITATIONS.md records the change.
- 2026-11-01 Claude — First complete build: workbook module (Reporting Log
  identical to the ITPM log; File Notes with WORKDAY due dates and an Alert
  formula, JavaScript rules and tests pinning both); the events module (27
  rows verbatim, 5 branches, 23 clarifying questions, clocks with numbers only
  where the rule has them: five business days after return, 72 hours of
  discovery); the three pages; tests (15); Playwright check of dist/ from
  file://; CITATIONS.md, README, CLAUDE/AGENTS.
- 2026-10-31 Claude — Scaffold: build, site-bundle (reporting.json) and serve
  (port 5193) scripts in the ITPM pattern; the xlsx writer, base and identity
  CSS and the citation-links module copied from the ITPM Assistant; the 27
  website rows extracted to a fixture and to `SITE_ROWS`; eCFR texts fetched
  (current as of 2026-10-29) and saved under docs/sources; SEAD 3 read from
  the ODNI scan; ISL PDF unreachable (403); DFARS 7012 checked. Hand-off notes
  for continuing in a local session were in HANDOFF-LOCAL.md (now removed).
