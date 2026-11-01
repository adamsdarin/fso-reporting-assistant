# Citations

Every regulatory citation in the FSO Reporting Assistant, checked against the
official texts:

- **32 CFR Part 117** on eCFR (www.ecfr.gov, versioner API, `title-32.xml?part=117`),
  **current as of 29 October 2026**: §117.3 (definitions), §117.7, §117.8,
  §117.12, §117.19. The texts are saved under `docs/sources/`.
- **SEAD 3** (ODNI, *Reporting Requirements for Personnel with Access to Classified
  Information or Who Hold a Sensitive Position*, signed 14 December 2016, effective
  12 June 2017), read from the official scanned PDF at
  https://www.dni.gov/files/NCSC/documents/Regulations/SEAD-3-Reporting-U.pdf on 31 October 2026.
- **DFARS 252.204-7012** on acquisition.gov, read 31 October 2026.
- **DCSA ISL 2021-02** (issued 12 August 2021, revised May 2024): **not re-read
  in this pass.** The DCSA PDF returned HTTP 403 to the build environment. ISL
  wording follows the reviewed table on https://fsotools.ai/reporting/industry/
  (checked there against the May 2024 revision on 23 September 2026) and the FSO
  ITPM Assistant's CITATIONS.md, which quotes the owner's DCSA Library copy. The
  pages label ISL-only statements "wording from the fsotools.ai reviewed table".
- SEAD 4, the DCSA SEAD 3 Desktop Aid, the DCSA October 2026 Industry Stakeholder
  Engagement briefing and the September 2026 Voice of Industry are cited as
  guidance through the website's October 2026 notes and were not re-checked.

Status: **verified** (the cite and the claim match the text), **corrected**
(the website's cite differs from the text; the data module keeps the website's
authority string verbatim and shows the check on the outcome card), or
**good practice** (the rule does not require it, and the pages say so).

## 32 CFR §117.8 — verified as written

| Cite | What the rule says, and where the aid uses it |
|---|---|
| §117.8, §117.8(a), §117.8(a)(2) | General: contractors and cleared employees report under the rule, SEAD 3 and CSA guidance; the contractor establishes internal procedures so eligible employees know to report to the FSO. Used by the SPP duty (`c-sead3-procedures`) with §117.7(e) and the recipient line "FSO or designee". |
| §117.8(b), §117.8(b)(1), §117.8(b)(2), §117.8(b)(1)–(2) | **Promptly** submit a written report to the nearest FBI field office on actual, probable or possible espionage, sabotage, terrorism or subversive activities at any of its locations; an initial report may be by phone but must be followed in writing regardless of the FBI's disposition; promptly notify the CSA and give it a copy. `c-espionage`; the FBI line on `c-suspicious` and elicitation. |
| §117.8(c)(1), §117.8(c)(1)(i), §117.8(c)(1)(ii) | Adverse information on employees determined to be eligible, per the rule, SEAD 3 and CSA guidance; **no reports based on rumor or innuendo**; termination does not negate the duty; copy and final disposition to the USG security POC when assigned to a USG location; Becker v. Philco. `c-adverse`, the rumor gate, the file note warning, the workbook Read Me. |
| §117.8(c)(2), §117.8(c)(2)(i), §117.8(c)(2)(i)–(ii) | Suspicious contacts with eligible employees; efforts to obtain unauthorized access to the facility or to classified information; elicitation; contact suggesting targeting by a foreign intelligence service; "See SEAD 3 for specific information to be reported". No timing word. `c-suspicious`, `foreign-contacts` (FIE), `targeting-criminal` (elicitation). |
| §117.8(c)(3), §117.8(c)(3)(i)–(iv), §117.8(c)(3)(iv) | Change in status via the CSA-designated mechanism: death, change in name, termination of employment, change in citizenship. `c-status`; the `c-laa` "No" branch. |
| §117.8(c)(4), §117.8(c)(4)(i)–(iv) | Naturalization of a non-U.S. citizen employee granted an LAA: city, county and state; date; court; certificate number. `c-laa`. |
| §117.8(c)(5) | Employee no longer wishes to be processed or to continue access, and the reason. `c-withdraw`. |
| §117.8(c)(6) | Refusal to sign the SF 312 or other approved NDA. `c-nda`. |
| §117.8(c)(7), §117.8(c)(7)(i), (ii), (iii), (iv), (v), §117.8(c)(7)(i)–(v) | Changed conditions: ownership or control incl. stock transfers; operating name or address; KMP changes with the (A)–(C) statement (a complete list only at the contractor's discretion or on request); termination, bankruptcy, validity-affecting changes; material FOCI change by updated SF 328; discussions that may reasonably lead to foreign ownership or control reported in writing; Schedule 13D forwarded. No number of days. `company-changes`. |
| §117.8(c)(7)–(10), §117.8(c)(14) | Subcontractors also notify their prime when they report under (c)(7) through (c)(10). The `sub` question and the "Prime contractor" line. |
| §117.8(c)(8) | Any change in storage requirement or capability to safeguard classified material (no timing). `c-storage`. The website's "before relying on a changed capability" is the website's wording, labelled as such. |
| §117.8(c)(9) | Emergency rendering the location incapable of safeguarding: **as soon as possible**. `c-emergency`, the Stop card. |
| §117.8(c)(10), §117.8(c)(10)(i), §117.8(c)(10)(ii), §117.8(c)(10)(i)–(ii) | Prime (incl. subs that subcontracted) reports on a subcontractor; a subcontractor reports on its prime. `c-subcontract`. |
| §117.8(c)(11) | Material previously terminated from accountability discovered and brought back. `c-rediscovered`. |
| §117.8(c)(12), §117.8(c)(12)(i)–(ii) | Pre-contract negotiation or award not placed through a CSA or U.S. GCA involving release of U.S. classified information to a foreign interest or access to foreign classified information. `c-foreign-contract`. |
| §117.8(c)(13) | Receipt of classified material from foreign interests not through USG channels. `c-foreign-material`. |
| §117.8(d), §117.8(d)(1), §117.8(d)(2), §117.8(d)(1)–(2), §117.8(d)(3), §117.8(d)(3)(i)–(v), §117.8(d)(4), §117.8(d)(1)–(4) | Loss, compromise or suspected compromise, U.S. or foreign, to the CSA; each CSA may provide additional guidance on the reporting time period; on a USG facility also to the head of the USG facility; preliminary inquiry **immediately** on receipt of a violation report, validating classification; initial report **promptly** if the inquiry confirms, unless the CSA says otherwise; final report when the investigation is complete, with (i)–(v); the CSA notifies the GCA; employee information on request. `c-loss`, the `confirmed` gate. |
| §117.8(e), §117.8(e)(1), §117.8(e)(2), §117.8(e)(3), §117.8(e)(2)–(3), §117.8(e)(1)–(3), §117.8(e)(3)(i)–(iii) | Culpability: a system to track violators and patterns; a graduated scale of actions; a final report to the CSA with the findings and corrective actions; a statement of actions when the responsible individual can be determined; the three factors. `c-culpability`. |
| §117.8(f), §117.8(f)(1), §117.8(f)(1)(i)(A)–(C), §117.8(f)(1)(iii), §117.8(f)(2), §117.8(f)(3) | Applies only to CDCs; in addition to (b) and (d); **immediately** report to the DoD CSO any cyber incident on a classified covered information system that CSO approved; minimum contents; reports involving classified foreign government information go to the Director, DTSA; unclassified non-Federal systems per contract requirements; DoD access for forensic analysis. `c-cyber`, the `cdc`, `classifiedSystem` and `fgi` questions. |
| §117.8(g), §117.8(g)(1), §117.8(g)(2), §117.8(g)(1)–(2) | Redundant or duplicative CSA review or audit, and duplicate entity-eligibility processing, to the Director, ISOO. `c-isoo`. |

## Other 32 CFR Part 117 paragraphs — verified

| Cite | What it says |
|---|---|
| §117.7(d) | The insider threat program gathers, integrates and reports relevant and available information indicative of a potential or actual insider threat. The "ITPSO (internal)" recipient line is marked good practice with this cite. |
| §117.7(e) | Standard practice procedures: written procedures when the CSA determines them to be necessary. The SPP duty with ISL 2021-02 (the ISL being DCSA's determination, per the website and the ITPM check of the ISL). |
| §117.19 | International security requirements (foreign government information, international transfers). Cited by section only, as "check §117.19 and the contract", on foreign-material, foreign-contract and FGI outcomes. |
| §117.3 | Definitions of CDC, CSA, FSO, GCA, LAA, KMP and FGI used in the questions (saved in `docs/sources/`). |

## SEAD 3 — verified against the ODNI text

| Cite | What it says, and where the aid uses it |
|---|---|
| SEAD 3 §D.8 | "Foreign National": any person who is not a U.S. citizen or a U.S. national. `foreign-contacts`. |
| SEAD 3 §E.2 | Covered individuals report planned or actual involvement **prior to participation** or otherwise **as soon as possible following the start** of their involvement. Used as the "By when" of the SEAD 3 self-reports that have no number of days. |
| SEAD 3 §E.7 | Heads of agencies may require additional or more detailed reporting. Used on the "not required for this category" outcomes. |
| SEAD 3 §F.1(b), SEAD 3 §F.1(b)(1)(c) | Unofficial foreign travel: itinerary and approval prior to travel; deviations within **five business days of return**; unplanned Canada or Mexico day trips reported within five business days; defensive briefing when required ((1)(c)); emergency travel reported verbally before departure and in full within five business days of return ((1)(d)). `travel`. |
| SEAD 3 §F.2, §F.2(a), §F.2(b) | Foreign contacts: official per agency ((a)); unofficial: contact with a known or suspected foreign intelligence entity ((b)(1)); continuing association with known foreign nationals involving bonds of affection, personal obligation or intimate contact, or any contact involving the exchange of personal information ((b)(2)); limited or casual public contact not reportable; updates only on a significant change. `foreign-contacts`. |
| SEAD 3 §F.3, §F.3(a)–(h), §F.3(e) | Reportable actions by others: (a) unwillingness to comply with rules or cooperate with security; (b) unexplained affluence or excessive indebtedness; (c) alcohol abuse; (d) illegal use or misuse of drugs; (e) apparent or suspected mental health issues where there is reason to believe they may impact the ability to protect classified information; (f) criminal conduct; (g) activity raising doubts about continued eligibility; (h) misuse of USG property or information systems. `peer-concerns`. |
| SEAD 3 §G.1, §G.1(a), §G.1(a)–(b) | Secret, Confidential, "L", non-critical sensitive: foreign activities: (a) application for and receipt of foreign citizenship; (b) application for, possession or use of a foreign passport or identity card. `foreign-interests`. |
| SEAD 3 §G.2, §G.2(a), §G.2(b), §G.2(c), §G.2(d), §G.2(e), §G.2(d)–(e) | Other reportable activities for that category: (a) attempted elicitation, exploitation, blackmail, coercion or enticement; (b) media contacts (other than official) seeking classified or protected information; (c) arrests; (d) bankruptcy or over 120 days delinquent on any debt; (e) alcohol- and drug-related treatment. **§G.2 has no item (f).** `targeting-criminal`, `conduct-financial`. |
| SEAD 3 §H, §H.1(a)–(c), §H.1(d)–(e), §H.1(f), §H.1(g) | Top Secret, "Q", critical or special sensitive: foreign activities: (a) direct involvement in foreign business; (b) foreign bank accounts; (c) ownership of foreign property; (d) foreign citizenship; (e) foreign passport or identity card; (f) voting in a foreign election; (g) adoption of non-U.S. citizen children. `foreign-interests`. |
| SEAD 3 §H.2(d), §H.2(e)–(g), §H.2(h) | (d) financial anomalies incl. bankruptcy, garnishment, over 120 days delinquent, unusual infusion of assets of $10,000 or greater; (e) foreign national roommate(s) co-occupying more than 30 calendar days; (f) cohabitant(s); (g) marriage; (h) alcohol- and drug-related treatment. (a)–(c) repeat elicitation, media contacts and arrests. `conduct-financial`, `foreign-interests`. |
| SEAD 3 App. A.1(a)–(j), SEAD 3 App. A.1(a), SEAD 3 App. A.1(g), App. A.1(h), App. A.1(i)–(j) | Required data elements for foreign travel: (a) complete itinerary; (b) dates; (c) mode of transportation and carriers; (d) passport data; (e) foreign national travelling companions; (f) planned contacts; (g) unplanned contacts (post-travel); (h) emergency point of contact; (i) unusual or suspicious occurrences (post-travel); (j) foreign legal or customs incidents (post-travel). `travel`. |
| SEAD 3 App. A.2, SEAD 3 App. A.3, App. A.4–A.12, SEAD 3 App. A.7–A.10, App. A.11, App. A.12, SEAD 3 App. A.13, App. A.14, App. A.15, SEAD 3 App. A.16, App. A.17 | Data elements: A.2 FIE contact; A.3 continuing association or roommate; A.4 foreign business; A.5 bank account; A.6 property; A.7 citizenship; A.8–A.10 passport application, possession, use; A.11 voting; A.12 adoption; A.13 elicitation; A.14 media contacts; A.15 arrests; A.16 financial issues and anomalies; A.17 cohabitants. Listed under "What to include". |

### Corrected: website SEAD 3 cites that differ from the text

The website's authority strings are kept verbatim in `SITE_ROWS` (the test
requires it); the outcome card shows the check; `HANDOFF.md` lists the website
fixes to make.

| Website row | Website cite | What the SEAD 3 text has |
|---|---|---|
| `#targeting-criminal` | SEAD 3 §§G.1(a), G.2(c)–(d), H.1(d), H.2(b)–(c) | Elicitation §G.2(a)/§H.2(a); media contacts §G.2(b)/§H.2(b); arrests §G.2(c)/§H.2(c). §G.1(a) and §H.1(d) are foreign citizenship; §G.2(d) is bankruptcy or debt. **Corrected** on the card. |
| `#conduct-financial` | SEAD 3 §§G.2(d)–(f), §H.2(d)–(h) | §G.2(d)–(e) and §H.2(d), (h) are the financial and treatment items; §G.2 has no (f); §H.2(e)–(g) are roommate, cohabitant and marriage. **Corrected** on the card. |
| `#foreign-interests` | SEAD 3 §§G.1, G.2(d), H.1–2 | §G.1, §H.1 and §H.2(e)–(g); §G.2(d) is bankruptcy. **Corrected** on the card. |
| `#travel`, `#foreign-contacts`, `#peer-concerns` | §F.1(b), App. A.1; §§D.8, F.2; §F.3 | **Verified** as written. |
| All 19 company rows | 32 CFR §117.8(…) | **Verified** as written (the trailing period is part of the website string). |

## DFARS 252.204-7012 — verified on acquisition.gov

| Cite | What the clause says |
|---|---|
| DFARS 252.204-7012(a) | "Rapidly report means within 72 hours of discovery of any cyber incident." The 72-hour clock. |
| DFARS 252.204-7012(c), (c)(1)(ii), DFARS 252.204-7012(c)(2), DFARS 252.204-7012(c)(3) | Cyber incident reporting requirement: rapidly report to DoD at https://dibnet.dod.mil; the report includes at minimum the required elements at dibnet.dod.mil; a DoD-approved medium assurance certificate is required to report. |
| DFARS 252.204-7012(d) | Isolated malicious software is submitted to the DoD Cyber Crime Center (DC3) as DC3 or the Contracting Officer instructs, not to the Contracting Officer. |
| DFARS 252.204-7012(e) | Preserve and protect images of all known affected information systems and relevant monitoring/packet capture data for at least 90 days from the submission of the report. |
| DFARS 252.204-7012(f) | On request, access for DoD to additional information or equipment necessary for forensic analysis. |
| DFARS 252.204-7012(m) | The clause is included in subcontracts for operationally critical support or involving covered defense information. |

## ISL 2021-02 — from the fsotools.ai reviewed table (not re-read)

| Cite | What the aid takes from it |
|---|---|
| ISL 2021-02 | Covered individuals: eligibility granted through the NISP or in process; DCSA-cognizant contractors keep a written plan or SPP for SEAD 3 reporting (citing §117.7(e)); reports are based on the 13 adjudicative guidelines; DISS or its successor is the system; termination does not change the duty; the ISL does not alter or supersede 32 CFR part 117. |
| ISL Table 1 | The defined foreign cryptocurrency criterion with its exceptions (unawareness; widely diversified funds), and the specified mental-health events. |
| ISL Table 2, ISL Tables 2–3, ISL Tables 1–3 | Clarifications of SEAD 3 items by category (official contacts, continuing relationships, peer reporting, citizenship, media contacts, arrests, treatment, debt; Top Secret items). The aid sends "something else in this row" to "settle before deciding". |
| ISL Table 4 | Unofficial foreign travel reporting for DoD-cognizant industry. |
| ISL Appendix A | Data elements of the cryptocurrency report: name, exchange-host country, dollar value. |

## Guidance cited through the website's October 2026 notes (not re-checked)

- DCSA Industry Stakeholder Engagement, October 6, 2026: DISS incidents cover people
  with a clearance, in process, or reinstatable eligibility; do not delay a required
  report for an internal investigation; changed conditions route through NISS to
  Entity Vetting. Linked as https://fsotools.ai/guidance/october-2026/.
- The DCSA SEAD 3 Industry Reporting Desktop Aid (May 2024), named on the
  foreign-interests outcome.

## Good practice (the rule does not require it)

- Giving the facts to the ITPSO (§117.7(d) describes the program; the rule does not
  say the FSO must route every report to it).
- Telling the GCA or customer when the contract or DD Form 254 requires it (contract
  terms, not §117.8); asking the DCSA counterintelligence representative; telling the
  IS Rep after an ISOO report; reviewing the SPP yearly; preserving records.
- The file note's fields and layout; the "Not under these rules, but consider…" and
  "settle before deciding" texts, which restate the rule and say what to check.
- Business days computed without a holiday list (SEAD 3 does not define "business
  days"); the page says so.

## Index of every cite string the pages and the data module use

The test checks each string below against this file exactly as the page or the data module writes it (the website’s own authority strings included).

**32 CFR Part 117**

- `§117.7(d)` — verified
- `§117.7(e)` — verified
- `§117.8` — verified
- `§117.8(a)` — verified
- `§117.8(a)(2)` — verified
- `§117.8(b)` — verified
- `§117.8(b)(1)` — verified
- `§117.8(b)(1)–(2)` — verified
- `§117.8(b)(2)` — verified
- `§117.8(c)(1)` — verified
- `§117.8(c)(1)(i)` — verified
- `§117.8(c)(1)(ii)` — verified
- `§117.8(c)(2)` — verified
- `§117.8(c)(2)(i)` — verified
- `§117.8(c)(2)(i)–(ii)` — verified
- `§117.8(c)(3)` — verified
- `§117.8(c)(3)(i)–(iv)` — verified
- `§117.8(c)(3)(iv)` — verified
- `§117.8(c)(4)` — verified
- `§117.8(c)(4)(i)–(iv)` — verified
- `§117.8(c)(5)` — verified
- `§117.8(c)(6)` — verified
- `§117.8(c)(7)` — verified
- `§117.8(c)(7)–(10)` — verified
- `§117.8(c)(7)(i)` — verified
- `§117.8(c)(7)(i)–(v)` — verified
- `§117.8(c)(7)(ii)` — verified
- `§117.8(c)(7)(iii)` — verified
- `§117.8(c)(7)(iv)` — verified
- `§117.8(c)(7)(v)` — verified
- `§117.8(c)(8)` — verified
- `§117.8(c)(9)` — verified
- `§117.8(c)(10)` — verified
- `§117.8(c)(10)(i)` — verified
- `§117.8(c)(10)(i)–(ii)` — verified
- `§117.8(c)(10)(ii)` — verified
- `§117.8(c)(11)` — verified
- `§117.8(c)(12)` — verified
- `§117.8(c)(12)(i)–(ii)` — verified
- `§117.8(c)(13)` — verified
- `§117.8(c)(14)` — verified
- `§117.8(d)` — verified
- `§117.8(d)(1)` — verified
- `§117.8(d)(1)–(2)` — verified
- `§117.8(d)(1)–(4)` — verified
- `§117.8(d)(2)` — verified
- `§117.8(d)(3)` — verified
- `§117.8(d)(3)(i)–(v)` — verified
- `§117.8(d)(4)` — verified
- `§117.8(e)` — verified
- `§117.8(e)(1)` — verified
- `§117.8(e)(1)–(3)` — verified
- `§117.8(e)(2)` — verified
- `§117.8(e)(2)–(3)` — verified
- `§117.8(e)(3)` — verified
- `§117.8(e)(3)(i)–(iii)` — verified
- `§117.8(f)` — verified
- `§117.8(f)(1)` — verified
- `§117.8(f)(1)(i)` — verified
- `§117.8(f)(1)(iii)` — verified
- `§117.8(f)(2)` — verified
- `§117.8(f)(3)` — verified
- `§117.8(g)` — verified
- `§117.8(g)(1)` — verified
- `§117.8(g)(1)–(2)` — verified
- `§117.8(g)(2)` — verified
- `§117.19` — verified

**SEAD 3**

- `SEAD 3 §D.8` — verified
- `SEAD 3 §E.2` — verified
- `SEAD 3 §E.7` — verified
- `SEAD 3 §F.1(b)` — verified
- `SEAD 3 §F.1(b)(1)(c)` — verified
- `SEAD 3 §F.2` — verified
- `SEAD 3 §F.2(a)` — verified
- `SEAD 3 §F.2(b)` — verified
- `SEAD 3 §F.3` — verified
- `SEAD 3 §F.3(a)–(h)` — verified
- `SEAD 3 §F.3(e)` — verified
- `SEAD 3 §G.1` — verified
- `SEAD 3 §G.1(a)` — verified
- `SEAD 3 §G.1(a)–(b)` — verified
- `SEAD 3 §G.2` — verified
- `SEAD 3 §G.2(a)` — verified
- `SEAD 3 §G.2(b)` — verified
- `SEAD 3 §G.2(c)` — verified
- `SEAD 3 §G.2(d)` — verified
- `SEAD 3 §G.2(d)–(e)` — verified
- `SEAD 3 §G.2(d)–(f)` — website cite; corrected above (§G.2 has no (f))
- `SEAD 3 §G.2(e)` — verified
- `SEAD 3 §H` — verified
- `SEAD 3 §H.1(a)–(c)` — verified
- `SEAD 3 §H.1(d)–(e)` — verified
- `SEAD 3 §H.1(f)` — verified
- `SEAD 3 §H.1(g)` — verified
- `SEAD 3 §H.2(d)` — verified
- `SEAD 3 §H.2(e)–(g)` — verified
- `SEAD 3 §H.2(h)` — verified
- `SEAD 3 App. A.1(a)` — verified
- `SEAD 3 App. A.1(g)` — verified
- `SEAD 3 App. A.2` — verified
- `SEAD 3 App. A.3` — verified
- `SEAD 3 App. A.13` — verified
- `SEAD 3 App. A.16` — verified

**DFARS 252.204-7012**

- `DFARS 252.204-7012` — verified
- `DFARS 252.204-7012(a)` — verified
- `DFARS 252.204-7012(c)` — verified
- `DFARS 252.204-7012(c)(2)` — verified
- `DFARS 252.204-7012(c)(3)` — verified
- `DFARS 252.204-7012(d)` — verified
- `DFARS 252.204-7012(e)` — verified
- `DFARS 252.204-7012(f)` — verified
- `DFARS 252.204-7012(m)` — verified

**ISL 2021-02**

- `ISL 2021-02` — from the fsotools.ai reviewed table (ISL not re-read)
- `ISL Appendix A` — from the fsotools.ai reviewed table (ISL not re-read)
- `ISL Table 1` — from the fsotools.ai reviewed table (ISL not re-read)
- `ISL Table 2` — from the fsotools.ai reviewed table (ISL not re-read)
- `ISL Table 4` — from the fsotools.ai reviewed table (ISL not re-read)
- `ISL Tables 1–3` — from the fsotools.ai reviewed table (ISL not re-read)
- `ISL Tables 2–3` — from the fsotools.ai reviewed table (ISL not re-read)
