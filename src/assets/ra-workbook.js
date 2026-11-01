// The reporting workbook (FSO Reporting Assistant): one definition of every
// sheet, shared by the blank workbook and each export so that rows copied from
// an export paste straight into the blank workbook, column for column.
//
// The Reporting Log sheet has exactly the columns of the FSO ITPM Assistant's
// Reporting Log (itp-workbook.js), so rows paste across both workbooks. The
// File Notes sheet is this product's own. Due dates and alerts are Excel
// formulas; the page applies the same rules in JavaScript (dueDate, noteAlert)
// and the tests pin both.
//
// References were checked against the eCFR text of 32 CFR Part 117 current
// as of 2026-10-29 (CITATIONS.md). "Good practice" marks a step the rule does
// not require.
(function (root) {
  'use strict';

  const YES_NO = ['Yes', 'No'];
  const STATUS = ['Open', 'Submitted', 'Closed', 'Not reportable'];
  const VERSION = 'FSO Reporting Assistant workbook, draft 2026-11-01';

  // Formulas take the row number. Excel's AND() evaluates every argument, so a
  // date that may be blank is tested with IF(cell="",FALSE,...) to avoid #VALUE!.
  const r$ = (f) => (r) => f.replace(/\{r\}/g, r);

  const SHEETS = {
    // Column for column the ITPM Reporting Log: keep the headers, order, widths,
    // lists and the Days open formula identical to itp-workbook.js.
    log: {
      name: 'Reporting Log',
      columns: [
        { header: 'Log no.', width: 10 },
        { header: 'Date learned', width: 13, type: 'date' },
        { header: 'Subject: name or internal ID', width: 22 },
        { header: 'What happened (trigger)', width: 36, type: 'wrap' },
        { header: 'Report to', width: 30, type: 'wrap' },
        { header: 'Channel or system', width: 24, type: 'wrap' },
        { header: 'Timing', width: 34, type: 'wrap' },
        { header: 'Due by', width: 13, type: 'date' },
        { header: 'Date submitted', width: 13, type: 'date' },
        { header: 'Reference or confirmation no.', width: 18 },
        { header: 'Status', width: 16, list: STATUS },
        { header: 'ITPSO reviewed', width: 10, list: YES_NO },
        { header: 'Authority', width: 22, type: 'wrap' },
        { header: 'Notes', width: 34, type: 'wrap' },
        { header: 'Days open', width: 9, formula: r$('IF(B{r}="","",IF(I{r}="",TODAY()-B{r},I{r}-B{r}))') },
      ],
      // The Overdue highlight is a conditional format on Due by (no extra
      // column, so the sheet stays paste-compatible with the ITPM log).
      highlight: [
        { column: 'Status', rules: [['Open', 1], ['Submitted', 2], ['Closed', 2]] },
        { column: 'Due by', expr: [['AND(H2<>"",H2<TODAY(),K2="Open")', 0]] },
      ],
    },
    notes: {
      name: 'File Notes',
      columns: [
        { header: 'Case ID', width: 16 },
        { header: 'Date learned', width: 13, type: 'date' },
        { header: 'Time learned', width: 10 },
        { header: 'How learned (role)', width: 20, type: 'wrap' },
        { header: 'Branch', width: 22, type: 'wrap' },
        { header: 'Event', width: 36, type: 'wrap' },
        { header: 'Outcome', width: 26, type: 'wrap' },
        { header: 'Facts as known', width: 60, type: 'wrap' },
        { header: 'Recipients and channels', width: 40, type: 'wrap' },
        { header: 'Clock (days)', width: 9, type: 'number' },
        { header: 'Clock basis', width: 11, list: ['calendar', 'business'] },
        { header: 'Due by', width: 13, type: 'date', formula: r$('IF(OR(B{r}="",J{r}=""),"",IF(K{r}="business",WORKDAY(B{r},J{r}),B{r}+J{r}))') },
        { header: 'Date submitted', width: 13, type: 'date' },
        { header: 'Reference or confirmation no.', width: 18 },
        { header: 'Status', width: 16, list: STATUS },
        { header: 'Alert', width: 24, formula: r$('IF(A{r}="","",IF(O{r}="Open",IF(L{r}="","No clock: company standard",IF(L{r}<TODAY(),"Overdue",IF(L{r}-TODAY()<=2,"Due soon","On track"))),""))') },
        { header: 'Prepared by (role/initials)', width: 16 },
        { header: 'Reviewed by (role/initials)', width: 16 },
        { header: 'Follow-up actions', width: 40, type: 'wrap' },
        { header: 'Follow-up due', width: 13, type: 'date' },
        { header: 'Authority', width: 30, type: 'wrap' },
      ],
      highlight: [
        { column: 'Alert', rules: [['Overdue', 0], ['Due soon', 1], ['No clock', 1], ['On track', 2]] },
        { column: 'Status', rules: [['Open', 1], ['Submitted', 2], ['Closed', 2]] },
      ],
    },
  };

  const README = (what) => [
    'FSO Reporting Workbook',
    '',
    what,
    '',
    'Where this file lives',
    '  This workbook was made in your browser. Nothing you typed was sent anywhere or saved by the website. Keep this file where your company keeps security program records: access-restricted, not a personal or shared cloud folder, and not attached to email.',
    '',
    'Copying between workbooks',
    '  Every sheet has the same columns, in the same order, as the blank workbook from the FSO Reporting Assistant home page. To add exported rows to your master copy: select whole rows in the export, copy, click the first empty row of the same sheet in your master copy, and paste. Grey columns are calculated; their formulas copy with the rows.',
    '  The Reporting Log sheet has exactly the columns of the FSO ITPM Assistant’s Reporting Log, so rows paste between the two workbooks in either direction.',
    '',
    'Due dates and alerts',
    '  File Notes: Due by is Date learned plus the Clock (days), counting business days (Monday to Friday, no holiday list) when Clock basis is "business". Alert shows Overdue, Due soon (within 2 days), On track or "No clock: company standard" while the status is Open. Reporting Log: Due by is highlighted when it has passed and the status is still Open.',
    '  Where the rule sets no number of days ("promptly", "immediately", "as soon as possible") the aid leaves the clock blank: enter the date your company standard or your CSA gives.',
    '',
    'Before relying on it',
    '  This is a preparation aid, not a determination and not legal advice. The references name the paragraph of 32 CFR Part 117, SEAD 3 or the DCSA guidance each row comes from, checked against the eCFR text current as of 29 October 2026; check your contract, DD Form 254 and current DCSA guidance too. "Good practice" marks steps the rule does not require.',
    '  Store only what the program needs. Use an internal case ID instead of a name where you can; enter a name only in the company’s protected records. Record facts, not rumor, innuendo or diagnoses (32 CFR §117.8(c)(1)).',
    '',
    VERSION,
  ];

  const blankRows = 200;
  function sheet(key, rows, extra) {
    return { ...SHEETS[key], rows: rows || [], blankRows: rows && rows.length ? 0 : blankRows, ...(extra || {}) };
  }

  // The blank master workbook: Read Me, Reporting Log and File Notes with room for 200 rows each.
  function blankWorkbook() {
    return [
      { name: 'Read Me', notes: README('The master copy: the reporting log and the file notes for one company.') },
      sheet('log', []),
      sheet('notes', []),
    ];
  }

  // ---- shared page helpers ----
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => isoDate(new Date());
  function parse(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function addDays(iso, n) {
    const d = parse(iso);
    if (!d) return '';
    d.setDate(d.getDate() + n);
    return isoDate(d);
  }
  // Excel WORKDAY(start, n) without a holiday list: n working days after
  // start, skipping Saturdays and Sundays (a weekend start is not counted).
  function workday(iso, n) {
    const d = parse(iso);
    if (!d) return '';
    let left = Number(n);
    while (left > 0) {
      d.setDate(d.getDate() + 1);
      const w = d.getDay();
      if (w !== 0 && w !== 6) left -= 1;
    }
    return isoDate(d);
  }
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);

  // The same rule as the File Notes "Due by" formula. when = { days, business }.
  function dueDate(anchorIso, when) {
    if (!parse(anchorIso) || !when || !Number.isFinite(Number(when.days))) return '';
    return when.business ? workday(anchorIso, when.days) : addDays(anchorIso, Number(when.days));
  }
  // The same rule as the File Notes "Alert" formula.
  // row = { caseId, learned, clockDays, clockBasis, status }
  function noteAlert(row, now) {
    now = now || today();
    if (!row.caseId) return '';
    if (row.status !== 'Open') return '';
    const due = dueDate(row.learned, { days: row.clockDays === '' || row.clockDays == null ? NaN : Number(row.clockDays), business: row.clockBasis === 'business' });
    if (!due) return 'No clock: company standard';
    if (due < now) return 'Overdue';
    return daysBetween(now, due) <= 2 ? 'Due soon' : 'On track';
  }
  // The Reporting Log "Due by" highlight: past due while still Open.
  function logOverdue(row, now) {
    now = now || today();
    return Boolean(parse(row.due)) && row.due < now && row.status === 'Open';
  }

  // Rows copied from Excel arrive as tab-separated text.
  function parsePasted(text) {
    return String(text || '')
      .replace(/\r/g, '')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => line.split('\t').map((c) => c.trim().replace(/^"(.*)"$/s, '$1')));
  }
  function normalizeDate(v) {
    v = String(v || '').trim();
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    let m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(v); // US m/d/yyyy
    if (m) return `${m[3].length === 2 ? `20${m[3]}` : m[3]}-${pad(m[1])}-${pad(m[2])}`;
    m = /^\d{5}$/.exec(v); // an Excel day number
    if (m) {
      const d = new Date(Date.UTC(1899, 11, 30) + Number(v) * 86400000);
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    }
    return v;
  }

  function fileName(stem) {
    return `${stem}-${today()}.xlsx`;
  }
  // A default internal case ID; never a name.
  function caseId(n) {
    return `CASE-${today()}-${pad(n || 1)}`;
  }

  // Ask before leaving a page with unsaved entries: nothing is kept after it closes.
  function guardUnsaved(isDirty) {
    root.addEventListener &&
      root.addEventListener('beforeunload', (e) => {
        if (isDirty()) {
          e.preventDefault();
          e.returnValue = '';
        }
      });
  }

  root.RaWorkbook = {
    VERSION,
    STATUS,
    SHEETS,
    README,
    sheet,
    blankWorkbook,
    today,
    addDays,
    workday,
    daysBetween,
    dueDate,
    noteAlert,
    logOverdue,
    parsePasted,
    normalizeDate,
    fileName,
    caseId,
    guardUnsaved,
  };
})(typeof window !== 'undefined' ? window : globalThis);
