# HANDOFF — FSO Reporting Assistant

Last updated: 2026-11-23 by Claude (branch `claude/sead3-row-corrections`, on top of `claude/night-identity`: four website rows corrected against SEAD 3 and ISL 2021-02).

## Current State
2026-11-23 (owner request in the fsotools-website session, "Yes, fix them";
branch `claude/sead3-row-corrections`, worktree `.claude/worktrees/sead3-rows`,
on top of `claude/night-identity`; committed and pushed 2026-11-23 on the
owner’s word, "Yes, push it", which also published that branch’s commit
`e115c83` as part of this one): the website
corrected four SEAD 3 rows (`#peer-concerns`, `#foreign-interests`,
`#targeting-criminal`, `#conduct-financial`) after SEAD 3 and ISL 2021-02
were read in full. `SITE_ROWS` and the fixture were re-extracted from
fsotools-website commit b9e2097 (its branch `claude/sead3-row-corrections`,
not merged when this was written). The "something else" answers on foreign
interests, targeting and conduct now end in "consider" and say why, and the
conduct event's label and summary no longer name health or outside activity.
`npm test` in the worktree: 13 pass, 3 skip (the sibling checkouts are not
beside a worktree). Until the website change reaches the checkout at
`../fsotools-website`, the website-comparison test run from the main checkout
will report those four rows as different. Details: `CITATIONS.md`.

2026-11-12 (owner request, branch `claude/night-identity`, not pushed): the
three pages wear the FSOtools night identity, as the FSO ITPM Assistant
does since the same day (charcoal ground and grid, the logo's blue, Inter and
JetBrains Mono embedded as data: URIs, 2px corners, the white-folder mark on
its blue tile, the FSO + tools wordmark; the header's descriptor line is gone
with the old lockup). `base.css` is the ITPM Assistant's night sheet,
`ra.css` was rewritten on its tokens and `ra-identity.css` (the
index-folder identity) is gone; no page text, rule, citation, script or
workbook output changed. The CSP gained `font-src data:` and nothing else.
Print switches to dark ink on white. The identity is owned by
fsotools-website: `npm run brand-check` runs that repository's
`scripts/brand-check.mjs` over dist/, `npm run site-bundle` refuses to bundle
pages that fail it (and records `brandCheck` in `reporting.json`), and CLAUDE.md
/ AGENTS.md tell the robot to make identity changes there, never here. Checked
in the app's browser at desktop and 375px on every page: fonts load, no
sideways scroll, no page errors; printing was not looked at on paper. Until
the website's brand branches are in the checkout at `../fsotools-website`, set
`FSOTOOLS_WEBSITE` to a checkout that has the checker; without one the brand
test and the site-bundle test skip and `npm run site-bundle` stops.

Draft, first complete build. Three pages (overview, guided path, file note)
and the blank workbook (Read Me, Reporting Log, File Notes). The 27 reporting
events are the reviewed rows of https://fsotools.ai/reporting/industry/ with
the website's authorities verbatim; the decision engine asks only the
questions that change the answer and never guesses on "Not sure". `npm test`
passes (16 tests); `npm run build` makes the offline edition in `dist/`,
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
- 2026-11-23 Claude — Took the website's four corrected SEAD 3 rows
  (fsotools-website commit b9e2097): re-extracted the fixture and `SITE_ROWS`,
  turned three "something else" answers from "settle" into "consider" now that
  ISL 2021-02 has been read, and recorded it in `CITATIONS.md`. Pushed the same
  day on the owner’s word; the repository is public.
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
