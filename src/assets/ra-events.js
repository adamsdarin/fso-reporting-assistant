// Reporting events for the FSO Reporting Assistant: the 27 reviewed rows of
// the cleared industry reporting guide (fsotools.ai/reporting/industry/),
// the clarifying questions, and the decision rules that turn an event and
// its answers into an outcome (report? to whom? by when? what to include?).
//
// SITE_ROWS holds the website's wording verbatim (trigger, route, timing and
// authority, as of its commit 91cb8bc, 2026-10-31); test/fixtures/industry-rows.json pins it and the test compares
// it with the website checkout when one is beside this repository. Keep the
// authority strings exactly as the website has them; a verification note
// that differs goes in `verified` on the event, not in the authority.
//
// Rule text was checked against 32 CFR §117.8 on eCFR (current as of
// 2026-10-29), SEAD 3 (ODNI, effective 12 June 2017) and DFARS 252.204-7012.
// ISL 2021-02 could not be re-read in this pass: ISL wording follows the
// website's reviewed table (CITATIONS.md).
//
// decide(eventId, answers) is pure: no DOM, no storage, no network.
(function (root) {
  'use strict';

  const SITE = 'https://fsotools.ai/reporting/industry/#';
  const CFR = 'https://www.ecfr.gov/current/title-32/subtitle-A/chapter-I/subchapter-D/part-117/section-117.8#p-';
  const CFR_SECTION = 'https://www.ecfr.gov/current/title-32/subtitle-A/chapter-I/subchapter-D/part-117/section-';
  const SEAD3 = 'https://www.dni.gov/files/NCSC/documents/Regulations/SEAD-3-Reporting-U.pdf';
  const ISL = 'https://www.dcsa.mil/Portals/128/Documents/CTP/tools/ISL2021-02_SEAD-3_052024_v2.pdf';
  const DFARS = 'https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting.';
  const ITPM = 'https://fsotools.ai/itp/app/reportable';
  const OCT = 'https://fsotools.ai/guidance/october-2026/';

  const SITE_ROWS = {
    'travel': {
      layer: 'sead3',
      heading: 'SEAD 3 · Unofficial foreign travel',
      trigger: 'Give the FSO/designee the travel itinerary and required passport/trip details in advance. Report itinerary deviations and unplanned Canada/Mexico day trips within five business days after return. In an emergency, advise the FSO before departure when feasible and complete the report within five business days after return. Mixed personal travel is reportable for its unofficial portion. Also report unplanned contact with foreign governments, companies or citizens, suspicious travel anomalies, and foreign legal or customs incidents, and follow any advance-notice, briefing and post-travel steps that apply.',
      route: 'Employee → FSO/designee → required DISS Foreign Travel submission. Official travel in direct support of an established U.S. Government contract is treated under official-travel rules; check contract and SCI/SAP directions too. The DCSA bulk tool does not remove the employee’s duty to tell the FSO.',
      timing: '',
      authority: 'SEAD 3 §F.1(b), App. A.1; ISL Table 4; DCSA travel guidance',
    },
    'foreign-contacts': {
      layer: 'sead3',
      heading: 'SEAD 3 · Foreign contacts and relationships',
      trigger: 'Report contact with a known or suspected foreign intelligence entity; a continuing relationship with a known foreign national involving bonds of affection, intimate contact, personal obligation or exchange of personal information; and the specified foreign-national roommate, relationship or family events for the person’s category. Casual public interaction alone is not the test.',
      route: 'Employee → FSO/designee. Official work contact without personal bonds is generally not reportable as a relationship; report it if suspicious or a security concern. FSO may submit an incident report and notify the DCSA counterintelligence representative when required. Some relationship items apply only to TS/Q categories.',
      timing: '',
      authority: 'SEAD 3 §§D.8, F.2; ISL Tables 2–3',
    },
    'peer-concerns': {
      layer: 'sead3',
      heading: 'SEAD 3 · Report concerns about another covered person',
      trigger: 'Report known conduct indicating unwillingness to follow security rules, unexplained affluence or excessive debt, alcohol or illegal drug misuse, criminal conduct, behavior affecting safe protection of information, misuse of Government property/systems, or loss, compromise, tampering or unauthorized access.',
      route: 'Employee → FSO/designee through the company reporting process. Report factual observations; do not investigate or diagnose a coworker.',
      timing: '',
      authority: 'SEAD 3 §F.3; ISL Table 2',
    },
    'foreign-interests': {
      layer: 'sead3',
      heading: 'SEAD 3 · Foreign citizenship, affiliation and interests',
      trigger: 'As applicable to the person’s eligibility: applying for or receiving foreign citizenship/passport or identity documents; foreign business/employment/government service; foreign financial interests, accounts or property; foreign political activity or election voting; foreign financial benefits/support; and specified family or living-status changes.',
      route: 'Employee → FSO/designee. Some financial, political, marriage/cohabitation, roommate and adoption items are limited to TS/Q-level categories. Use the DCSA desktop aid and the precise category that applies.',
      timing: '',
      authority: 'SEAD 3 §§G.1, H.1, H.2(e)–(g); ISL Tables 2–3',
    },
    'targeting-criminal': {
      layer: 'sead3',
      heading: 'SEAD 3 · Targeting, media and criminal activity',
      trigger: 'Report attempted elicitation, exploitation, blackmail, coercion or enticement; suspicious contacts; media contact seeking classified or legally protected information; and reportable arrest, charge, criminal conduct, detention or law-enforcement involvement.',
      route: 'Employee promptly notifies FSO/designee; the contractor makes required DISS/CSA reports and any separate Government-site, customer or law-enforcement report.',
      timing: '',
      authority: 'SEAD 3 §§G.2(a)–(c), H.2(a)–(c), F.3(f); ISL Table 2',
    },
    'conduct-financial': {
      layer: 'sead3',
      heading: 'SEAD 3 · Drug, alcohol, health, financial and outside-activity matters',
      trigger: 'Report the drug/alcohol activity, treatment/counseling, financial concern/anomaly, defined health or behavioral event, or outside activity that meets the applicable SEAD 3 category. These are criteria-based; routine treatment alone is not universally reportable.',
      route: 'Employee → FSO/designee. The company handles sensitive details through approved channels and separately evaluates whether §117.8(c)(1) requires an adverse-information report.',
      timing: '',
      authority: 'SEAD 3 §§G.2(d)–(e), H.2(d), H.2(h); ISL Tables 1–3',
    },
    'isl-crypto-row': {
      layer: 'sead3',
      heading: 'ISL 2021-02 · Foreign cryptocurrency (defined reportable interest)',
      trigger: 'Defined criteria only: ownership of cryptocurrency backed, hosted or managed by a foreign state, or of a wallet hosted by a foreign exchange. Exceptions: the employee is unaware of the foreign nexus, or holds it through a widely diversified fund (such as an index fund) unless the instrument is entirely composed of that foreign-nexus cryptocurrency. Full criteria and report contents →',
      route: 'Employee → FSO/designee → DISS/successor incident reporting path. This is a defined criterion; ordinary crypto ownership is not automatically reportable.',
      timing: '',
      authority: 'ISL Table 1; Appendix A data elements',
    },
    'isl-mental-health-row': {
      layer: 'sead3',
      heading: 'ISL 2021-02 · Specified mental-health criteria',
      trigger: 'Only the specified events: a court or administrative finding of mental incompetence; an order to consult a mental-health professional; hospitalization for a mental condition; a qualified professional’s diagnosis of one of the listed disorders; within seven years, changing, stopping or not starting treatment for one of those diagnoses without first consulting a medical professional; current treatment details for those diagnoses; or any health condition the individual believes substantially and adversely affects judgment, reliability or trustworthiness, whether symptomatic or not. It is not a rule to report every instance of mental-health care. Full list of diagnoses →',
      route: 'Employee → FSO/designee using the approved protected process. A report is not itself an adverse adjudication or a direction to stop treatment; apply the stated limits exactly.',
      timing: '',
      authority: 'ISL Table 1',
    },
    'c-sead3-procedures': {
      layer: 'company',
      heading: 'Covered-person reports required by SEAD 3 and DCSA guidance',
      trigger: 'Covered-person reports required by SEAD 3 and DCSA guidance',
      route: 'Employee → FSO/designee; contractor → CSA through DISS or its successor/designated channel.',
      timing: 'Apply the employee’s SEAD 3 category and event-specific timing. Maintain procedures to inform covered personnel, receive and manage reports, route required submissions and handle reports about other covered people. This is the company implementation duty; it does not replace the individual’s responsibility or other §117.8 reports.',
      authority: '32 CFR §117.8(a); DCSA ISL 2021-02.',
    },
    'c-espionage': {
      layer: 'company',
      heading: 'Actual, probable or possible espionage, sabotage, terrorism or subversive activity at any company location',
      trigger: 'Actual, probable or possible espionage, sabotage, terrorism or subversive activity at any company location',
      route: 'Contractor → nearest FBI field office; promptly notify CSA and give it a copy of the written report.',
      timing: 'Submit a written report promptly. An initial phone report is allowed but must be followed by a written report regardless of FBI disposition.',
      authority: '32 CFR §117.8(b)(1)–(2).',
    },
    'c-adverse': {
      layer: 'company',
      heading: 'Adverse information concerning an employee eligible for classified access',
      trigger: 'Adverse information concerning an employee eligible for classified access',
      route: 'Contractor through FSO/responsible official → CSA-designated personnel-security channel; if assigned to a U.S. Government location, also provide the location’s security POC a copy and final disposition.',
      timing: 'Report adverse information that meets the applicable reporting standard; do not report rumor or innuendo. Employment termination does not end the duty. Provide disposition/follow-up through the required channel. If information is learned after employment ends, §117.8(c)(1)(i) still applies.',
      authority: '32 CFR §117.8(c)(1); DCSA ISL 2021-02.',
    },
    'c-suspicious': {
      layer: 'company',
      heading: 'Suspicious contacts, efforts to elicit protected information, attempted exploitation, or attempts to gain unauthorized facility/classified access',
      trigger: 'Suspicious contacts, efforts to elicit protected information, attempted exploitation, or attempts to gain unauthorized facility/classified access',
      route: 'Contractor/FSO → CSA; FBI or other authority as required by the circumstances and law.',
      timing: 'Report information about contacts with eligible employees and any person’s attempt to obtain unauthorized access, elicit information, or target an employee for foreign-intelligence exploitation. Capture who/what/when/how and follow CSA/CI instructions.',
      authority: '32 CFR §117.8(c)(2); §117.8(b) when applicable.',
    },
    'c-status': {
      layer: 'company',
      heading: 'Status change for an eligible employee: death, name change, termination of employment or change in citizenship',
      trigger: 'Status change for an eligible employee: death, name change, termination of employment or change in citizenship',
      route: 'Contractor through CSA-designated mechanism → CSA.',
      timing: 'Submit the status change; align personnel/access records and complete separation, debriefing and material recovery as applicable.',
      authority: '32 CFR §117.8(c)(3).',
    },
    'c-laa': {
      layer: 'company',
      heading: 'Naturalization of an employee previously granted an LAA',
      trigger: 'Naturalization of an employee previously granted an LAA',
      route: 'Contractor → CSA.',
      timing: 'Report city/county/state, date, court and certificate number.',
      authority: '32 CFR §117.8(c)(4).',
    },
    'c-withdraw': {
      layer: 'company',
      heading: 'Employee no longer wants an eligibility determination or no longer wants classified access/work',
      trigger: 'Employee no longer wants an eligibility determination or no longer wants classified access/work',
      route: 'Contractor → CSA.',
      timing: 'Report the request and the employee’s reason. Do not treat it as an adjudicative denial.',
      authority: '32 CFR §117.8(c)(5).',
    },
    'c-nda': {
      layer: 'company',
      heading: 'Employee refuses to sign SF 312 or another approved classified-information NDA',
      trigger: 'Employee refuses to sign SF 312 or another approved classified-information NDA',
      route: 'Contractor → CSA.',
      timing: 'Report refusal. Do not grant access without the required agreement.',
      authority: '32 CFR §117.8(c)(6).',
    },
    'company-changes': {
      layer: 'company',
      heading: 'Change that may affect entity eligibility, personnel eligibility, insider-threat risk, safeguarding or classified-information status',
      trigger: 'Change that may affect entity eligibility, personnel eligibility, insider-threat risk, safeguarding or classified-information status',
      route: 'Contractor/FSO → CSA; customer/prime also when required by contract or rule.',
      timing: 'Report as required by the specific trigger: ownership/control or stock transfer; operating name/address of entity or cleared location; KMP changes; termination/reorganization/bankruptcy; material FOCI change or negotiations that may lead to foreign ownership/control (including applicable Schedule 13D); other validity-changing events. Submit updated SF 328 for material FOCI changes under CSA instructions. Subcontractors notify their prime for reports under §117.8(c)(7)–(10).',
      authority: '32 CFR §117.8(c)(7), (c)(14); SF 328/CSA guidance.',
    },
    'c-storage': {
      layer: 'company',
      heading: 'Change in requirement or capability to store/safeguard classified material',
      trigger: 'Change in requirement or capability to store/safeguard classified material',
      route: 'Contractor → CSA.',
      timing: 'Report changes in storage requirement or safeguarding capability; update the authorized storage/site records before relying on a changed capability.',
      authority: '32 CFR §117.8(c)(8).',
    },
    'c-emergency': {
      layer: 'company',
      heading: 'Emergency makes a location unable to safeguard classified material',
      trigger: 'Emergency makes a location unable to safeguard classified material',
      route: 'Contractor → CSA.',
      timing: 'Report as soon as possible; protect/recover information under emergency procedures and follow CSA direction.',
      authority: '32 CFR §117.8(c)(9).',
    },
    'c-subcontract': {
      layer: 'company',
      heading: 'Prime/subcontractor conditions indicate classified information may not be adequately protected or entity eligibility may be affected',
      trigger: 'Prime/subcontractor conditions indicate classified information may not be adequately protected or entity eligibility may be affected',
      route: 'Prime, higher-tier subcontractor or subcontractor → its CSA; subcontractor also notifies prime when report is made under §117.8(c)(7)–(10).',
      timing: 'Report information indicating inadequate protection or another circumstance affecting the other entity’s eligibility. Coordinate contract/customer protection actions.',
      authority: '32 CFR §117.8(c)(10), (c)(14).',
    },
    'c-rediscovered': {
      layer: 'company',
      heading: 'Previously terminated classified material is found and returned to accountability',
      trigger: 'Previously terminated classified material is found and returned to accountability',
      route: 'Contractor → CSA.',
      timing: 'Report the rediscovery and disposition so the accountability record is reconciled.',
      authority: '32 CFR §117.8(c)(11).',
    },
    'c-foreign-contract': {
      layer: 'company',
      heading: 'Foreign classified contract negotiations or award not placed through a CSA/U.S. GCA that may disclose U.S. classified information or provide access to foreign classified information',
      trigger: 'Foreign classified contract negotiations or award not placed through a CSA/U.S. GCA that may disclose U.S. classified information or provide access to foreign classified information',
      route: 'Contractor → CSA.',
      timing: 'Report during pre-contract negotiation or award when the trigger applies; do not disclose or accept classified information outside approved channels.',
      authority: '32 CFR §117.8(c)(12).',
    },
    'c-foreign-material': {
      layer: 'company',
      heading: 'Classified material received from a foreign interest outside U.S. Government channels',
      trigger: 'Classified material received from a foreign interest outside U.S. Government channels',
      route: 'Contractor → CSA.',
      timing: 'Report improper receipt and follow the CSA’s handling/disposition instructions.',
      authority: '32 CFR §117.8(c)(13).',
    },
    'c-loss': {
      layer: 'company',
      heading: 'Loss, compromise or suspected compromise of U.S. or foreign classified information',
      trigger: 'Loss, compromise or suspected compromise of U.S. or foreign classified information',
      route: 'Contractor → CSA; if on a Government facility, also facility head; CSA notifies GCA under its process.',
      timing: 'Immediately start a preliminary inquiry and validate classification. If loss/compromise is confirmed, promptly send initial report unless CSA directs otherwise. After investigation, send final report with new material facts, responsible person when determined, corrective/disciplinary action and basis for conclusion. The CSA may specify timing.{{LOSS_GUIDE_LINK}}',
      authority: '32 CFR §117.8(d)(1)–(4).',
    },
    'c-culpability': {
      layer: 'company',
      heading: 'Employee culpability for security violation or negligence',
      trigger: 'Employee culpability for security violation or negligence',
      route: 'Contractor → CSA.',
      timing: 'Maintain a system to track violations/patterns and apply graduated administrative/disciplinary action. Submit final culpability report with findings and corrective/disciplinary actions when the responsible individual is determined.',
      authority: '32 CFR §117.8(e)(1)–(3).',
    },
    'c-cyber': {
      layer: 'company',
      heading: 'Cyber incident involving a classified covered information system, or other cyber event covered by contract/DFARS',
      trigger: 'Cyber incident involving a classified covered information system, or other cyber event covered by contract/DFARS',
      route: 'Covered defense contractor → designated DoD CSO for classified system event; use contract-required recipient for unclassified systems; other NISP/FBI/CSA routes may also apply.',
      timing: 'For a classified covered system, report immediately. Include incident technique/method, isolated malware sample if available, and potentially affected DoD program information. For non-Federal unclassified systems, follow contract terms. This paragraph applies to covered defense contractors and is not a universal rule for all entities.',
      authority: '32 CFR §117.8(f); applicable DFARS clause/DoD instructions.',
    },
    'c-isoo': {
      layer: 'company',
      heading: 'Duplicative CSA security review/audit or duplicate entity-eligibility processing',
      trigger: 'Duplicative CSA security review/audit or duplicate entity-eligibility processing',
      route: 'Contractor → Director, ISOO.',
      timing: 'Report the duplication for resolution and provide the records needed to identify the overlapping review/determination.',
      authority: '32 CFR §117.8(g)(1)–(2).',
    },
  };

  // ---- Step 1: who or what is this about? ----
  const BRANCHES = [
    { id: 'self', label: 'A cleared or in-process employee’s own event', help: 'Something the employee must report about themselves (SEAD 3), or a change in their status the company reports.' },
    { id: 'other', label: 'Something observed about another person', help: 'Conduct, contacts or information about an employee, a coworker or anyone else at a company location.' },
    { id: 'company', label: 'The company, facility or contract', help: 'Ownership, KMP, FOCI, storage, an emergency, a prime or subcontractor, a foreign contract, a duplicate review.' },
    { id: 'material', label: 'Classified material or a system', help: 'Loss or compromise, material found or received outside channels, a cyber incident.' },
    { id: 'visitor', label: 'A visitor or foreign contact', help: 'A contact, visit or approach by someone outside the company, foreign or not.' },
  ];

  // ---- Step 3: the clarifying questions ----
  const YNU = [
    { v: 'yes', label: 'Yes' },
    { v: 'no', label: 'No' },
    { v: 'unsure', label: 'Not sure' },
  ];
  const QUESTIONS = {
    danger: {
      q: 'Is anyone in immediate danger, or is classified material at immediate risk right now?',
      options: YNU,
      settle: 'If you cannot tell, treat it as an emergency: call 911 or your facility’s emergency number and follow your emergency procedures. Come back to this aid afterwards.',
    },
    dod: {
      q: 'Is DCSA (the Department of Defense) your cognizant security agency (CSA)?',
      help: 'ISL 2021-02 and the DISS and NISS routes are DCSA’s. Another CSA (DOE, NRC, ODNI, DHS) has its own guidance and systems.',
      options: YNU,
      settle: 'Your CSA is named on your facility clearance records and on your DD Form 254s. Confirm it with your security staff before reporting; it decides which system and guidance apply.',
    },
    covered: {
      q: 'Is the person covered: eligibility for access to classified information granted through the NISP, in process for it, or eligibility that could be reinstated?',
      help: 'ISL 2021-02 covers people granted eligibility through the NISP or in the process of a determination; DCSA’s October 2026 briefing adds reinstatable eligibility.',
      options: YNU,
      settle: 'Check the person’s record in DISS (or your CSA’s system) or ask your DCSA industrial security representative. If the status is uncertain, ask DCSA before treating the person as outside the covered population.',
      no: {
        title: 'Not under these rules, but consider…',
        text: 'SEAD 3 as implemented for industry and §117.8(c)(1) cover people with eligibility granted through the NISP, in process, or reinstatable. Someone subject to SEAD 3 only because of a sensitive Government position reports through their Government customer; an uncleared employee’s conduct goes through the company’s own channels. The ITPSO may still need the information (§117.7(d)), and another report may apply: possible espionage (§117.8(b)) and attempts to get unauthorized access (§117.8(c)(2)) do not depend on the person’s eligibility.',
        next: ['Record the decision and who made it.', 'If the person is in a sensitive Government position, tell the Government customer’s security office as the contract directs.'],
      },
    },
    level: {
      q: 'Which SEAD 3 category applies to the person?',
      help: 'The category comes from the person’s eligibility and access, not their job title.',
      options: [
        { v: 'ts', label: 'Top Secret, “Q” access, or a critical or special sensitive position' },
        { v: 's', label: 'Secret or Confidential, “L” access, or a non-critical sensitive position' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Look up the person’s eligibility and access in DISS (or your CSA’s system) before deciding: some SEAD 3 items apply only to the Top Secret / “Q” category.',
    },
    rumor: {
      q: 'Is this based on facts that came to your attention first-hand or from a credible source, rather than rumor or innuendo?',
      options: YNU,
      settle: 'Write down what you know: who observed it, what, when and where. If you cannot separate fact from rumor, give the facts you have to the ITPSO and record the decision; §117.8(c)(1) forbids reports based on rumor or innuendo.',
      no: {
        title: 'Not under these rules, but consider…',
        text: 'Contractors will not make reports based on rumor or innuendo (§117.8(c)(1)). Give what you have to the ITPSO to consider with other information (§117.7(d)), record the decision, and report if facts later support it.',
        next: ['Do not investigate the person yourself.', 'Note what would turn this into a reportable fact and who would know.'],
      },
    },
    govsite: {
      q: 'Did it happen at a U.S. Government facility, or is the employee assigned to a U.S. Government location?',
      options: YNU,
      settle: 'Check the employee’s work location and the contract’s place of performance before reporting: it changes who must get a copy.',
    },
    sub: {
      q: 'Is your company a subcontractor on the affected contract?',
      options: YNU,
      settle: 'Check the DD Form 254 and the contract: a subcontractor also notifies its prime when it reports under §117.8(c)(7)–(10).',
    },
    cdc: {
      q: 'Is your company a cleared defense contractor (CDC): a cleared contractor with a DoD contract?',
      options: YNU,
      settle: '§117.8(f) applies only to CDCs. Confirm with your contracts office which DoD contracts you hold before reporting.',
    },
    classifiedSystem: {
      q: 'Did the incident involve a classified covered information system that the DoD cognizant security office (CSO) approved to process classified information?',
      options: YNU,
      settle: 'Ask your ISSM which system was involved and whether it holds a DoD authorization before reporting; it decides the recipient and the clock.',
    },
    dfars: {
      q: 'Does the contract include DFARS 252.204-7012 (safeguarding covered defense information and cyber incident reporting)?',
      options: YNU,
      settle: 'Check the contract’s clauses with your contracts office. The 72-hour clock applies only where the clause does; other contracts may set their own terms.',
    },
    fgi: {
      q: 'Does it involve classified foreign government information (including NATO information)?',
      options: YNU,
      settle: 'Check the markings and the contract’s security classification guide before reporting: foreign government information adds a recipient.',
    },
    confirmed: {
      q: 'Has the preliminary inquiry confirmed a loss, compromise or suspected compromise?',
      options: [
        { v: 'yes', label: 'Yes' },
        { v: 'no', label: 'No, or the inquiry has not started' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Finish the preliminary inquiry: establish the circumstances and validate the classification of the information (§117.8(d)(1)). Do not wait for a full investigation, and do not guess: the initial report follows the inquiry’s finding.',
    },
    determined: {
      q: 'Has the individual responsible for the violation been determined?',
      options: YNU,
      settle: 'Complete the inquiry into the violation first; the final culpability report is due when the responsible individual is determined (§117.8(e)(2)–(3)).',
    },
    role: {
      q: 'Which is your company on this contract?',
      options: [
        { v: 'prime', label: 'Prime contractor or a higher-tier subcontractor' },
        { v: 'sub', label: 'Subcontractor' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Check the DD Form 254: it names the prime and the subcontract chain.',
    },
    laa: {
      q: 'Does the employee hold a Limited Access Authorization (LAA)?',
      options: YNU,
      settle: 'Check the employee’s record in DISS (or your CSA’s system): §117.8(c)(4) covers only an employee granted an LAA.',
    },
    placed: {
      q: 'Is the contract placed through a CSA or a U.S. Government contracting activity (GCA)?',
      options: YNU,
      settle: 'Ask your contracts office who placed or will place the contract before deciding: §117.8(c)(12) covers only contracts not placed through a CSA or U.S. GCA.',
    },
    usgChannels: {
      q: 'Was the material received through U.S. Government channels?',
      options: YNU,
      settle: 'Check the transmittal and receipt records before deciding; §117.8(c)(13) covers only material received outside USG channels.',
    },
    espionage: {
      q: 'Could it be actual, probable or possible espionage, sabotage, terrorism or subversive activity?',
      options: YNU,
      settle: 'Report to DCSA under §117.8(c)(2) now and ask DCSA’s counterintelligence representative whether the FBI route applies; §117.8(b) covers possible espionage, so do not wait for certainty.',
    },
    travelPhase: {
      q: 'Which is it?',
      options: [
        { v: 'before', label: 'Travel being planned (before departure)' },
        { v: 'after', label: 'After return: an itinerary deviation, an unplanned Canada or Mexico day trip, or emergency travel' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Ask the employee for the dates: travel not yet taken is reported in advance; a deviation or an unplanned day trip is reported within five business days after return.',
    },
    contactType: {
      q: 'What kind of contact is it?',
      options: [
        { v: 'fie', label: 'Contact with a known or suspected foreign intelligence entity' },
        { v: 'relationship', label: 'A continuing relationship with a foreign national involving bonds of affection, personal obligation, intimate contact, or the exchange of personal information' },
        { v: 'official', label: 'Official work contact without personal bonds' },
        { v: 'casual', label: 'Limited or casual public contact only' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Ask the employee about the nature of the relationship, not where it was made: SEAD 3 §F.2(b) turns on bonds of affection, obligation, intimate contact or the exchange of personal information, and on whether the contact is a known or suspected foreign intelligence entity.',
    },
    interestType: {
      q: 'Which foreign interest?',
      options: [
        { v: 'citizenship', label: 'Applying for or receiving foreign citizenship, or applying for, possessing or using a foreign passport or identity card' },
        { v: 'business', label: 'Direct involvement in a foreign business, a foreign bank account, or ownership of foreign property' },
        { v: 'voting', label: 'Voting in a foreign election' },
        { v: 'adoption', label: 'Adoption of a non-U.S. citizen child' },
        { v: 'living', label: 'A foreign national roommate for more than 30 days, a cohabitant, or a marriage' },
        { v: 'other', label: 'Something else in this row (foreign employment or government service, political activity, financial benefits or support)' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Identify the item first: SEAD 3 §G.1 and §H.1 list the foreign activities by category; ISL 2021-02 Tables 2–3 add the DCSA clarifications.',
    },
    targetType: {
      q: 'Which is it?',
      options: [
        { v: 'elicitation', label: 'Attempted elicitation, exploitation, blackmail, coercion or enticement to obtain classified or protected information' },
        { v: 'media', label: 'Media contact seeking classified or legally protected information (not official duties)' },
        { v: 'arrest', label: 'An arrest' },
        { v: 'other', label: 'Other criminal conduct, a charge, detention or law-enforcement involvement without an arrest' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Establish what happened first. SEAD 3 §G.2 and §H.2 list elicitation, media contacts and arrests; ISL 2021-02 Table 2 clarifies arrests and criminal conduct.',
    },
    conductType: {
      q: 'Which is it?',
      options: [
        { v: 'debt', label: 'Bankruptcy, or over 120 days delinquent on any debt' },
        { v: 'anomaly', label: 'Garnishment, or an unusual infusion of assets of $10,000 or more (inheritance, winnings or similar)' },
        { v: 'treatment', label: 'Alcohol- or drug-related treatment' },
        { v: 'other', label: 'Another health, financial or outside-activity matter' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Identify the item first: SEAD 3 §G.2(d)–(e) and §H.2(d), (h) list the financial and treatment items; ISL 2021-02 Tables 1–3 add the DCSA clarifications. Routine treatment alone is not universally reportable.',
    },
    cryptoType: {
      q: 'Which describes the holding?',
      options: [
        { v: 'state', label: 'Cryptocurrency backed, hosted or managed by a foreign state' },
        { v: 'wallet', label: 'A wallet hosted by a foreign exchange' },
        { v: 'fund', label: 'Held only through a widely diversified fund (such as an index fund) that is not entirely composed of such cryptocurrency' },
        { v: 'unaware', label: 'The employee was unaware of the foreign nexus' },
        { v: 'none', label: 'Ordinary cryptocurrency with no foreign-state backing, hosting or management' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Ask the employee for the cryptocurrency’s name, who hosts or backs it, and the exchange’s host country. ISL 2021-02 Table 1 turns on a foreign-state nexus or a foreign exchange, with stated exceptions.',
    },
    mhType: {
      q: 'Which specified event is it?',
      options: [
        { v: 'listed', label: 'One of the listed events: a court or administrative finding of mental incompetence; an order to consult a mental-health professional; hospitalization for a mental condition; a qualified professional’s diagnosis of one of the listed disorders; within seven years, changing, stopping or not starting treatment for one of those diagnoses without first consulting a medical professional; current treatment details for those diagnoses' },
        { v: 'self', label: 'A health condition the individual believes substantially and adversely affects judgment, reliability or trustworthiness' },
        { v: 'routine', label: 'Routine mental-health care not on that list' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Apply the stated criteria exactly. The list is at https://fsotools.ai/reporting/industry/#isl-mental-health; it is not a rule to report every instance of mental-health care, and a report is not a direction to stop treatment.',
    },
    changeType: {
      q: 'Which change?',
      options: [
        { v: 'ownership', label: 'Ownership or control, including a stock transfer that affects control' },
        { v: 'name', label: 'Operating name or address of the entity or a cleared location' },
        { v: 'kmp', label: 'Key management personnel (including the FSO or ITPSO)' },
        { v: 'termination', label: 'Terminating business or operations, reorganization or bankruptcy, or another change that might affect the validity of the FCL' },
        { v: 'foci', label: 'A material change in foreign ownership, control or influence, or discussions that may reasonably lead to foreign ownership or control' },
        { v: 'unsure', label: 'Not sure' },
      ],
      settle: 'Identify the change with management and your contracts office; §117.8(c)(7)(i)–(v) lists them and each has its own contents.',
    },
  };

  // ---- clocks: the rule's own words, with a number only where the rule has one ----
  const WHEN = {
    none: { text: 'The rule sets no clock.', from: 'learned' },
    promptly: { text: 'Promptly.', from: 'learned' },
    immediately: { text: 'Immediately.', from: 'learned' },
    asap: { text: 'As soon as possible.', from: 'learned' },
    advance: { text: 'In advance: before departure.', from: 'departure' },
    fiveBusiness: { text: 'Within five business days after return.', days: 5, business: true, from: 'return' },
    seventyTwo: { text: 'Within 72 hours of discovery.', days: 3, from: 'discovery', note: 'The date shown is discovery plus three days; the hour of discovery matters.' },
    writing: { text: 'In writing, when discussions begin that may reasonably lead to foreign ownership or control.', from: 'learned' },
    withChange: { text: 'When the change happens.', from: 'learned' },
  };
  const ANCHOR_LABEL = { learned: 'Date learned', return: 'Date of return', discovery: 'Date of discovery', departure: 'Date of departure' };

  // ---- recipients ----
  const K = { required: 'required', conditional: 'conditional', practice: 'practice' };
  const R = {
    fso: () => ({ who: 'FSO or designee', via: 'The company’s approved reporting channel', basis: 'SEAD 3; §117.8(a)(2)', kind: K.required }),
    dcsa: (a, via, basis) => ({ who: a.dod === 'no' ? 'Your CSA' : 'DCSA (your CSA)', via: a.dod === 'no' ? 'The CSA’s designated channel' : via, basis, kind: K.required }),
    fbi: (basis) => ({ who: 'FBI, nearest field office', via: 'Written report; a phone call first if urgent, followed in writing', basis: basis || '§117.8(b)', kind: K.required }),
    prime: () => ({ who: 'Prime contractor', via: 'Notify the prime when you report to your CSA', basis: '§117.8(c)(14)', kind: K.required }),
    gca: () => ({ who: 'GCA / customer', via: 'When the contract, DD Form 254 or customer instructions require a report', basis: 'Contract terms; good practice to check', kind: K.conditional }),
    facilityHead: () => ({ who: 'Head of the U.S. Government facility', via: 'As the facility directs', basis: '§117.8(d)', kind: K.required }),
    usgPoc: () => ({ who: 'USG security point of contact for the location', via: 'A copy of the report and its final disposition', basis: '§117.8(c)(1)(i)', kind: K.required }),
    cso: () => ({ who: 'DoD cognizant security office (CSO) that approved the system', via: 'As the CSO and DCSA direct', basis: '§117.8(f)(1)', kind: K.required }),
    dibnet: () => ({ who: 'DoD at dibnet.dod.mil', via: 'The DIBNet cyber incident report (medium assurance certificate required)', basis: 'DFARS 252.204-7012(c)', kind: K.required }),
    dtsa: () => ({ who: 'Director, Defense Technology Security Administration (DTSA)', via: 'For the classified foreign government information involved', basis: '§117.8(f)(1)(iii)', kind: K.required }),
    isoo: () => ({ who: 'Director, Information Security Oversight Office (ISOO)', via: 'Written report with the records that identify the overlap', basis: '§117.8(g)', kind: K.required }),
    itpso: () => ({ who: 'ITPSO (internal)', via: 'So the insider threat program can consider the facts with other information', basis: '§117.7(d); good practice', kind: K.practice }),
    ci: () => ({ who: 'DCSA counterintelligence representative', via: 'For advice and any counterintelligence follow-up', basis: 'Good practice; §117.8(c)(2)', kind: K.practice }),
  };
  const diss = (a, what) => (a.dod === 'no' ? 'The CSA’s designated channel' : `DISS (or its successor): ${what}`);

  // ---- the events ----
  // Each event: id (= website row id), layer, branches, group, label, summary,
  // ask(answers) → ordered question ids that apply, rules(answers) → outcome
  // fields, and cfr (the eCFR paragraph anchor) or sead3/isl flags for links.
  const PREP = 'A preparation aid, not a determination: the rule, your CSA’s instructions, your contract and your DD Form 254 govern.';
  const RECORDS = 'Preserve the records: what you learned, from whom (by role), when, and what you did. Keep them with the security program’s records, access-restricted.';
  const SEAD3_SEP = 'The employee’s SEAD 3 self-report does not replace a company report: decide separately whether the facts also need an adverse-information report under §117.8(c)(1) or a suspicious-contact report under §117.8(c)(2).';
  const NO_INVESTIGATE = 'Do not investigate the person yourself and do not question them about it; record facts, not opinions.';

  const EVENTS = [
    // ======== SEAD 3 / ISL: the individual's reports to the FSO ========
    {
      id: 'travel', layer: 'sead3', branches: ['self'], group: 'SEAD 3 self-reports the employee makes to the FSO',
      label: 'Unofficial foreign travel: planned, or a deviation or unplanned day trip after return',
      summary: 'Itinerary and passport details before the trip; deviations and unplanned Canada or Mexico day trips within five business days after return.',
      cfr: '117.8(a)', sead3: true, isl: true,
      ask: () => ['covered', 'dod', 'travelPhase'],
      rules: (a) => {
        const after = a.travelPhase === 'after';
        return {
          kind: 'yes',
          title: after ? 'Report the deviation or day trip within five business days after return' : 'Report the travel before departure',
          recipients: [R.fso(), R.dcsa(a, 'DISS Foreign Travel submission by the FSO', 'SEAD 3 §F.1(b); ISL Table 4')],
          when: after ? WHEN.fiveBusiness : WHEN.advance,
          include: after
            ? ['The deviation from the approved itinerary, or the unplanned Canada or Mexico day trip, with dates.', 'Unplanned contacts with foreign governments, companies or citizens and the reason for each (SEAD 3 App. A.1(g)).', 'Unusual or suspicious occurrences, and any foreign legal or customs incident (App. A.1(i)–(j)).', 'For emergency travel: who was told before departure and when.']
            : ['Complete itinerary, dates of travel, mode of transportation and carriers, passport data (SEAD 3 App. A.1(a)–(d)).', 'Names and association of foreign national travelling companions (App. A.1(e)).', 'Planned contacts with foreign governments, companies or citizens and the reason (App. A.1(f)).', 'Emergency point of contact (App. A.1(h)).'],
          next: [after ? 'Record the post-travel report in DISS and close the travel record.' : 'Give the defensive security and counterintelligence briefing when required (SEAD 3 §F.1(b)(1)(c)); tell the employee that deviations are due within five business days of return.', 'Official travel in direct support of an established U.S. Government contract follows official-travel rules; check the contract and any SCI or SAP directions.', SEAD3_SEP, RECORDS],
          verified: 'Checked against SEAD 3 §F.1(b)(1): itinerary and approval prior to travel; deviations within five business days of return; unplanned Canada or Mexico day trips within five business days; emergency travel reported verbally before departure and in full within five business days of return.',
        };
      },
    },
    {
      id: 'foreign-contacts', layer: 'sead3', branches: ['self', 'visitor'], group: 'SEAD 3 self-reports the employee makes to the FSO',
      label: 'Foreign contact or relationship (foreign intelligence entity, or a continuing relationship with a foreign national)',
      summary: 'Contact with a known or suspected foreign intelligence entity, or a continuing relationship involving bonds of affection, obligation, intimate contact or exchange of personal information.',
      cfr: '117.8(c)(2)', sead3: true, isl: true,
      ask: () => ['covered', 'dod', 'contactType'],
      rules: (a) => {
        if (a.contactType === 'official') return consider('Not reportable as a relationship under SEAD 3 §F.2, but consider…', 'Official work contact without personal bonds is reported as the agency directs for official duties (SEAD 3 §F.2(a)). Report it if it is suspicious or raises a security concern: that is a suspicious-contact report under §117.8(c)(2), and SEAD 3 §G.2(a) / §H.2(a) if elicitation was attempted.', ['Write down who, what, when and how while it is fresh.', 'If anything about the contact was unusual, pick “Suspicious contact or attempted elicitation” instead.']);
        if (a.contactType === 'casual') return consider('Not reportable under SEAD 3 §F.2(b), but consider…', 'Limited or casual public contact with foreign nationals is not reportable absent another reporting requirement (SEAD 3 §F.2(b)(2)). It becomes reportable when the relationship continues with bonds of affection, personal obligation, intimate contact, or an exchange of personal information.', ['Tell the employee what would make it reportable later.', 'If the contact sought information or seemed targeted, pick “Suspicious contact or attempted elicitation”.']);
        const fie = a.contactType === 'fie';
        return {
          kind: 'yes',
          title: fie ? 'Report the foreign intelligence entity contact' : 'Report the continuing relationship',
          recipients: [R.fso(), R.dcsa(a, diss(a, 'incident report by the FSO when required'), fie ? 'SEAD 3 §F.2(b)(1); §117.8(c)(2)' : 'SEAD 3 §F.2(b)(2); ISL Tables 2–3'), ...(fie ? [R.ci()] : []), R.itpso()],
          when: { ...WHEN.none, text: 'Prior to participation or otherwise as soon as possible following the start of the involvement (SEAD 3 §E.2); no number of days.' },
          include: fie
            ? ['Service(s) involved, name of the individual(s) contacted, date(s), nature of the contact including anything unusual or suspicious, likelihood of future contact (SEAD 3 App. A.2).']
            : ['Name of the foreign national(s), citizenship, occupation, nature of the relationship (business or personal), duration and frequency of contact, current status (SEAD 3 App. A.3).'],
          next: [fie ? 'A foreign intelligence entity contact with eligible employees is also the company’s suspicious-contact report under §117.8(c)(2); if it may be espionage, §117.8(b) applies: pick that event too.' : 'Updates are due only on a significant change in the nature of the contact (SEAD 3 §F.2(b)(2)).', 'Some relationship items (foreign national roommate, cohabitant, marriage) apply only to the Top Secret / “Q” category: see “Foreign citizenship, affiliation and interests”.', SEAD3_SEP, RECORDS],
          verified: 'Checked against SEAD 3 §F.2(b)(1)–(2) and §D.8 (foreign national: any person who is not a U.S. citizen or U.S. national).',
        };
      },
    },
    {
      id: 'peer-concerns', layer: 'sead3', branches: ['other'], group: 'Concerns an employee raises about another covered person',
      label: 'A cleared employee reports a concern about another covered person’s conduct',
      summary: 'Unwillingness to follow security rules, unexplained affluence or excessive debt, alcohol or drug misuse, criminal conduct, misuse of Government systems, and similar conduct of another covered individual.',
      cfr: '117.8(c)(1)', sead3: true, isl: true,
      ask: () => ['danger', 'rumor', 'covered'],
      rules: (a) => ({
        kind: 'yes',
        title: 'The employee reports it to the FSO; the FSO then decides the company report',
        recipients: [R.fso(), R.itpso(), { who: a.dod === 'no' ? 'Your CSA' : 'DCSA (your CSA)', via: diss(a, 'incident report, if the facts meet the adverse-information standard'), basis: '§117.8(c)(1), decided separately by the FSO', kind: K.conditional }],
        when: { ...WHEN.none, text: 'SEAD 3 §F.3 sets no clock for the employee’s report; a company report that follows is a separate decision.' },
        include: ['The conduct observed, by whom (role), when and where; the SEAD 3 §F.3 item it falls under.', 'Facts only: no diagnosis, no rumor or innuendo (§117.8(c)(1)).'],
        next: ['Decide, separately, whether the facts require an adverse-information report under §117.8(c)(1) (pick “Adverse information about a cleared employee”), a suspicious-contact report under §117.8(c)(2), or an FBI report under §117.8(b).', NO_INVESTIGATE, 'Give the facts to the ITPSO to consider with other information (§117.7(d)).', RECORDS],
        verified: 'Checked against SEAD 3 §F.3(a)–(h).',
      }),
    },
    {
      id: 'foreign-interests', layer: 'sead3', branches: ['self'], group: 'SEAD 3 self-reports the employee makes to the FSO',
      label: 'Foreign citizenship, passport, business, bank account, property, voting, adoption, or a foreign national roommate, cohabitant or marriage',
      summary: 'Foreign activities and living-status changes, by the person’s eligibility category.',
      cfr: '117.8(a)', sead3: true, isl: true,
      ask: () => ['covered', 'dod', 'level', 'interestType'],
      rules: (a) => {
        const tsOnly = ['business', 'voting', 'adoption', 'living'].includes(a.interestType);
        if (a.interestType === 'other') return settle('Settle which item applies before deciding', 'Foreign employment or government service, political activity, and financial benefits or support are not listed in SEAD 3 §G.1 or §H.1 by those words; the website’s row draws them from ISL 2021-02 Tables 2–3, which this aid could not re-check. Confirm the exact ISL table item for the person’s category before reporting.');
        if (tsOnly && a.level === 's') return consider('Not required for this category under SEAD 3, but consider…', 'Foreign business, bank accounts, property, voting in a foreign election, adoption and the roommate, cohabitant and marriage items are in SEAD 3 §H (Top Secret, “Q”, critical or special sensitive), not §G. Your CSA or the employee’s agency may require more (SEAD 3 §E.7), and the company still evaluates whether the facts are adverse information under §117.8(c)(1).', ['Check ISL 2021-02 Tables 2–3 for DCSA’s clarifications for the person’s category.', 'Record the decision.']);
        const cite = { citizenship: a.level === 'ts' ? 'SEAD 3 §H.1(d)–(e); App. A.7–A.10' : 'SEAD 3 §G.1(a)–(b); App. A.7–A.10', business: 'SEAD 3 §H.1(a)–(c); App. A.4–A.6', voting: 'SEAD 3 §H.1(f); App. A.11', adoption: 'SEAD 3 §H.1(g); App. A.12', living: 'SEAD 3 §H.2(e)–(g); App. A.3, A.17' }[a.interestType];
        const include = {
          citizenship: ['Citizenship: country, basis, date of application or receipt (App. A.7).', 'Passport or identity card: issuing country, number, dates of issue and expiry, reason for application, possession or use, and dates and countries of use (App. A.8–A.10).'],
          business: ['Foreign business: nature of involvement, countries, name of business (App. A.4). Bank account: institution and country (App. A.5). Property: location, estimated value, balance due, purpose and use, how acquired (App. A.6).'],
          voting: ['Date, country and election (App. A.11).'],
          adoption: ['Country, foreign government organization involved, foreign travel required, agency or intermediary, the adoptive parents’ current linkage to the foreign country (App. A.12).'],
          living: ['Roommate or cohabitant: name, citizenship, occupation, nature and duration of the relationship (App. A.3, A.17). Marriage: as your CSA’s data elements direct.'],
        }[a.interestType];
        return {
          kind: 'yes',
          title: 'Report it',
          recipients: [R.fso(), R.dcsa(a, diss(a, 'the submission DCSA’s desktop aid names for the category'), cite)],
          when: { ...WHEN.none, text: 'Prior to participation or otherwise as soon as possible following the start of the involvement (SEAD 3 §E.2); no number of days.' },
          include,
          next: ['Use the DCSA SEAD 3 desktop aid and the precise category that applies.', SEAD3_SEP, RECORDS],
          verified: `Checked against SEAD 3: ${cite}.`,
        };
      },
    },
    {
      id: 'targeting-criminal', layer: 'sead3', branches: ['self', 'visitor'], group: 'SEAD 3 self-reports the employee makes to the FSO',
      label: 'Targeting, media contact, or an arrest: elicitation, exploitation, blackmail, coercion, enticement; media seeking protected information; arrest',
      summary: 'Attempts to get classified or protected information from the employee, media contacts seeking it, and arrests.',
      cfr: '117.8(c)(2)', sead3: true, isl: true,
      ask: () => ['covered', 'dod', 'targetType'],
      rules: (a) => {
        if (a.targetType === 'other') return settle('Settle which item applies before deciding', 'SEAD 3 lists arrests (§G.2(c), §H.2(c)) for the person’s own report; other criminal conduct, charges, detention and law-enforcement involvement come from ISL 2021-02 Table 2, which this aid could not re-check. Confirm the ISL item, then decide; and evaluate the facts as possible adverse information under §117.8(c)(1) in any case.');
        const t = a.targetType;
        const cite = { elicitation: 'SEAD 3 §G.2(a) / §H.2(a); §117.8(c)(2)', media: 'SEAD 3 §G.2(b) / §H.2(b)', arrest: 'SEAD 3 §G.2(c) / §H.2(c)' }[t];
        const recipients = [R.fso(), R.dcsa(a, diss(a, t === 'elicitation' ? 'suspicious-contact report by the FSO' : 'incident report by the FSO'), cite)];
        if (t === 'elicitation') recipients.push({ ...R.fbi('§117.8(b), if it may be espionage'), kind: K.conditional }, R.ci());
        if (t === 'arrest') recipients.push(R.gca());
        recipients.push(R.itpso());
        return {
          kind: 'yes',
          title: 'Report it',
          recipients,
          when: { ...WHEN.none, text: 'The employee notifies the FSO promptly (SEAD 3 §E.2: prior to participation or as soon as possible); the company’s §117.8 report has no number of days.' },
          include: {
            elicitation: ['Date(s), name of the individual(s) involved, nature of the incident, method of contact, electronic address, type of information sought, background and current state (SEAD 3 App. A.13).'],
            media: ['Date(s), media outlet, representative, nature and purpose, whether classified or protected information was involved, current status (App. A.14).'],
            arrest: ['Date(s), location(s), charges or circumstances, disposition (App. A.15).'],
          }[t],
          next: [t === 'elicitation' ? 'An attempt to get classified information from an eligible employee is also the company’s suspicious-contact report under §117.8(c)(2); if it may be espionage, report to the FBI under §117.8(b): pick that event too.' : t === 'arrest' ? 'Evaluate the facts as possible adverse information under §117.8(c)(1); a Government-site, customer or law-enforcement report may also be required.' : 'Report the contact whether or not it resulted in a disclosure; media contact in the course of official duties need not be reported (SEAD 3 §G.2(b)).', SEAD3_SEP, RECORDS],
          verified: `Checked against SEAD 3: ${cite}.`,
        };
      },
    },
    {
      id: 'conduct-financial', layer: 'sead3', branches: ['self'], group: 'SEAD 3 self-reports the employee makes to the FSO',
      label: 'Financial trouble, alcohol- or drug-related treatment, or another health or outside-activity matter',
      summary: 'Bankruptcy, debt over 120 days delinquent, garnishment, an unusual infusion of assets, treatment, and criteria-based health or outside-activity events.',
      cfr: '117.8(c)(1)', sead3: true, isl: true,
      ask: () => ['covered', 'dod', 'level', 'conductType'],
      rules: (a) => {
        if (a.conductType === 'other') return settle('Settle which item applies before deciding', 'Health, behavioral and outside-activity events are criteria-based: SEAD 3 §G.2(d)–(e) and §H.2(d), (h) list the financial and treatment items; the specified mental-health events are in ISL 2021-02 Table 1 (pick that event); other items come from ISL Tables 1–3, which this aid could not re-check. Routine treatment alone is not universally reportable. Confirm the item, then decide.');
        if (a.conductType === 'anomaly' && a.level === 's') return consider('Not required for this category under SEAD 3, but consider…', 'Garnishment and an unusual infusion of assets of $10,000 or more are SEAD 3 §H.2(d) items (Top Secret, “Q”, critical or special sensitive). For Secret, Confidential and “L”, §G.2(d) covers bankruptcy and debt over 120 days delinquent. The company still evaluates whether the facts are adverse information under §117.8(c)(1).', ['Check ISL 2021-02 Table 3 for DCSA’s Top Secret clarifications.', 'Record the decision.']);
        const cite = { debt: a.level === 'ts' ? 'SEAD 3 §H.2(d)' : 'SEAD 3 §G.2(d)', anomaly: 'SEAD 3 §H.2(d)', treatment: a.level === 'ts' ? 'SEAD 3 §H.2(h)' : 'SEAD 3 §G.2(e)' }[a.conductType];
        return {
          kind: 'yes',
          title: 'Report it',
          recipients: [R.fso(), R.dcsa(a, diss(a, 'incident report by the FSO'), cite)],
          when: { ...WHEN.none, text: 'Prior to participation or otherwise as soon as possible following the start of the involvement (SEAD 3 §E.2); no number of days.' },
          include: a.conductType === 'treatment' ? ['What the employee chooses to report through the approved protected channel; handle details only there.'] : ['Type of issue or anomaly, dollar value, reason (SEAD 3 App. A.16).'],
          next: ['Handle sensitive details only through the approved, privacy-protective channel.', 'Evaluate separately whether the facts require an adverse-information report under §117.8(c)(1).', RECORDS],
          verified: `Checked against SEAD 3: ${cite}.`,
        };
      },
    },
    {
      id: 'isl-crypto-row', layer: 'sead3', branches: ['self'], group: 'SEAD 3 self-reports the employee makes to the FSO',
      label: 'Foreign cryptocurrency: backed, hosted or managed by a foreign state, or a wallet hosted by a foreign exchange',
      summary: 'A defined ISL 2021-02 criterion; ordinary cryptocurrency ownership is not automatically reportable.',
      cfr: '117.8(c)(1)', isl: true,
      ask: () => ['covered', 'dod', 'cryptoType'],
      rules: (a) => {
        if (a.dod === 'no') return consider('Not under ISL 2021-02, but consider…', 'The foreign cryptocurrency criterion is DCSA’s (ISL 2021-02 Table 1) and applies under DoD cognizance. Ask your own CSA whether it has an equivalent reporting item; the company still evaluates the facts under §117.8(c)(1).', ['Record the decision.']);
        if (a.cryptoType === 'fund') return consider('Not reportable under the ISL exception, but consider…', 'A holding through a widely diversified fund, such as an index fund, is excepted unless the instrument is entirely composed of foreign-state-backed, hosted or managed cryptocurrency (ISL 2021-02 Table 1, as reviewed on fsotools.ai).', ['Keep a note of the fund and why the exception applies.']);
        if (a.cryptoType === 'unaware') return consider('Not reportable under the ISL exception, but consider…', 'The employee need not report when unaware that the cryptocurrency is foreign-state-backed, hosted or managed, or that the hosting exchange is foreign (ISL 2021-02 Table 1, as reviewed on fsotools.ai). Once aware, the criterion applies.', ['Tell the employee what to report if they learn of a foreign nexus.']);
        if (a.cryptoType === 'none') return consider('Not reportable as cryptocurrency, but consider…', 'Ordinary cryptocurrency ownership with no foreign-state backing, hosting or management and no foreign-exchange wallet is not an ISL 2021-02 criterion. Unusual financial gains may still be reportable: SEAD 3 §H.2(d) (Top Secret category) covers an unusual infusion of assets of $10,000 or greater.', ['Record the decision.']);
        return {
          kind: 'yes',
          title: 'Report the foreign cryptocurrency interest',
          recipients: [R.fso(), R.dcsa(a, 'DISS (or its successor) incident reporting path, by the FSO', 'ISL Table 1')],
          when: { ...WHEN.none, text: 'ISL 2021-02 sets no number of days (wording from the fsotools.ai reviewed table).' },
          include: ['The cryptocurrency name, the exchange’s host country and the dollar value (ISL Appendix A data elements, as reviewed on fsotools.ai).'],
          next: ['Apply the exceptions exactly: unawareness of the foreign nexus, and widely diversified funds.', RECORDS],
          verified: 'ISL 2021-02 could not be re-read in this pass; wording follows the fsotools.ai reviewed table (checked there against the May 2024 revision).',
        };
      },
    },
    {
      id: 'isl-mental-health-row', layer: 'sead3', branches: ['self'], group: 'SEAD 3 self-reports the employee makes to the FSO',
      label: 'One of the specified mental-health events in ISL 2021-02 (not routine care)',
      summary: 'A court or administrative finding, an order to consult, hospitalization, a listed diagnosis, treatment changes for a listed diagnosis, or a self-identified condition affecting judgment.',
      cfr: '117.8(c)(1)', isl: true,
      ask: () => ['covered', 'dod', 'mhType'],
      rules: (a) => {
        if (a.dod === 'no') return consider('Not under ISL 2021-02, but consider…', 'The specified mental-health criteria are DCSA’s (ISL 2021-02 Table 1) and apply under DoD cognizance. Ask your own CSA what it requires; SEAD 3 §F.3(e) covers apparent mental-health issues observed in another covered individual where there is reason to believe they may impact the ability to protect classified information.', ['Record the decision.']);
        if (a.mhType === 'routine') return consider('Not reportable under ISL 2021-02 Table 1, but consider…', 'Routine mental-health care is not one of the specified events; the ISL is not a rule to report every instance of mental-health care (fsotools.ai reviewed table). Only the listed events, and a condition the individual believes substantially and adversely affects judgment, reliability or trustworthiness, are reportable.', ['Do not record clinical detail in the file note.', 'If the employee later meets a listed criterion, report then.']);
        return {
          kind: 'yes',
          title: 'Report the specified event through the approved protected process',
          recipients: [R.fso(), R.dcsa(a, 'DISS (or its successor) incident report by the FSO, through the approved protected process', 'ISL Table 1')],
          when: { ...WHEN.none, text: 'ISL 2021-02 sets no number of days (wording from the fsotools.ai reviewed table).' },
          include: ['Which specified criterion is met, and the facts that meet it, as the employee reports them through the protected channel.', 'In the company’s file note record only the criterion met, never a diagnosis or clinical detail.'],
          next: ['A report is not itself an adverse adjudication or a direction to stop treatment; apply the stated limits exactly.', 'Handle details only through authorized, privacy-protective channels.', RECORDS],
          verified: 'ISL 2021-02 could not be re-read in this pass; the list of events follows the fsotools.ai reviewed table (checked there against the May 2024 revision).',
        };
      },
    },

    // ======== 32 CFR §117.8: the company's reports ========
    {
      id: 'c-sead3-procedures', layer: 'company', branches: ['company'], group: 'Standing duties',
      label: 'Setting up or checking the company’s procedures for employees’ SEAD 3 reports (SPP)',
      summary: 'The contractor’s implementation duty: inform covered personnel, receive and manage their reports, route the submissions.',
      cfr: '117.8(a)', isl: true,
      ask: () => ['dod'],
      rules: (a) => ({
        kind: 'duty',
        title: 'No report to file now: a standing procedure duty',
        recipients: [{ who: 'Internal: the FSO keeps written procedures available for CSA review', via: a.dod === 'no' ? 'As your CSA directs' : 'Written plan or SPP, available for DCSA review', basis: '§117.8(a)(2); §117.7(e); ISL 2021-02', kind: K.required }],
        when: { ...WHEN.none, text: 'A continuing duty, not a dated report. ISL 2021-02 required the written procedures from 24 August 2021 for DCSA-cognizant contractors (fsotools.ai key dates).' },
        include: ['How covered personnel learn their SEAD 3 and adverse-information duties.', 'How the company receives, processes and manages reports, and routes the required DISS (or successor) submissions.', 'How personnel report concerns about other covered people (SEAD 3 §F.3).'],
        next: ['The procedures do not replace the individual’s responsibility or any other §117.8 report.', 'Review them against current DCSA guidance each year (good practice).'],
        verified: '§117.8(a)(2) and §117.7(e) verified on eCFR; the ISL requirement follows the fsotools.ai reviewed table and the ITPM Assistant’s check of the owner’s ISL copy.',
      }),
    },
    {
      id: 'c-espionage', layer: 'company', branches: ['other', 'visitor', 'company', 'material'], group: 'Threats and people',
      label: 'Actual, probable or possible espionage, sabotage, terrorism or subversive activity at a company location',
      summary: 'The FBI report, with prompt notice and a copy to the CSA.',
      cfr: '117.8(b)',
      ask: () => ['danger', 'dod'],
      rules: (a) => ({
        kind: 'yes',
        title: 'Report to the FBI, and notify your CSA',
        recipients: [R.fbi('§117.8(b)(1)'), R.dcsa(a, 'Prompt notice through your industrial security representative, with a copy of the written FBI report', '§117.8(b)(2)'), R.itpso()],
        when: WHEN.promptly,
        include: ['What came to the company’s attention: who, what, when, where, how; the location involved.', 'The written report (email or formal correspondence) that follows any phone report, regardless of the FBI’s disposition (§117.8(b)(1)).'],
        next: ['Do not question the person or gather evidence yourself; follow the FBI’s direction.', 'Give the CSA a copy of the written report (§117.8(b)(2)).', 'If classified information may have been compromised, the loss or compromise report under §117.8(d) is separate: pick that event too.', RECORDS],
        verified: 'Checked against §117.8(b), (b)(1)–(2).',
      }),
    },
    {
      id: 'c-adverse', layer: 'company', branches: ['other'], group: 'Threats and people',
      label: 'Adverse information about an employee with eligibility (or in process, or reinstatable)',
      summary: 'The company’s adverse-information report: facts, not rumor or innuendo; termination does not end the duty.',
      cfr: '117.8(c)(1)', isl: true,
      ask: () => ['danger', 'rumor', 'covered', 'dod', 'govsite'],
      rules: (a) => ({
        kind: 'yes',
        title: 'Report the adverse information',
        recipients: [R.dcsa(a, diss(a, 'incident report created and submitted by the FSO or SMO'), '§117.8(c)(1); ISL 2021-02'), ...(a.govsite === 'yes' ? [R.usgPoc()] : []), R.itpso()],
        when: { ...WHEN.none, text: 'The rule sets no number of days: report once the facts are known. Do not delay a required report for an internal eligibility investigation (DCSA October 2026 briefing).' },
        include: ['The known facts and relevant detail, tied to the SEAD 4 adjudicative guideline they bear on (ISL 2021-02); nothing based on rumor or innuendo (§117.8(c)(1)).', 'Follow-up and final disposition through the same channel.'],
        next: ['Employment termination does not negate the duty; for a former employee, ask DCSA for the submission mechanism (§117.8(c)(1)(i)).', a.govsite === 'yes' ? 'Give the USG security point of contact for the location a copy of the report and its final disposition (§117.8(c)(1)(i)).' : 'If the employee is later assigned to a USG location, that location’s security POC gets a copy and the final disposition (§117.8(c)(1)(i)).', 'A report is not an adverse finding: DCSA adjudicates. Becker v. Philco protects required reports from defamation liability (§117.8(c)(1)(ii)).', 'If it may be espionage, sabotage, terrorism or subversion, the FBI report under §117.8(b) is separate: pick that event too.', RECORDS],
        verified: 'Checked against §117.8(c)(1), (c)(1)(i)–(ii). The covered population (in process, reinstatable) follows ISL 2021-02 and the DCSA October 2026 briefing as reviewed on fsotools.ai.',
      }),
    },
    {
      id: 'c-suspicious', layer: 'company', branches: ['other', 'visitor'], group: 'Threats and people',
      label: 'Suspicious contact or attempted elicitation: efforts to get protected information, exploitation, or unauthorized access to the facility or classified information',
      summary: 'The company’s suspicious-contact report; the FBI when it may be espionage.',
      cfr: '117.8(c)(2)',
      ask: () => ['danger', 'dod', 'espionage'],
      rules: (a) => ({
        kind: 'yes',
        title: 'Report the suspicious contact',
        recipients: [R.dcsa(a, a.dod === 'no' ? 'The CSA’s designated channel' : 'DCSA’s designated reporting channel for suspicious contacts; the DCSA counterintelligence representative can advise', '§117.8(c)(2)'), ...(a.espionage === 'yes' ? [R.fbi('§117.8(b)')] : []), R.ci(), R.gca(), R.itpso()],
        when: { ...WHEN.none, text: a.espionage === 'yes' ? 'The FBI report is due promptly (§117.8(b)); §117.8(c)(2) sets no number of days.' : '§117.8(c)(2) sets no number of days: report while the facts are fresh.' },
        include: ['Who, what, when, where and how: the person making the approach, the employee contacted, the information sought, the method (SEAD 3 App. A.13 lists the data elements).', 'Any effort to obtain illegal or unauthorized access to the cleared facility or to classified information (§117.8(c)(2)(i)).'],
        next: ['Follow the CSA’s and counterintelligence instructions; do not confront or investigate the contact yourself.', a.espionage === 'yes' ? 'Give the CSA prompt notice and a copy of the written FBI report (§117.8(b)(2)).' : 'If it later looks like espionage, sabotage, terrorism or subversion, report to the FBI promptly (§117.8(b)).', 'The targeted employee’s own SEAD 3 report (elicitation, §G.2(a) / §H.2(a)) is separate.', RECORDS],
        verified: 'Checked against §117.8(c)(2)(i)–(ii) and §117.8(b).',
      }),
    },
    {
      id: 'c-status', layer: 'company', branches: ['self'], group: 'Status changes the company reports',
      label: 'An eligible employee dies, changes name, leaves the company or changes citizenship',
      summary: 'The status-change report through the CSA-designated mechanism.',
      cfr: '117.8(c)(3)',
      ask: () => ['covered', 'dod'],
      rules: (a) => ({
        kind: 'yes',
        title: 'Report the change in status',
        recipients: [R.dcsa(a, diss(a, 'the status change, by the FSO'), '§117.8(c)(3)')],
        when: WHEN.withChange,
        include: ['Which change: death, change in name, termination of employment, change in citizenship (§117.8(c)(3)(i)–(iv)), and its date.'],
        next: ['For a separation: debrief, withdraw access and credentials, recover classified material, and update the person’s affiliation in the system.', 'If adverse information is learned after employment ends, §117.8(c)(1)(i) still applies.', RECORDS],
        verified: 'Checked against §117.8(c)(3)(i)–(iv).',
      }),
    },
    {
      id: 'c-laa', layer: 'company', branches: ['self'], group: 'Status changes the company reports',
      label: 'An employee with a Limited Access Authorization becomes a U.S. citizen',
      summary: 'Naturalization of a non-U.S. citizen employee granted an LAA.',
      cfr: '117.8(c)(4)',
      ask: () => ['laa', 'dod'],
      rules: (a) => {
        if (a.laa === 'no') return consider('Not a §117.8(c)(4) report, but consider…', '§117.8(c)(4) covers only a non-U.S. citizen employee granted an LAA who becomes a citizen through naturalization. A change in citizenship of an employee determined eligible for access is a status change under §117.8(c)(3)(iv): pick “An eligible employee … changes citizenship”.', ['Record the decision.']);
        return {
          kind: 'yes',
          title: 'Report the naturalization',
          recipients: [R.dcsa(a, a.dod === 'no' ? 'The CSA’s designated channel' : 'DCSA’s designated channel, by the FSO', '§117.8(c)(4)')],
          when: WHEN.withChange,
          include: ['City, county and state where naturalized; date naturalized; court; certificate number (§117.8(c)(4)(i)–(iv)).'],
          next: ['Ask DCSA how the LAA is handled once the employee is a citizen.', RECORDS],
          verified: 'Checked against §117.8(c)(4)(i)–(iv).',
        };
      },
    },
    {
      id: 'c-withdraw', layer: 'company', branches: ['self'], group: 'Status changes the company reports',
      label: 'An employee no longer wants to be processed for eligibility, or no longer wants classified access or work',
      summary: 'Report the request and the employee’s reason; it is not an adjudicative denial.',
      cfr: '117.8(c)(5)',
      ask: () => ['dod'],
      rules: (a) => ({
        kind: 'yes',
        title: 'Report the request',
        recipients: [R.dcsa(a, diss(a, 'as DCSA directs for the request, by the FSO'), '§117.8(c)(5)')],
        when: WHEN.withChange,
        include: ['The request and the reason the employee gives (§117.8(c)(5)).'],
        next: ['Do not treat it as an adjudicative denial.', 'Debrief and withdraw access as applicable.', RECORDS],
        verified: 'Checked against §117.8(c)(5).',
      }),
    },
    {
      id: 'c-nda', layer: 'company', branches: ['self'], group: 'Status changes the company reports',
      label: 'An employee refuses to sign the SF 312 (classified information nondisclosure agreement)',
      summary: 'Report the refusal; do not grant access without the signed agreement.',
      cfr: '117.8(c)(6)',
      ask: () => ['dod'],
      rules: (a) => ({
        kind: 'yes',
        title: 'Report the refusal',
        recipients: [R.dcsa(a, diss(a, 'as DCSA directs, by the FSO'), '§117.8(c)(6)')],
        when: WHEN.withChange,
        include: ['The refusal to sign the SF 312 or other approved NDA, and its date.'],
        next: ['Do not grant access to classified information without the required agreement.', RECORDS],
        verified: 'Checked against §117.8(c)(6).',
      }),
    },
    {
      id: 'company-changes', layer: 'company', branches: ['company'], group: 'Entity and facility changes',
      label: 'Change in ownership or control, operating name or address, key management personnel, reorganization or bankruptcy, or foreign ownership, control or influence',
      summary: 'Changed conditions affecting the facility clearance.',
      cfr: '117.8(c)(7)',
      ask: () => ['dod', 'changeType', 'sub'],
      rules: (a) => {
        const foci = a.changeType === 'foci';
        const include = {
          ownership: ['The change of ownership or control, including stock transfers that affect control (§117.8(c)(7)(i)).'],
          name: ['The new operating name or address of the entity or the cleared location (§117.8(c)(7)(ii)).'],
          kmp: ['The change to the KMP information previously submitted, with the names of the individuals being replaced, and a statement whether the new KMP are cleared (level and date), their dates and places of birth, social security numbers and citizenship, or whether they are excluded or temporarily excluded from access (§117.8(c)(7)(iii)(A)–(C)).'],
          termination: ['The action to terminate business or operations, the imminent adjudication or reorganization in bankruptcy, or the change that might affect the validity of the FCL (§117.8(c)(7)(iv)).'],
          foci: ['An updated SF 328 for a material FOCI change, answering only what changed (§117.8(c)(7)(v)).', 'For discussions, consultations or agreements that may reasonably lead to foreign ownership or control: the details, in writing; forward a copy of any Schedule 13D received.'],
        }[a.changeType];
        return {
          kind: 'yes',
          title: 'Report the changed condition',
          recipients: [R.dcsa(a, a.dod === 'no' ? 'The CSA’s designated channel' : 'Changed-condition package through NISS to DCSA Entity Vetting (DCSA October 2026 routing); the IS Rep is informed on completion', '§117.8(c)(7)'), ...(a.sub === 'yes' ? [R.prime()] : [])],
          when: foci ? WHEN.writing : WHEN.withChange,
          include,
          next: [a.sub === 'yes' ? 'Notify the prime that you reported to your CSA (§117.8(c)(14)).' : 'A subcontractor also notifies its prime for reports under §117.8(c)(7)–(10) (§117.8(c)(14)).', a.changeType === 'kmp' ? 'A new complete KMP list is needed only at your discretion or when the CSA asks (§117.8(c)(7)(iii)).' : 'Tell the customer or prime too when the contract requires it.', RECORDS],
          verified: 'Checked against §117.8(c)(7)(i)–(v) and (c)(14). The NISS to Entity Vetting route follows DCSA’s October 2026 briefing as reviewed on fsotools.ai.',
        };
      },
    },
    {
      id: 'c-storage', layer: 'company', branches: ['company'], group: 'Entity and facility changes',
      label: 'Change in the need or the ability to store or safeguard classified material',
      summary: 'Storage requirement or capability changes.',
      cfr: '117.8(c)(8)',
      ask: () => ['dod', 'sub'],
      rules: (a) => ({
        kind: 'yes',
        title: 'Report the change',
        recipients: [R.dcsa(a, a.dod === 'no' ? 'The CSA’s designated channel' : 'NISS, or as your IS Rep directs', '§117.8(c)(8)'), ...(a.sub === 'yes' ? [R.prime()] : [])],
        when: WHEN.withChange,
        include: ['The change in storage requirement or in capability to safeguard classified material, and the location.'],
        next: ['Update the authorized storage and site records before relying on a changed capability (fsotools.ai reviewed table; the rule sets no timing).', a.sub === 'yes' ? 'Notify the prime that you reported to your CSA (§117.8(c)(14)).' : 'A subcontractor also notifies its prime (§117.8(c)(14)).', RECORDS],
        verified: 'Checked against §117.8(c)(8), (c)(14).',
      }),
    },
    {
      id: 'c-emergency', layer: 'company', branches: ['company'], group: 'Entity and facility changes',
      label: 'An emergency means a location cannot safeguard classified material',
      summary: 'Report as soon as possible; protect or recover the material under emergency procedures.',
      cfr: '117.8(c)(9)',
      ask: () => ['danger', 'dod', 'sub'],
      rules: (a) => ({
        kind: 'yes',
        title: 'Report as soon as possible',
        recipients: [R.dcsa(a, a.dod === 'no' ? 'The fastest channel your CSA accepts' : 'The fastest channel DCSA accepts: phone your IS Rep, then follow with the written report DCSA directs', '§117.8(c)(9)'), ...(a.sub === 'yes' ? [R.prime()] : []), R.gca()],
        when: WHEN.asap,
        include: ['The emergency, the location, what classified material is affected and what has been done to protect or recover it.'],
        next: ['Protect or recover the material under your emergency procedures and follow the CSA’s direction.', 'If material may have been lost or compromised, the §117.8(d) report is separate: pick that event too.', a.sub === 'yes' ? 'Notify the prime that you reported to your CSA (§117.8(c)(14)).' : 'A subcontractor also notifies its prime (§117.8(c)(14)).', RECORDS],
        verified: 'Checked against §117.8(c)(9), (c)(14).',
      }),
    },
    {
      id: 'c-subcontract', layer: 'company', branches: ['company'], group: 'Contracts, material and subcontractors',
      label: 'A prime or subcontractor may not be protecting classified information adequately, or its eligibility may be affected',
      summary: 'Unsatisfactory conditions of a prime or subcontractor.',
      cfr: '117.8(c)(10)',
      ask: () => ['dod', 'role'],
      rules: (a) => ({
        kind: 'yes',
        title: 'Report it to your CSA',
        recipients: [R.dcsa(a, a.dod === 'no' ? 'The CSA’s designated channel' : 'Your DCSA industrial security representative', a.role === 'sub' ? '§117.8(c)(10)(ii)' : '§117.8(c)(10)(i)'), ...(a.role === 'sub' ? [R.prime()] : []), R.gca()],
        when: { ...WHEN.none, text: '§117.8(c)(10) sets no number of days: report when the information comes to your attention.' },
        include: ['The information indicating that classified information cannot be adequately protected, or the circumstance that may affect the other entity’s eligibility (§117.8(c)(10)).'],
        next: ['Coordinate any contract or customer protection actions with the GCA.', a.role === 'sub' ? 'Notify the prime that you reported to your CSA (§117.8(c)(14)).' : 'Primes include subcontractors who have in turn subcontracted work (§117.8(c)(10)(i)).', RECORDS],
        verified: 'Checked against §117.8(c)(10)(i)–(ii), (c)(14).',
      }),
    },
    {
      id: 'c-rediscovered', layer: 'company', branches: ['material'], group: 'Classified material',
      label: 'Classified material previously terminated from accountability is found',
      summary: 'Report the rediscovery and disposition so the accountability record is reconciled.',
      cfr: '117.8(c)(11)',
      ask: () => ['dod'],
      rules: (a) => ({
        kind: 'yes',
        title: 'Report the rediscovery',
        recipients: [R.dcsa(a, a.dod === 'no' ? 'The CSA’s designated channel' : 'Your DCSA industrial security representative, or as DCSA directs', '§117.8(c)(11)')],
        when: { ...WHEN.none, text: '§117.8(c)(11) sets no number of days: report when the material is found and brought back into accountability.' },
        include: ['What was found, where, when, and its disposition, so the accountability record can be reconciled.'],
        next: ['If the find shows the material was outside accountability in circumstances suggesting loss or compromise, the §117.8(d) report is separate: pick that event too.', RECORDS],
        verified: 'Checked against §117.8(c)(11).',
      }),
    },
    {
      id: 'c-foreign-contract', layer: 'company', branches: ['company'], group: 'Contracts, material and subcontractors',
      label: 'Negotiating or winning a foreign classified contract not placed through a CSA or U.S. Government agency',
      summary: 'Pre-contract negotiation or award involving U.S. classified information to a foreign interest, or access to foreign classified information.',
      cfr: '117.8(c)(12)',
      ask: () => ['dod', 'placed'],
      rules: (a) => {
        if (a.placed === 'yes') return consider('Not a §117.8(c)(12) report, but consider…', '§117.8(c)(12) covers only a pre-contract negotiation or award not placed through a CSA or U.S. GCA. A contract placed through a CSA or GCA carries its own security requirements (DD Form 254, §117.19 for international programs).', ['Record the decision.']);
        return {
          kind: 'yes',
          title: 'Report the negotiation or award',
          recipients: [R.dcsa(a, a.dod === 'no' ? 'The CSA’s designated channel' : 'Your DCSA industrial security representative, or as DCSA directs', '§117.8(c)(12)')],
          when: { ...WHEN.none, text: 'During pre-contract negotiation or at award (§117.8(c)(12)); no number of days.' },
          include: ['Whether it involves, or may involve, the release or disclosure of U.S. classified information to a foreign interest, or access to classified information furnished by a foreign interest (§117.8(c)(12)(i)–(ii)).'],
          next: ['Do not disclose or accept classified information outside approved channels.', 'International security requirements are in §117.19.', RECORDS],
          verified: 'Checked against §117.8(c)(12)(i)–(ii).',
        };
      },
    },
    {
      id: 'c-foreign-material', layer: 'company', branches: ['material', 'visitor'], group: 'Classified material',
      label: 'Classified material received from a foreign interest outside U.S. Government channels',
      summary: 'Improper receipt of foreign government material.',
      cfr: '117.8(c)(13)',
      ask: () => ['dod', 'usgChannels'],
      rules: (a) => {
        if (a.usgChannels === 'yes') return consider('Not a §117.8(c)(13) report, but consider…', '§117.8(c)(13) covers classified material from foreign interests not received through USG channels. Material received through USG channels follows the contract and §117.19.', ['Record the decision.']);
        return {
          kind: 'yes',
          title: 'Report the receipt',
          recipients: [R.dcsa(a, a.dod === 'no' ? 'The CSA’s designated channel' : 'Your DCSA industrial security representative, or as DCSA directs', '§117.8(c)(13)')],
          when: { ...WHEN.none, text: '§117.8(c)(13) sets no number of days: report on receipt.' },
          include: ['What was received, from whom, when and how; where it is now and how it is protected.'],
          next: ['Protect the material and follow the CSA’s handling and disposition instructions.', RECORDS],
          verified: 'Checked against §117.8(c)(13).',
        };
      },
    },
    {
      id: 'c-loss', layer: 'company', branches: ['material'], group: 'Classified material',
      label: 'Classified information may have been lost or compromised (U.S. or foreign)',
      summary: 'Preliminary inquiry immediately; initial report promptly if confirmed; final report after the investigation.',
      cfr: '117.8(d)',
      ask: (a) => ['danger', 'dod', 'confirmed', ...(a.confirmed === 'yes' ? ['govsite', 'fgi'] : [])],
      rules: (a) => {
        if (a.confirmed === 'no') return {
          kind: 'inquiry',
          title: 'Not yet: start the preliminary inquiry immediately',
          text: 'Immediately upon receipt of a security violation report involving classified information, initiate a preliminary inquiry to ascertain all the circumstances, including validation of the classification (§117.8(d)(1)). If the inquiry confirms a loss, compromise or suspected compromise, the initial report is due promptly (§117.8(d)(2)): come back to this aid then.',
          recipients: [{ who: 'Internal: preliminary inquiry', via: 'Your security violation procedures', basis: '§117.8(d)(1)', kind: K.required }, R.itpso()],
          when: WHEN.immediately,
          include: ['The circumstances of the presumed loss, compromise or suspected compromise; validation of the classification.'],
          next: ['If the inquiry finds no loss or compromise, document it and handle any security violation internally; violation tracking and the culpability report under §117.8(e) still apply.', 'Each CSA may provide additional guidance on the reporting time period (§117.8(d)).', RECORDS],
          verified: 'Checked against §117.8(d)(1)–(2).',
        };
        return {
          kind: 'yes',
          title: 'Report the loss, compromise or suspected compromise',
          recipients: [R.dcsa(a, a.dod === 'no' ? 'The CSA’s designated channel' : 'Your DCSA industrial security representative, or as DCSA directs', '§117.8(d)'), ...(a.govsite === 'yes' ? [R.facilityHead()] : []), { ...R.gca(), via: 'The CSA notifies the GCA under its process (§117.8(d)(3)); tell the customer directly when the contract or DD Form 254 requires it' }, R.itpso()],
          when: { ...WHEN.promptly, text: 'An initial report promptly after the preliminary inquiry confirms it, unless the CSA directs otherwise (§117.8(d)(2)); a final report when the investigation is complete (§117.8(d)(3)). Each CSA may provide additional guidance on the reporting time period.' },
          include: ['Initial report: what was lost or compromised, its classification, the circumstances, what has been done to recover or contain it.', 'Final report: material and relevant information not in the initial report; the full name and social security number of the individual(s) primarily responsible, with any record of prior incidents; corrective action taken to preclude recurrence; disciplinary action, if any; the specific reasons for concluding that loss, compromise or suspected compromise occurred or did not (§117.8(d)(3)(i)–(v)).', ...(a.fgi === 'yes' ? ['Identify the foreign government information involved; the CSA notifies the GCA and foreign government channels under its process. Check §117.19 and the contract’s instructions for foreign government information.'] : [])],
          next: ['Submit the final report when the investigation is complete; the CSA follows its procedures to notify the GCA (§117.8(d)(3)).', 'Report information about the responsible employee when the CSA requests it (§117.8(d)(4)).', 'A culpability report under §117.8(e) is separate: pick that event when the responsible individual is determined.', 'If it may involve espionage, the FBI report under §117.8(b) is separate.', RECORDS],
          verified: 'Checked against §117.8(d), (d)(1)–(4).',
        };
      },
    },
    {
      id: 'c-culpability', layer: 'company', branches: ['other'], group: 'Threats and people',
      label: 'An employee is found responsible for a security violation or for negligence',
      summary: 'The final culpability report with findings and corrective or disciplinary action.',
      cfr: '117.8(e)',
      ask: () => ['dod', 'determined'],
      rules: (a) => {
        if (a.determined === 'no') return consider('Not yet: the final report is due when the responsible individual is determined', 'Record the violation in your system for tracking violations and patterns (§117.8(e)(1)) and apply the graduated scale of administrative and disciplinary actions (§117.8(e)(2)). The final report to the CSA with the findings of culpability and the corrective actions follows when the responsible individual is determined (§117.8(e)(2)–(3)).', ['Keep the inquiry record.', 'Give the facts to the ITPSO (§117.7(d)).']);
        return {
          kind: 'yes',
          title: 'Submit the final culpability report',
          recipients: [R.dcsa(a, a.dod === 'no' ? 'The CSA’s designated channel' : 'Your DCSA industrial security representative, or as DCSA directs', '§117.8(e)(2)–(3)'), R.itpso()],
          when: { ...WHEN.none, text: 'When the responsible individual is determined (§117.8(e)(3)); no number of days.' },
          include: ['The findings of the employee’s culpability and the corrective actions taken (§117.8(e)(2)).', 'A statement of the administrative or disciplinary actions taken (§117.8(e)(3)).', 'Whether the violation involved a deliberate disregard of security requirements; negligence in handling classified material; or a recent or recurring pattern of questionable judgment, irresponsibility, negligence or carelessness (§117.8(e)(3)(i)–(iii)).'],
          next: ['Keep the system that tracks violations and patterns (§117.8(e)(1)).', 'The loss or compromise report under §117.8(d) is separate.', RECORDS],
          verified: 'Checked against §117.8(e), (e)(1)–(3).',
        };
      },
    },
    {
      id: 'c-cyber', layer: 'company', branches: ['material'], group: 'Classified material',
      label: 'A cyber incident on a company information system',
      summary: 'Classified covered systems: immediately to the DoD CSO. Unclassified systems: per the contract (DFARS 252.204-7012: within 72 hours of discovery).',
      cfr: '117.8(f)', dfars: true,
      ask: (a) => ['cdc', 'classifiedSystem', ...(a.classifiedSystem === 'yes' ? ['fgi'] : a.classifiedSystem === 'no' ? ['dfars'] : [])],
      rules: (a) => {
        if (a.cdc === 'no') return consider('Not under §117.8(f), but consider…', '§117.8(f) applies only to cleared defense contractors (CDCs). Check your contracts for a cyber incident clause and its recipient, and tell the FSO and ITPSO if the incident may involve an insider. The FBI report (§117.8(b)) and the loss or compromise report (§117.8(d)) apply regardless of the cyber paragraph.', ['Preserve the logs and images.', 'Record the decision.']);
        if (a.classifiedSystem === 'yes') return {
          kind: 'yes',
          title: 'Report immediately to the DoD cognizant security office',
          recipients: [R.cso(), ...(a.fgi === 'yes' ? [R.dtsa()] : []), R.dcsa(a, 'As DCSA and the contract direct', '§117.8(f); §117.8(b) and (d) still apply'), R.itpso()],
          when: WHEN.immediately,
          include: ['A description of the technique or method used (§117.8(f)(1)(i)(A)).', 'A sample of the malicious software, if discovered and isolated (§117.8(f)(1)(i)(B)).', 'A summary of information in connection with any DoD program potentially compromised (§117.8(f)(1)(i)(C)).'],
          next: ['Allow DoD personnel access to additional equipment or information needed for forensic analysis, on request (§117.8(f)(3)).', 'The reporting requirements of §117.8(f) are in addition to §117.8(b) and (d): decide whether classified information was lost or compromised (pick that event) and whether it may be espionage (FBI).', RECORDS],
          verified: 'Checked against §117.8(f), (f)(1)(i)–(iii), (f)(3).',
        };
        if (a.dfars === 'no') return consider('Not under DFARS 252.204-7012, but consider…', 'For a non-Federal information system not authorized to process classified information, a CDC reports in accordance with contract requirements (§117.8(f)(2)). Check the contract for its own cyber incident clause and recipient; §117.8(b) and (d) still apply.', ['Preserve the logs and images.', 'Record the decision.']);
        return {
          kind: 'yes',
          title: 'Report to DoD within 72 hours of discovery',
          recipients: [R.dibnet(), R.gca(), R.itpso()],
          when: WHEN.seventyTwo,
          include: ['The required elements at dibnet.dod.mil (DFARS 252.204-7012(c)(2)).', 'A medium assurance certificate is required to report (DFARS 252.204-7012(c)(3)).'],
          next: ['Preserve and protect images of all known affected information systems and all relevant monitoring and packet-capture data for at least 90 days from the report (DFARS 252.204-7012(e)).', 'Submit isolated malicious software to the DoD Cyber Crime Center (DC3) as DC3 or the Contracting Officer instructs, never to the Contracting Officer (DFARS 252.204-7012(d)); give DoD access to information or equipment needed for forensic analysis on request (DFARS 252.204-7012(f)).', 'The clause flows down to subcontracts that involve covered defense information or operationally critical support (DFARS 252.204-7012(m)).', 'The §117.8(b) FBI route and the §117.8(d) loss or compromise route still apply when classified information may be involved.', RECORDS],
          verified: 'Checked against §117.8(f)(2) and DFARS 252.204-7012(a) (“Rapidly report means within 72 hours of discovery of any cyber incident”), (c)(1)(ii) (report to DoD at https://dibnet.dod.mil), (c)(2)–(3), (e).',
        };
      },
    },
    {
      id: 'c-isoo', layer: 'company', branches: ['company'], group: 'Oversight',
      label: 'A duplicate security review or audit, or a duplicate facility clearance process, by another agency',
      summary: 'Report redundant CSA activity to the Director, ISOO, for resolution.',
      cfr: '117.8(g)',
      ask: () => [],
      rules: () => ({
        kind: 'yes',
        title: 'Report the duplication to ISOO',
        recipients: [R.isoo()],
        when: { ...WHEN.none, text: '§117.8(g) sets no number of days: report when the duplication occurs.' },
        include: ['The redundant or duplicative security review or audit activity by CSAs (§117.8(g)(1)), or the CSA’s duplicate processing of an entity eligibility determination that another CSA already made (§117.8(g)(2)).', 'The records needed to identify the overlapping review or determination.'],
        next: ['Tell your CSA’s industrial security representative that you have reported (good practice).', RECORDS],
        verified: 'Checked against §117.8(g)(1)–(2).',
      }),
    },
  ];

  // The fallback: not a row of the website table.
  const FALLBACK = {
    id: 'unsure', layer: 'none', branches: ['self', 'other', 'company', 'material', 'visitor'], group: 'Something else',
    label: 'Something else, or you are not sure which of these it is',
    summary: 'Take it to the FSO or ITPSO now.',
    ask: () => ['danger'],
    rules: () => ({
      kind: 'consider',
      title: 'Take it to the FSO or ITPSO now',
      text: 'The FSO decides whether any report applies. Write down the facts you know: who, what, when and where. Leave out opinions and guesses, and do not investigate a coworker yourself.',
      next: ['Insider-threat situations have their own aid: the FSO ITPM Assistant’s “Is this reportable?” page.', 'The full reviewed table is the cleared industry reporting guide on fsotools.ai.'],
      links: { itpm: ITPM, site: 'https://fsotools.ai/reporting/industry/' },
    }),
  };

  // ---- the engine ----
  function consider(title, text, next) {
    return { kind: 'consider', title, text, next: next || [] };
  }
  function settle(title, text) {
    return { kind: 'settle', title, text };
  }
  const STOP = {
    kind: 'stop',
    title: 'Stop: emergency route',
    text: 'Call 911 or your facility’s emergency number and follow your emergency procedures. Protect people first, then classified material. Come back to this aid when it is safe; the reports below still apply afterwards.',
    next: ['An emergency that leaves a location unable to safeguard classified material is reported to the CSA as soon as possible (§117.8(c)(9)).', 'Possible espionage, sabotage or terrorism goes to the FBI promptly (§117.8(b)).'],
  };

  const byId = (id) => (id === FALLBACK.id ? FALLBACK : EVENTS.find((e) => e.id === id));
  const eventsFor = (branch) => [...EVENTS.filter((e) => e.branches.includes(branch)), FALLBACK];
  const groupsFor = (branch) => [...new Set(eventsFor(branch).map((e) => e.group))];

  function links(ev) {
    const l = {};
    if (ev.id !== FALLBACK.id) l.site = SITE + ev.id;
    if (ev.cfr) l.cfr = CFR + ev.cfr;
    if (ev.sead3) l.sead3 = SEAD3;
    if (ev.isl) l.isl = ISL;
    if (ev.dfars) l.dfars = DFARS;
    return l;
  }

  // answers: { questionId: value }. Returns the next question or the outcome.
  function decide(eventId, answers) {
    const ev = byId(eventId);
    if (!ev) throw new Error(`unknown event ${eventId}`);
    const a = answers || {};
    for (const qid of ev.ask(a)) {
      const q = QUESTIONS[qid];
      if (!q) throw new Error(`unknown question ${qid}`);
      const v = a[qid];
      if (v == null || v === '') return { kind: 'question', id: qid, q: q.q, help: q.help || '', options: q.options, event: ev };
      if (!q.options.some((o) => o.v === v)) throw new Error(`bad answer ${v} for ${qid}`);
      if (qid === 'danger' && v === 'yes') return { ...STOP, event: ev, links: links(ev), prep: PREP };
      if (v === 'unsure') return { ...settle('Settle this before deciding', (ev.settle && ev.settle[qid]) || q.settle), question: qid, event: ev, links: links(ev), prep: PREP };
      if (v === 'no' && q.no) return { ...consider(q.no.title, q.no.text, q.no.next), question: qid, event: ev, links: links(ev), authority: ev.id === FALLBACK.id ? '' : SITE_ROWS[ev.id].authority, prep: PREP };
    }
    const o = ev.rules(a);
    const site = ev.id === FALLBACK.id ? null : SITE_ROWS[ev.id];
    return {
      recipients: [],
      include: [],
      next: [],
      ...o,
      event: ev,
      authority: site ? site.authority : '',
      links: { ...links(ev), ...(o.links || {}) },
      prep: PREP,
    };
  }

  // The word or phrase shown for "By when", and the computed due date when the clock has a number.
  function whenText(when) {
    if (!when) return '';
    return when.days ? when.text : `${when.text} No fixed clock in the rule: enter your company standard.`;
  }

  root.RaEvents = { SITE, CFR, CFR_SECTION, SEAD3, ISL, DFARS, ITPM, OCT, SITE_ROWS, BRANCHES, QUESTIONS, WHEN, ANCHOR_LABEL, EVENTS, FALLBACK, byId, eventsFor, groupsFor, decide, whenText, links };
})(typeof window !== 'undefined' ? window : globalThis);
