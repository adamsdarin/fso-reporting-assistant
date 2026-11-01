# CLAUDE.md — FSO Reporting Assistant

This file mirrors `AGENTS.md`. Change both together.

Read `HANDOFF.md` first, then `README.md`.

Rules that must hold:
- Local only: no server code, no network calls from the pages, no analytics,
  no browser storage (localStorage, sessionStorage, IndexedDB). The built
  pages carry a CSP with `connect-src 'none'`; keep it. The decision page
  hands off to the file note page through the URL query only (event id,
  answer codes and dates), never anything the user typed.
- Records belong in the user's Excel workbook, never in this repository.
  Samples and tests use fictitious IDs only (e.g. `SAMPLE-01`). No personal
  information anywhere, no case narratives.
- Every sheet is defined once in `src/assets/ra-workbook.js`. Exports and the
  blank workbook must stay column-for-column identical; a formula change needs
  the matching JavaScript rule change and a test case. The Reporting Log
  sheet keeps exactly the columns of the FSO ITPM Assistant's Reporting Log
  (`itp-workbook.js`), so rows paste across both workbooks; the test pins it.
- The 27 reporting events are the reviewed rows of
  https://fsotools.ai/reporting/industry/ (`src/assets/ra-events.js`,
  `SITE_ROWS`). Keep their authority strings exactly as the website has them;
  a verification note that differs goes in the event's `verified` field and
  in `CITATIONS.md`, never in the authority.
- Every regulatory statement names its source (32 CFR Part 117 paragraph,
  SEAD 3, ISL, DFARS). Mark steps the rule does not require "Good practice".
  Verify every citation against the official eCFR text and record the
  "current as of" date in `CITATIONS.md`. Do not invent paragraph numbers; if
  something cannot be verified, list it under Open Questions in `HANDOFF.md`
  and label it on the page.
- "Not sure" answers lead to "settle this before deciding" guidance, never a
  guess. Every outcome says it is a preparation aid, not a determination and
  not legal advice, the way the ITPM pages do.
- No dependencies unless there is no reasonable alternative. The `.xlsx`
  writer `src/assets/ra-xlsx.js` is copied from the FSO ITPM Assistant; keep
  its body identical (the test checks when that repository is checked out
  beside this one) and fix bugs there first.
- Accessibility and layout: labels on every input, keyboard-operable, no
  horizontal scroll at 390 px, prints cleanly (the file note especially).
