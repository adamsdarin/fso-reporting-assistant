# HANDOFF-LOCAL — continue building the FSO Reporting Assistant in a local session

Written 2026-10-31 by the cloud session that started this product. Load this
file into a local Claude Code session in a clone of
`adamsdarin/fso-reporting-assistant` and say: "Continue from HANDOFF-LOCAL.md."
Everything below is what that session needs: the task, what is done, what was
verified against the official texts (with the texts themselves saved under
`docs/sources/`), the design decisions already taken, and the remaining work
in order. Delete this file (and `docs/sources/` if the owner prefers) once
`HANDOFF.md`, `README.md`, `CITATIONS.md`, `CLAUDE.md` and `AGENTS.md` exist.

---

## 1. The task (verbatim requirements, condensed only where repetitive)

Build a new FSOtools product: a program-wide **"do I report this, to whom, by
when"** decision aid for the FSO of a cleared contractor under 32 CFR Part 117,
SEAD 3 and DCSA ISL 2021-02, with a printable **file note** and a **reporting
log**. The FSO ITPM Assistant already has an insider-threat-only "Is this
reportable?" page (20 triggers) at `https://fsotools.ai/itp/app/reportable`;
this product covers the whole program and complements it.

- Repository: `adamsdarin/fso-reporting-assistant` (this one). Work on `main`
  directly. Served path on fsotools.ai: `/reporting/aid/` (landing page, not
  our job) and `/reporting/aid/app/` (our pages). Manifest file `reporting.json`;
  offline zip `fso-reporting-assistant-offline.zip`; dev server port **5193**.
- Source content, reuse do not reinvent: `adamsdarin/fsotools-website`,
  page `site/reporting/industry/index.html`, holds the reviewed table: 8 SEAD 3 /
  ISL rows (`#travel`, `#foreign-contacts`, `#peer-concerns`, `#foreign-interests`,
  `#targeting-criminal`, `#conduct-financial`, `#isl-crypto-row`,
  `#isl-mental-health-row`) and 19 company rows under §117.8
  (`#c-sead3-procedures` … `#c-isoo`), plus `#routing` and the October 2026
  notes (`#incident-workflow`, `#facility-routes`). Extract the 27 rows into
  `src/assets/ra-events.js` keeping the **authorities exactly**, and link each
  outcome to `https://fsotools.ai/reporting/industry/#<id>`.
  `adamsdarin/fso-itpm-assistant` is the pattern reference; its
  `src/assets/itp-reportable.js` shows trigger → questions → outcome and the
  Reporting Log sheet. Its 20 triggers may be included where program-wide
  (espionage/FBI, adverse information, suspicious contacts); link to the ITPM
  page for the rest.
- Verify every citation against eCFR and the SEAD 3 / ISL texts (ISL:
  https://www.dcsa.mil/Portals/128/Documents/CTP/tools/ISL2021-02_SEAD-3_052024_v2.pdf ;
  SEAD 3: https://www.dni.gov/files/NCSC/documents/Regulations/SEAD-3-Reporting-U.pdf).
  If a PDF is unreachable, rely on the website's reviewed wording and say so
  in CITATIONS.md.

### Pages
1. `index.html`: overview, privacy note, "Your workbook" strip with the blank
   workbook (sheets: Read Me, Reporting Log, File Notes), version line and
   disclaimers as in the ITPM overview.
2. `decide.html`: the guided path. Step 1 "Who or what is this about?" (a
   cleared or in-process employee's own event; something observed about
   another person; the company, facility or contract; classified material or a
   system; a visitor or foreign contact). Step 2: pick the event from the rows
   for that branch (plain-language labels, grouped). Step 3: the clarifying
   questions that change the answer (DoD cognizance; employee's eligibility
   level/category for SEAD 3 items; on a Government site; covered defense
   contractor for cyber; foreign/NATO information; subcontractor status;
   material confirmed lost vs. suspected). Outcome card: **Report?** (Yes /
   Not under these rules, but consider… / Stop: emergency route), **to whom**
   (each recipient on its own line: CSA/DCSA via DISS or NISS or the IS Rep,
   FBI, GCA/customer, prime contractor, DoD CSO/DIBNet, ISOO, Government
   facility head), **by when** (the rule's own words, e.g. "promptly",
   "immediately", "within 72 hours of discovery", "within five business days
   after return", with a computed due date where a number exists and "no fixed
   clock in the rule: enter your company standard" otherwise), **what to
   include**, **what to do next** (preserve records, internal notifications,
   follow-through such as the final report), **authority** with links to the
   fsotools.ai row and the eCFR paragraph. Every outcome says it is a
   preparation aid, not a determination. "Not sure" answers lead to "settle
   this before deciding" guidance, never a guess.
3. `file-note.html` (or a section of decide.html): printable one-page file
   note: date and time learned; how learned (role, not name); event category
   and the aid's outcome; facts as known (free text, with a warning box: no
   diagnoses, no rumor or innuendo, §117.8(c)(1) wording verified); recipients
   and channels; due date; date submitted; confirmation/reference number;
   prepared by (role/initials); reviewed by; follow-up actions and dates; a
   "Subject" field defaulting to an internal case ID with a note that a name
   may be entered only in the company's protected records. Print to PDF;
   export to the File Notes sheet; add to the session reporting log (Reporting
   Log sheet with the same columns as the ITPM one so rows paste across both
   workbooks; cite that compatibility in README).

### Workbook
`src/assets/ra-workbook.js` defines the sheets once with formulas (due date
from date learned + the row's clock where numeric; status Open / Submitted /
Closed / Not reportable; Overdue highlight) and the matching JavaScript rules;
tests pin both. Copy `itp-xlsx.js` as `ra-xlsx.js` unchanged apart from the
header (DONE).

### Done means
`npm test` passes; `npm run build` makes `dist/` that works from `file://`
(check in headless Chromium through Playwright if available: every export
downloads, no console errors, no network requests, no horizontal scroll at
390 px); `npm run site-bundle` produces `site-bundle/` with `reporting.json`;
everything committed and pushed to `origin main`; README, HANDOFF, CITATIONS,
CLAUDE/AGENTS complete; the final message lists the commit hash, pages, event
count and every unverified point.

### The FSOtools product pattern (copy exactly; the ITPM repo is the reference)
- `src/*.html` one page per tool, relative links with `.html`; assets referenced
  exactly as `<script src="assets/x.js" defer></script>` and
  `<link rel="stylesheet" href="assets/x.css" />` (build.js inlines by regex;
  asset names must match `[a-z0-9-]+`).
- `scripts/build.js` (DONE): src → dist, one self-contained file per page, CSP
  `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'`,
  `{{VERSION}}` filled, `FsoSources.linkHtml(html, 'reporting/industry')` applied.
- `scripts/site-bundle.js` (DONE): dist → `site-bundle/app/*.html`, the zip
  (with README.txt inside) and `reporting.json` with the same shape as the ITPM
  `itpm.json`: `{ name, version, commit, dirty, built, zip, zipBytes, pages, files: { "app/x.html": sha256, "<zip>": sha256 } }`.
- `scripts/serve.js` (DONE): port 5193.
- `test/*.test.js` with `node --test`: build succeeds and inlines everything;
  every page carries the CSP and no `src="assets/`; no page contains `fetch(`,
  `XMLHttpRequest`, `localStorage`, `sessionStorage`, `indexedDB`,
  `navigator.sendBeacon` or an external URL in a script; workbook sheet columns
  match each export; every JavaScript date/status rule agrees with its Excel
  formula on a table of cases; every regulatory citation on a page appears in
  `CITATIONS.md`; every event row's authority matches the website's table;
  each page has a title, a description ≤160 chars, canonical and Open Graph
  tags pointing at `https://fsotools.ai/reporting/aid/app/…` and the share
  image `https://fsotools.ai/assets/fsotools-share-v2.png`.
- `package.json` (DONE): scripts build/test/serve/serve:dist/site-bundle;
  engines node ≥22; private; type module. `.gitignore` (DONE) holds dist/ and
  site-bundle/.
- `CLAUDE.md` and `AGENTS.md` identical (adapt the ITPM rules: local only / no
  storage / CSP; records in the user's workbook, fictitious IDs like
  `SAMPLE-01`, no PII; every sheet defined once in ra-workbook.js, formula change
  needs JS rule + test; every regulatory statement names its source, "Good
  practice" for non-required steps, verify against eCFR and record the
  "current as of" date; preparation aid not a determination; no dependencies;
  accessibility, no horizontal scroll at 390 px, prints cleanly).
  `HANDOFF.md` (Current State, Next, Open Questions, Log); `README.md` (what it
  is, where the data lives, layout, commands, relationship to fsotools.ai with
  the import contract: manifest `reporting.json`, bundle layout `app/*.html` +
  zip, served path `/reporting/aid/app/`); `CITATIONS.md` (every regulatory
  statement with status verified / corrected / good practice and the eCFR date).
- Git: commit in small clear steps; never mention an AI model name in a commit
  message or any file; end every commit message with the two lines
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and
  `Claude-Session: <the session URL>` (the local session uses its own URL);
  run `npm test` before each push; `git push -u origin main`; no pull request.
  Website integration is NOT our job.

---

## 2. State of the repository at hand-off

Committed on `main` (see `git log`): the scaffold below. Nothing else exists yet.

```
package.json .gitignore .gitattributes
scripts/build.js scripts/site-bundle.js scripts/serve.js      complete (ITPM pattern, port 5193, reporting.json)
src/assets/ra-xlsx.js        itp-xlsx.js body byte-identical, new header; global stays `ItpXlsx`
src/assets/base.css          copy of ITPM base.css (header changed)
src/assets/ra-identity.css   copy of ITPM itp-inspection.css (the blue/cream index-folder identity; load it LAST)
src/assets/ra-citation-links.js  copy of ITPM itp-citation-links.js (FsoSources.linkText/linkHtml/apply)
src/assets/ra-events.js      SKELETON: SITE_ROWS with the 27 website rows verbatim; RaEvents = { SITE, CFR, ITPM, SITE_ROWS }
test/fixtures/industry-rows.json  the 27 rows as extracted from the website (id → layer, heading, trigger, route, timing, authority)
docs/sources/*.txt           eCFR text of §117.3 (selected definitions), §117.7, §117.8, §117.12, current as of 2026-10-29
HANDOFF-LOCAL.md             this file
```

Sibling checkouts the cloud session used (clone them beside this repo if you
want the live comparison; the tests should skip, not fail, when absent):
`/home/user/fsotools-website` and `/home/user/fso-itpm-assistant`
(`git clone --depth 1 https://github.com/adamsdarin/<repo>`).

The ITPM files worth reading before writing ours (all short): `src/index.html`,
`src/reportable.html`, `src/assets/itp.css`, `src/assets/itp-hub.js`,
`src/assets/itp-reportable.js`, `src/assets/itp-workbook.js`,
`test/assistant.test.js`, `CLAUDE.md`, `HANDOFF.md`, `README.md`, `CITATIONS.md`.

---

## 3. Verification results (what was checked, what was not)

### 32 CFR Part 117 — VERIFIED on eCFR, current as of **2026-10-29**
Fetched through the versioner API (`/api/versioner/v1/full/2026-10-29/title-32.xml?part=117&section=117.8`;
note the API needs `Accept-Encoding` / `curl --compressed`, and the date must not be
later than the title's latest issue date). Full texts are saved in `docs/sources/`.
Key points relied on, all confirmed in `docs/sources/ecfr-117.8-2026-10-29.txt`:

| Paragraph | What it says (rule's words) |
|---|---|
| (a)(1)–(2) | contractors and cleared employees report under the rule, SEAD 3 and CSA guidance; contractor establishes internal procedures so employees know to report to the FSO |
| (b), (b)(1)–(2) | **promptly** submit a written report to the nearest FBI field office on actual, probable or possible espionage, sabotage, terrorism or subversive activities at any of its locations; initial report may be by phone but must be followed in writing regardless of FBI disposition; **promptly** notify the CSA and give it a copy |
| (c)(1), (c)(1)(i)–(ii) | adverse information on employees **determined to be eligible** for access, per the rule, SEAD 3 and CSA guidance; **no reports based on rumor or innuendo**; termination does not negate the duty; if assigned to a USG location, copy of the report and its final disposition to that location's USG security POC; Becker v. Philco defamation protection |
| (c)(2)(i)–(ii) | suspicious contacts with eligible employees and efforts to obtain unauthorized access to the cleared facility; elicitation; contact suggesting targeting by a foreign intelligence service; "See SEAD 3 for specific information to be reported" (no timing word) |
| (c)(3)(i)–(iv) | change in status via the CSA-designated reporting mechanism: death, change in name, termination of employment, change in citizenship (no timing word) |
| (c)(4)(i)–(iv) | naturalization of a non-U.S. citizen employee granted an LAA: city, county, state; date; court; certificate number |
| (c)(5) | employee no longer wishes to be processed / to continue access, and the reason |
| (c)(6) | refusal to sign the SF 312 or other approved NDA |
| (c)(7)(i)–(v) | changed conditions: ownership/control incl. stock transfers; operating name or address; KMP changes (with the (A)–(C) statement); termination of business, bankruptcy, validity-affecting change; material FOCI change by **updated SF 328**; when entering discussions that may reasonably lead to foreign ownership or control, report details **in writing**; forward a Schedule 13D if received. No number of days anywhere. |
| (c)(8) | any change in storage requirement or capability (no timing) |
| (c)(9) | emergency rendering the location incapable of safeguarding: **as soon as possible** |
| (c)(10)(i)–(ii) | prime (incl. subs that subcontracted) reports on a sub; sub reports on its prime |
| (c)(11) | material previously terminated from accountability discovered and brought back |
| (c)(12)(i)–(ii) | pre-contract negotiation or award **not placed through a CSA or U.S. GCA** involving release of U.S. classified to a foreign interest or access to foreign classified |
| (c)(13) | receipt of classified material from foreign interests not through USG channels |
| (c)(14) | subcontractors also notify their prime when they report under (c)(7)–(c)(10) |
| (d), (d)(1)–(4) | loss, compromise, suspected compromise, U.S. or foreign, to the CSA; **each CSA may provide additional guidance on the reporting time period**; on a USG facility also to the **head of the USG facility**; (1) preliminary inquiry **immediately** upon receipt of a violation report, incl. validating classification; (2) if the inquiry confirms, **promptly** submit an initial report unless the CSA says otherwise; (3) final report when the investigation is complete, CSA notifies the GCA; contents (i)–(v); (4) employee information when the CSA requests |
| (e), (e)(1)–(3) | culpability: system to track violators; graduated scale of actions; **final report to the CSA with findings and corrective actions**; statement of actions when the responsible individual can be determined; the three factors (i)–(iii) |
| (f), (f)(1)–(3) | **applies only to CDCs**; in addition to (b) and (d); (1) **immediately** report to the DoD CSO any cyber incident on a classified covered information system that CSO approved; minimum contents (A) technique/method (B) malware sample if isolated (C) summary of affected DoD program information; (1)(iii) reports involving classified **foreign government information go to the Director, DTSA**; (2) non-Federal unclassified systems: **in accordance with contract requirements**; (3) DoD access for forensics |
| (g)(1)–(2) | redundant/duplicative CSA review or audit, and duplicate entity-eligibility processing, to the **Director, ISOO** |

Also verified: §117.7(e) (standard practice procedures: written procedures
"when the CSA determines them to be necessary"); §117.7(d) (insider threat
program: gather, integrate, report); §117.3 definitions of CDC, CSA, FSO, LAA,
KMP, GCA, FGI (in `docs/sources/ecfr-117.3-selected-definitions-2026-10-29.txt`);
§117.19(d) is "International transfers of classified material" (only needed if
the ITPM "international plan" trigger is reused).

### DFARS 252.204-7012 — VERIFIED on acquisition.gov (2026-10-31)
(a): "Rapidly report means within 72 hours of discovery of any cyber incident."
(c)(1)(ii): "Rapidly report cyber incidents to DoD at https://dibnet.dod.mil."
(c)(2): report includes at minimum the required elements at dibnet.dod.mil.
(e): preserve images and monitoring data for at least 90 days from the report.

### SEAD 3 — VERIFIED from the official ODNI PDF (scanned; read page images)
Effective 12 June 2017, signed 14 Dec 2016. Structure that matters:
- **§D** Definitions: D.3 Cohabitant; D.5 Covered individual (incl. (d) contractors);
  D.7 Foreign Intelligence Entity; **D.8 "Foreign National": any person who is not a
  U.S. citizen or a U.S. national**; D.9 Media; D.12 Sensitive Position.
- **§E.2**: covered individuals report "any planned or actual involvement in any of the
  activities below **prior to participation** in such activities **or otherwise as soon
  as possible following the start** of their involvement."
- **§E.7**: heads of agencies may require additional or more detailed reporting.
- **§E.8**: report only to the agency that sponsors the clearance.
- **§F (all covered individuals)**: F.1 Foreign travel: F.1.a official travel per agency;
  **F.1.b unofficial**: F.1.b.1 submit an itinerary and receive approval **prior to the
  travel**; **all deviations from approved itineraries reported within five business
  days of return**; (a) Puerto Rico, Guam, U.S. possessions not foreign; **(b) unplanned
  day trips to Canada or Mexico reported upon return, within five business days**;
  (c) defensive briefing when required; **(d) emergency travel: verbally advise the
  supervisory chain and preferably a security representative before departure; full
  reporting within five business days of return**; (e) agencies may set less specific
  reporting; F.1.b.2 agency may disapprove. **F.2 Foreign contacts**: F.2.a official per
  agency; **F.2.b unofficial: (1) unofficial contact with a known or suspected FIE;
  (2) continuing association with known foreign nationals involving bonds of affection,
  personal obligation or intimate contact, or any contact involving the exchange of
  personal information**; limited or casual public contact not reportable; updates only
  on significant change. **F.3 Reportable actions by others**: a unwillingness to comply
  with rules/cooperate with security; b unexplained affluence or excessive indebtedness;
  c alcohol abuse; d illegal use/misuse of drugs; e apparent or suspected mental health
  issues where there is reason to believe it may impact ability to protect classified;
  f criminal conduct; g any activity raising doubts about continued eligibility;
  h misuse of USG property or information systems. F.4 financial disclosure (EO 12968).
- **§G (Secret/Confidential, "L", non-critical sensitive)**: G.1 Foreign activities:
  a application for and receipt of foreign citizenship; b application for, possession
  or use of a foreign passport or identity card for travel. G.2 Other: **a attempted
  elicitation, exploitation, blackmail, coercion or enticement; b media contacts (other
  than official) seeking classified/protected information; c arrests; d bankruptcy or
  over 120 days delinquent on any debt; e alcohol- and drug-related treatment.** (G.2
  has NO item f.)
- **§H (Top Secret, "Q", critical or special sensitive)**: H.1 Foreign activities:
  a direct involvement in foreign business; b foreign bank accounts; c ownership of
  foreign property; d application for and receipt of foreign citizenship; e foreign
  passport/identity card; f voting in a foreign election; g adoption of non-U.S. citizen
  children. H.2 Other: a elicitation etc.; b media contacts; c arrests; **d financial
  anomalies incl. bankruptcy, garnishment, >120 days delinquent, unusual infusion of
  assets of $10,000 or greater**; e foreign national roommate(s) co-occupying more than
  30 calendar days; f cohabitant(s); g marriage; h alcohol- and drug-related treatment.
- **Appendix A** required data elements: A.1 foreign travel (itinerary, dates, mode and
  carriers, passport data, foreign national companions, planned contacts; post-travel:
  unplanned contacts, unusual/suspicious occurrences, legal or customs incidents);
  A.2 FIE contact; A.3 continuing association/roommate; A.4–A.12 foreign business,
  bank account, property, citizenship, passport (application/possession/use), voting,
  adoption; A.13 elicitation; A.14 media contacts; A.15 arrests (dates, locations,
  charges/circumstances, disposition); A.16 financial issues (type, dollar value,
  reason); A.17 cohabitants; (page 11 continues marriage/treatment elements; not read).

**Website citation discrepancies found against the SEAD 3 text** (the data module
keeps the website's authority string verbatim because the test demands it; put the
correction in the event's `verified` note, show it on the outcome card as "checked
against SEAD 3: …", list it in CITATIONS.md as *corrected* and in HANDOFF.md Open
Questions as a website fix to make):
- `#targeting-criminal` cites "SEAD 3 §§G.1(a), G.2(c)–(d), H.1(d), H.2(b)–(c)". In the
  text, elicitation is G.2(a)/H.2(a), media G.2(b)/H.2(b), arrests G.2(c)/H.2(c).
  G.1(a) and H.1(d) are foreign citizenship; G.2(d) is bankruptcy/debt. Correct cite:
  SEAD 3 §§G.2(a)–(c), H.2(a)–(c); F.3(f) for criminal conduct by others.
- `#conduct-financial` cites "§§G.2(d)–(f), §H.2(d)–(h)". G.2 has no (f); G.2(d)–(e)
  and H.2(d), (h) are the financial/treatment items; H.2(e)–(g) are roommate,
  cohabitant and marriage (living-status, not conduct).
- `#foreign-interests` cites "§§G.1, G.2(d), H.1–2". G.2(d) is bankruptcy; the
  living-status items are H.2(e)–(g). Correct: §§G.1, H.1, H.2(e)–(g).
- `#travel` (§F.1(b), App. A.1), `#foreign-contacts` (§§D.8, F.2), `#peer-concerns`
  (§F.3): verified as written.
- All 19 company-row authorities: verified as written against §117.8 (the trailing
  period is part of the website string; keep it).

### ISL 2021-02 — NOT verified: the DCSA PDF returns HTTP 403 to this environment
(also via the fetch agent; do not try to disguise the client). Rely on the website's
reviewed wording (the page says it was checked against the May 2024 revision on
23 September 2026) and on the ITPM repository's `CITATIONS.md`, which quotes the owner's
DCSA Library copy: covered individuals = granted eligibility through the NISP or in
process; written plan/SPP required for DCSA-cognizant contractors (citing §117.7(e));
reports based on the 13 adjudicative guidelines; DISS or successor is the system;
an expected departure does not change the duty; the ISL states it does not alter or
supersede 32 CFR part 117. Say in CITATIONS.md that the ISL text was not re-checked
in this pass and label ISL-only outcomes on the page (`isl-crypto-row`,
`isl-mental-health-row`, Tables 1–4 references) "wording from the fsotools.ai
reviewed table". If the local machine can open the PDF, verify Tables 1–4 and remove
the label.

### Not re-checked (cite as guidance, as the ITPM does)
SEAD 4; the DCSA SEAD 3 Desktop Aid (May 2024); the October 2026 DCSA ISE deck and the
September 2026 VOI (the website's `#incident-workflow` and `#facility-routes` notes:
DISS incidents for people with a clearance, in process, or reinstatable eligibility;
changed conditions NISS → Entity Vetting; ISP for international plans). Reuse the
website's wording and link `https://fsotools.ai/guidance/october-2026/`.

---

## 4. Design decisions already taken (keep them unless the owner says otherwise)

**Pages and files**
```
src/index.html        overview + workbook strip (blank workbook: Read Me, Reporting Log, File Notes)
src/decide.html       the guided path + session reporting log
src/file-note.html    standalone printable file note, prefillable from decide.html by URL query
                      (?event=<id>&a=<qid>:<v>,<qid>:<v>&learned=YYYY-MM-DD&anchor=YYYY-MM-DD);
                      reading location.search is not storage; nothing user-typed goes in the URL
src/assets/ra.css           tool styles (copy what you need from ITPM itp.css: .itp-privacy, .itp-workbook,
                            .itp-cards, .itp-result, .itp-table…, keep the same class names so
                            ra-identity.css restyles them; add .ra-note print layout)
src/assets/ra-events.js     data + pure decision engine (testable in a vm sandbox)
src/assets/ra-workbook.js   sheets, formulas, matching JS rules, shared helpers (today, addDays, workday,
                            dueDate, noteAlert, parsePasted, fileName, guardUnsaved) — port from itp-workbook.js
src/assets/ra-hub.js        blank workbook download (button #ra-blank on every page)
src/assets/ra-decide.js     DOM glue for decide.html
src/assets/ra-file-note.js  DOM glue for file-note.html
```
Script order in every page: `ra-citation-links.js`, `ra-xlsx.js`, `ra-workbook.js`,
`ra-events.js`, then the page script, then `ra-hub.js`. Stylesheets: `base.css`,
`ra.css`, `ra-identity.css` (identity last; it only applies `@media screen`).
Navigation on every page (test pins it): Overview · Decide · File note. Brand
descriptor text: `REPORTING DECISION AID / FIELD TOOLS`. Head tags per page: title
`… · FSO Reporting Assistant`, description ≤160, `<link rel="canonical">` and
`og:url` = `https://fsotools.ai/reporting/aid/app/` (index), `…/app/decide`,
`…/app/file-note`; og:image `https://fsotools.ai/assets/fsotools-share-v2.png`
1200×630; twitter:card summary_large_image; favicon data: SVG copied from the ITPM page.

**Step 1 branches** (`BRANCHES`): `self` (a cleared or in-process employee's own
event), `other` (something observed about another person), `company` (the company,
facility or contract), `material` (classified material or a system), `visitor` (a
visitor or foreign contact). An event may sit in several branches.

**Event → branch and group mapping (27 rows + 1 fallback)**
- self: travel, foreign-contacts, foreign-interests, targeting-criminal,
  conduct-financial, isl-crypto-row, isl-mental-health-row (group "SEAD 3 self-reports
  the employee makes to the FSO"); c-status, c-laa, c-withdraw, c-nda (group "Status
  changes the company reports").
- other: peer-concerns, c-adverse, c-suspicious, c-espionage, c-culpability.
- company: c-sead3-procedures, company-changes, c-storage, c-emergency, c-subcontract,
  c-foreign-contract, c-isoo.
- material: c-loss, c-rediscovered, c-foreign-material, c-cyber (+ c-espionage).
- visitor: c-suspicious, foreign-contacts, targeting-criminal, c-espionage,
  c-foreign-material.
- fallback `unsure` ("Something else, or not sure"): not counted as a row; outcome
  "take it to the FSO/ITPSO now; write down who/what/when/where; do not investigate";
  links to the ITPM insider-threat page and the industry guide.

**Clarifying questions** (`QUESTIONS`, each with options and a `settle` text used when
the answer is "Not sure"): `danger` (anyone in immediate danger / material at immediate
risk → Stop: emergency route: 911 / facility emergency procedures, then return),
`dod` (DCSA is your CSA? drives DISS/NISS/IS Rep naming; ISL applies only under DoD
cognizance; remember the last answer within the session, in memory only), `covered`
(eligibility through the NISP, in process, or reinstatable; "no" → Not under these
rules, but consider: sensitive-position-only people report through their Government
customer; the ITPSO may still need it), `level` (TS/Q/critical-special sensitive vs
Secret/Confidential/L/non-critical; drives TS-only items), `rumor` (first-hand or
credible facts, not rumor/innuendo; "no" → Not under these rules, but consider: give
the facts to the ITPSO, record the decision), `govsite` (USG facility / assigned to a
USG location → adds Government facility head (loss) or USG security POC copy +
disposition (adverse)), `sub` (subcontractor → also notify the prime for (c)(7)–(10)),
`cdc` (cleared defense contractor; "no" → §117.8(f) does not apply, but consider the
contract), `classifiedSystem` (DoD-CSO-approved classified system → immediately to
the DoD CSO; else contract/DFARS), `dfars` (clause present → 72 hours to dibnet.dod.mil),
`fgi` (classified foreign government information incl. NATO → cyber: also Director,
DTSA per (f)(1)(iii); loss: note §117.19 and contract FGI instructions), `confirmed`
(preliminary inquiry confirmed? "no" → outcome kind `inquiry`: "Not yet: start the
preliminary inquiry immediately; report promptly if it confirms"), `determined`
(responsible individual determined? "no" → track in the violations system; final
culpability report when determined), `role` (prime/higher-tier vs subcontractor),
`laa`, `placed` (through a CSA or U.S. GCA? "yes" → not (c)(12)), `usgChannels`
("yes" → not (c)(13)), `espionage` (could it be espionage etc.? "yes" → add FBI under
(b); "not sure" settle: report under (c)(2) now and ask the DCSA CI representative
about the FBI route), and the per-event pickers `travelPhase` (before the trip /
after return: deviation, unplanned Canada–Mexico day trip, emergency travel),
`contactType` (FIE / continuing relationship / official work contact without bonds /
casual public contact), `interestType` (citizenship or passport [all levels] /
foreign business, bank account, property [TS] / voting [TS] / adoption [TS] /
roommate >30 days, cohabitant, marriage [TS] / something else in ISL Tables 2–3 →
settle), `targetType` (elicitation etc. / media contact / arrest / other criminal or
law-enforcement involvement → settle on ISL Table 2), `conductType` (bankruptcy or
>120 days delinquent [all] / garnishment or unusual infusion ≥$10,000 [TS] /
alcohol- or drug-related treatment [all] / other ISL Tables 1–3 matter → settle),
`cryptoType` (foreign-state backed/hosted/managed / wallet hosted by a foreign
exchange / only via a widely diversified fund → consider / employee unaware → consider /
no foreign nexus → consider), `mhType` (the seven ISL Table 1 events as listed on the
website / routine care not on the list → consider), `changeType` (ownership-control /
name-address / KMP / termination-reorganization-bankruptcy / material FOCI change or
negotiations / other validity-affecting).

**Decision engine** `RaEvents.decide(eventId, answers)` → one of
`{ kind: 'question', question }`, `{ kind: 'settle', title, text }`,
`{ kind: 'stop' }` (emergency), `{ kind: 'consider', title, text, next }`,
`{ kind: 'inquiry' | 'duty' | 'yes', title, text, recipients[], when, include[], next[], authority, verified?, links{ site, cfr, sead3?, isl? } }`.
Each event: `ask(answers)` returns the ordered question ids that apply (so `dfars`
only when `classifiedSystem === 'no'`); first unanswered → question; an `unsure`
answer → settle with that question's `settle` text (event may override); then
`rules(answers)` builds the outcome. Recipients are objects
`{ who, via, basis, kind: 'required' | 'conditional' | 'practice' }` rendered one per
line; wording of `who`: "DCSA (your CSA)", "FBI, nearest field office", "GCA / customer",
"Prime contractor", "DoD cognizant security office (CSO)", "DoD at dibnet.dod.mil",
"Director, ISOO", "Head of the U.S. Government facility", "USG security point of
contact for the location", "Director, DTSA". `via` names DISS, NISS, the IS Rep, or
"the CSA's designated channel" when not DoD.

**Clocks** `when = { text, days?, business?, from }` with `from` ∈ learned | return |
discovery | departure. Numeric clocks in the rule set: "within five business days
after return" (days 5, business, from return: travel deviations, unplanned day trips,
emergency travel), "within 72 hours of discovery" (days 3, from discovery, note that
the hour matters; DFARS). Everything else keeps the rule's word ("promptly",
"immediately", "as soon as possible", "in advance / before departure", "in writing
when discussions begin", or none) and shows "No fixed clock in the rule: enter your
company standard." `RaWorkbook.dueDate(anchorIso, when)`: business → WORKDAY
semantics (skip Saturday/Sunday, no holidays), else calendar days; '' when no number.

**Workbook** (`ra-workbook.js`), sheets defined once:
- Read Me (notes sheet).
- **Reporting Log**: the 15 ITPM columns, headers and widths identical, so rows paste
  across: Log no. · Date learned (date) · Subject: name or internal ID · What happened
  (trigger) · Report to · Channel or system · Timing · Due by (date) · Date submitted
  (date) · Reference or confirmation no. · Status (list Open, Submitted, Closed, Not
  reportable) · ITPSO reviewed (Yes/No) · Authority · Notes · Days open (formula
  `IF(B{r}="","",IF(I{r}="",TODAY()-B{r},I{r}-B{r}))`). Add an Overdue highlight as an
  `expr` rule on Due by: `AND(H2<>"",H2<TODAY(),K2="Open")` → dxf 0 (columns unchanged,
  so compatibility holds; the aid writes the computed due date into Due by).
- **File Notes**: Case ID · Date learned (date) · Time learned · How learned (role) ·
  Branch · Event · Outcome · Facts as known (wrap) · Recipients and channels (wrap) ·
  Clock (days) (number) · Clock basis (list: calendar, business) · Due by (formula
  `IF(OR(B{r}="",J{r}=""),"",IF(K{r}="business",WORKDAY(B{r},J{r}),B{r}+J{r}))`) · Date
  submitted (date) · Reference or confirmation no. · Status (list as above) · Alert
  (formula: `IF(A{r}="","",IF(O{r}="Open",IF(L{r}="","No clock: company standard",IF(L{r}<TODAY(),"Overdue",IF(L{r}-TODAY()<=2,"Due soon","On track"))),""))`)
  · Prepared by (role/initials) · Reviewed by · Follow-up actions (wrap) · Follow-up
  due (date) · Authority (wrap). Highlight Alert: Overdue → 0, Due soon → 1, On track → 2.
  JS rules `dueDate()` and `noteAlert(row, today)` must match; tests pin both on a table
  of cases (weekend-crossing business days, blank clock, submitted, not reportable).
  The ITPM used the Python `formulas` library to double-check Excel; if unavailable,
  hand-check and say so in HANDOFF.md.
- Exports: decide.html → workbook with Read Me + Reporting Log; file-note.html →
  Read Me + Reporting Log + File Notes (the note as one File Notes row and one log row).
  Blank workbook: Read Me, Reporting Log, File Notes with 200 blank rows. File names
  `RA-workbook.xlsx`, `RA-reporting-log-YYYY-MM-DD.xlsx`, `RA-file-notes-YYYY-MM-DD.xlsx`.

**File note (print)**: one page; body gets class `ra-printing` on "Print / save as PDF"
then `window.print()`; `@media print` hides nav, footer, toolbar and shows only the
note. Subject defaults to `CASE-YYYY-MM-DD-01`-style internal ID with the note "enter a
name only in the company's protected records". Facts box carries the warning: no
diagnoses, no rumor or innuendo, §117.8(c)(1) wording verified. Labels on every input;
all buttons keyboard-operable; no horizontal scroll at 390 px.

**Tests** (`test/assistant.test.js`, node --test; ports of the ITPM tests plus):
events: exactly 27 rows with the fixture's ids, every SITE_ROWS field equals
`test/fixtures/industry-rows.json`, and equals the live website table when
`../fsotools-website/site/reporting/industry/index.html` exists (same extractor logic
as `docs`… the one used was: `<tr id="…"><th scope="row">…</th>` + three `<td>`s;
company rows: trigger = heading, route = td0, timing = td1, authority = td2; SEAD 3
rows: trigger = td0, route = td1, authority = td2); every event has ≥1 branch, a
label, and decide() with no answers returns a question or an outcome; walking every
option combination (bounded) never throws and every `yes` outcome has ≥1 recipient,
a `when.text`, an authority and a site link; every `unsure` answer yields `settle`;
`ra-xlsx.js` body (after the header comment, from `// Sheet definition:`) is
byte-identical to the ITPM file when that checkout exists; every `§117.…`, `SEAD 3 §…`,
`ISL …`, `DFARS …` citation string found in src/ pages and ra-events.js appears in
CITATIONS.md (normalize whitespace; extract with a regex like
`/(?:32 CFR )?§{1,2}\s*117\.\d+(?:\([a-z0-9]+\))*(?:[–-]\([a-z0-9]+\))*|SEAD 3 §{1,2}[A-H](?:\.\d+)?(?:\([a-z]\))?(?:[–-][A-H]?\.?\d*(?:\([a-z]\))?)?|ISL (?:Tables? [\d–-]+|2021-02)|DFARS 252\.204-7012(?:\([a-z0-9]+\))*/g`).

**Commit plan** (small steps): 1 scaffold (done) · 2 workbook + tests · 3 events engine
+ tests · 4 pages + CSS + build tests · 5 file note · 6 docs (README, HANDOFF, CITATIONS,
CLAUDE/AGENTS) · 7 Playwright check and fixes · 8 final site-bundle from the clean tree.

---

## 5. Open points to carry into HANDOFF.md "Open Questions"
- ISL 2021-02 text not re-checked (403 from DCSA to the build environment).
- Three website SEAD 3 citations to correct on fsotools.ai (section 3 above).
  **Done on the website side (2026-10-31, branch `claude/brave-newton-i9x65y` of
  fsotools-website, verified against the ODNI SEAD 3 text):** the three Reference
  cells now read `SEAD 3 §§G.2(a)–(c), H.2(a)–(c), F.3(f); ISL Table 2`,
  `SEAD 3 §§G.2(d)–(e), H.2(d), H.2(h); ISL Tables 1–3` and
  `SEAD 3 §§G.1, H.1, H.2(e)–(g); ISL Tables 2–3`. Refresh
  `test/fixtures/industry-rows.json` and `ra-events.js` from that branch (or from
  `main` once it merges) so the authorities match again.
- `ra-xlsx.js` keeps the ITPM body verbatim, so file properties still say
  "FSOtools ITP workbook" in docProps/app.xml; the owner may want a product-neutral
  string in both repositories.
- Business-day due dates ignore Federal holidays (Excel WORKDAY without a holiday list);
  the page says so.
- Whether to include the ITPM "international transportation plan" (ISP) trigger
  (§117.19(d); not a §117.8 report) as a 28th event.
- Owner review of plain-language labels and of the "Not under these rules, but
  consider…" texts, which are good-practice guidance, not rule text.

## 6. What to do first in the local session
1. `git pull`, `npm test` (there are no tests yet; add them as you go).
2. Read the ITPM files listed in section 2, then write `ra-workbook.js` and its tests.
3. Finish `ra-events.js` (section 4) and its tests, then the pages.
4. Keep this file's section 3 as the basis of `CITATIONS.md`.
