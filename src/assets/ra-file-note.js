// The file note (file-note.html): one printable page per event, prefilled
// from decide.html through the URL query (event, answers and dates only; the
// outcome is recomputed here with ra-events.js), or filled by hand. Exports
// the note as a File Notes row and a Reporting Log row. Nothing is stored.
(function () {
  const E = window.RaEvents;
  const W = window.RaWorkbook;
  const X = window.ItpXlsx;
  const $ = (id) => document.getElementById(id);
  if (!E || !W || !X || !$('fn-form')) return;

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  // ---- the event picker ----
  const select = $('fn-event');
  const groups = { sead3: 'SEAD 3 and ISL: the employee’s reports to the FSO', company: 'Company reports under 32 CFR §117.8' };
  for (const [layer, label] of Object.entries(groups)) {
    const og = el('optgroup');
    og.label = label;
    for (const ev of E.EVENTS.filter((e) => e.layer === layer)) {
      const o = el('option', null, ev.label);
      o.value = ev.id;
      og.appendChild(o);
    }
    select.appendChild(og);
  }
  const other = el('option', null, E.FALLBACK.label);
  other.value = E.FALLBACK.id;
  select.appendChild(other);

  const ANSWER = { yes: 'Report: yes', duty: 'No report to file: a standing duty', inquiry: 'Not yet: preliminary inquiry first', consider: 'Not under these rules, but consider', settle: 'Settle before deciding', stop: 'Stop: emergency route' };
  const branchLabel = (id) => (E.BRANCHES.find((b) => b.id === id) || {}).label || '';

  // ---- prefill from the URL ----
  const params = new URLSearchParams(window.location.search);
  let outcome = null;
  let when = null;
  const answers = {};
  if (params.get('a')) for (const pair of params.get('a').split(',')) {
    const [k, v] = pair.split(':');
    if (k && v && E.QUESTIONS[k]) answers[k] = v;
  }
  if (params.get('event') && E.byId(params.get('event'))) {
    select.value = params.get('event');
    try {
      outcome = E.decide(select.value, answers);
    } catch {
      outcome = null;
    }
  }
  $('fn-case').value = W.caseId(1);
  $('fn-learned').value = /^\d{4}-\d{2}-\d{2}$/.test(params.get('learned') || '') ? params.get('learned') : W.today();
  function applyOutcome() {
    if (!outcome || outcome.kind === 'question') {
      $('fn-outcome').value = '';
      $('fn-recipients').value = '';
      $('fn-authority').value = select.value && select.value !== E.FALLBACK.id ? E.SITE_ROWS[select.value].authority : '';
      when = null;
      $('fn-branch').value = '';
    } else {
      const ev = outcome.event;
      $('fn-branch').value = ev.branches.map(branchLabel).join(' / ');
      $('fn-outcome').value = `${ANSWER[outcome.kind]}: ${outcome.title}`;
      $('fn-recipients').value = (outcome.recipients || []).filter((r) => r.kind !== 'practice').map((r) => `${r.who}${r.kind === 'conditional' ? ' (if required)' : ''}: ${r.via}`).join('\n');
      $('fn-authority').value = outcome.authority || '';
      when = outcome.when || null;
    }
    $('fn-clock').value = when && when.days ? String(when.days) : '';
    $('fn-basis').value = when && when.business ? 'business' : 'calendar';
    $('fn-when').textContent = when ? E.whenText(when) : 'Pick the event on the decision page for the rule’s clock, or enter the clock here.';
    const anchor = params.get('anchor');
    if (when && when.days && /^\d{4}-\d{2}-\d{2}$/.test(anchor || '')) $('fn-learned').value = anchor;
    computeDue();
  }
  select.addEventListener('change', () => {
    outcome = null;
    const ev = E.byId(select.value);
    if (ev && ev.ask({}).length === 0) outcome = E.decide(ev.id, {});
    applyOutcome();
  });

  // ---- due date: the same rule as the File Notes formula ----
  function computeDue() {
    const days = $('fn-clock').value;
    const due = W.dueDate($('fn-learned').value, { days: days === '' ? NaN : Number(days), business: $('fn-basis').value === 'business' });
    if (!$('fn-due').dataset.manual) $('fn-due').value = due;
    $('fn-alert').textContent = W.noteAlert({ caseId: $('fn-case').value || 'x', learned: $('fn-learned').value, clockDays: days, clockBasis: $('fn-basis').value, status: $('fn-status').value });
  }
  for (const id of ['fn-learned', 'fn-clock', 'fn-basis', 'fn-status']) $(id).addEventListener('change', computeDue);
  $('fn-due').addEventListener('change', () => {
    $('fn-due').dataset.manual = $('fn-due').value ? '1' : '';
  });
  applyOutcome();

  // ---- rows ----
  function noteRow() {
    const ev = E.byId(select.value);
    return [
      $('fn-case').value.trim(),
      $('fn-learned').value,
      $('fn-time').value,
      $('fn-how').value.trim(),
      $('fn-branch').value.trim(),
      ev ? ev.label : '',
      $('fn-outcome').value.trim(),
      $('fn-facts').value.trim(),
      $('fn-recipients').value.trim(),
      $('fn-clock').value === '' ? '' : Number($('fn-clock').value),
      $('fn-clock').value === '' ? '' : $('fn-basis').value,
      $('fn-submitted').value,
      $('fn-ref').value.trim(),
      $('fn-status').value,
      $('fn-prepared').value.trim(),
      $('fn-reviewed').value.trim(),
      $('fn-followup').value.trim(),
      $('fn-followup-due').value,
      $('fn-authority').value.trim(),
    ];
  }
  // File Notes has a formula column (Due by, L) and a formula column (Alert, P):
  // the writer fills formulas from the column definition, so the row holds
  // placeholders at those positions.
  function noteRowForSheet() {
    const r = noteRow();
    return [...r.slice(0, 11), '', ...r.slice(11, 14), '', ...r.slice(14)];
  }
  function logRowFromNote() {
    const ev = E.byId(select.value);
    return [
      String(log.length + 1),
      $('fn-learned').value,
      $('fn-case').value.trim(),
      ev ? ev.label : '',
      $('fn-recipients').value.trim().split('\n').map((l) => l.split(':')[0]).filter(Boolean).join('; '),
      $('fn-recipients').value.trim().split('\n').map((l) => l.split(':').slice(1).join(':').trim()).filter(Boolean).join('; '),
      when ? E.whenText(when) : '',
      $('fn-due').value,
      $('fn-submitted').value,
      $('fn-ref').value.trim(),
      $('fn-status').value,
      'No',
      $('fn-authority').value.trim(),
      $('fn-outcome').value.trim(),
      '',
    ];
  }

  // ---- buttons ----
  const log = []; // [noteRow, logRow] pairs for this session
  let exported = true;
  $('fn-print').addEventListener('click', () => {
    document.body.classList.add('ra-printing');
    window.print();
    setTimeout(() => document.body.classList.remove('ra-printing'), 500);
  });
  function workbook(pairs, what) {
    return [
      { name: 'Read Me', notes: W.README(what) },
      W.sheet('log', pairs.map((p) => p[1])),
      W.sheet('notes', pairs.map((p) => p[0])),
    ];
  }
  $('fn-export').addEventListener('click', () => {
    X.download(X.buildWorkbook(workbook([[noteRowForSheet(), logRowFromNote()]], 'Export from the file note page: this note as a File Notes row and a Reporting Log row, with the same columns as the blank workbook.'), { title: 'FSO File Note', activeTab: 2 }), W.fileName('RA-file-note'));
  });
  $('fn-add').addEventListener('click', () => {
    log.push([noteRowForSheet(), logRowFromNote()]);
    exported = false;
    renderLog();
    $('fn-case').value = W.caseId(log.length + 1);
  });
  const tbody = $('fn-log');
  function renderLog() {
    tbody.textContent = '';
    log.forEach(([n, r], i) => {
      const tr = el('tr');
      for (const v of [n[0], n[1], n[5], n[6], r[7], n[14]]) tr.appendChild(el('td', null, String(v)));
      const td = el('td');
      const rm = el('button', 'itp-remove', 'Remove');
      rm.type = 'button';
      rm.setAttribute('aria-label', `Remove note ${n[0]}`);
      rm.addEventListener('click', () => {
        log.splice(i, 1);
        renderLog();
      });
      td.appendChild(rm);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    $('fn-export-log').disabled = $('fn-clear').disabled = log.length === 0;
    $('fn-count').textContent = log.length ? `${log.length} note${log.length > 1 ? 's' : ''} in this session.` : 'No notes yet.';
  }
  $('fn-export-log').addEventListener('click', () => {
    X.download(X.buildWorkbook(workbook(log, 'Export from the file note page: this session’s notes as File Notes rows and Reporting Log rows, with the same columns as the blank workbook.'), { title: 'FSO File Notes', activeTab: 2 }), W.fileName('RA-file-notes'));
    exported = true;
  });
  $('fn-clear').addEventListener('click', () => {
    if (window.confirm('Clear every note in this session’s log?')) {
      log.length = 0;
      renderLog();
    }
  });
  W.guardUnsaved(() => !exported);
})();
