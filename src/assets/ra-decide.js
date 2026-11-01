// The guided path (decide.html): Step 1 who or what, Step 2 the event, Step 3
// the clarifying questions, then the outcome card and the session reporting
// log. All content and rules come from ra-events.js; this file only renders.
// The session log lives only in this page and is gone when the tab closes.
(function () {
  const form = document.getElementById('rp-form');
  const out = document.getElementById('rp-result');
  const E = window.RaEvents;
  const W = window.RaWorkbook;
  const X = window.ItpXlsx;
  if (!form || !out || !E || !W || !X) return;

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  // Citations in text become links to the official texts (ra-citation-links.js).
  function reference(tag, text, cls) {
    const node = el(tag, cls);
    window.FsoSources.apply(node, text, 'reporting/industry');
    return node;
  }
  const radio = (name, value, labelText, help) => {
    const label = el('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    label.append(input, document.createTextNode(` ${labelText}`));
    if (help) label.appendChild(el('span', 'ra-branch-help', help));
    return label;
  };

  // ---- state: in memory only ----
  let branch = null;
  let current = null; // { event, answers }
  const sticky = {}; // answers reused within the session for dod and cdc
  const log = [];
  let anchors = {}; // per-outcome dates: { learned, anchor }

  // ---- Step 1 ----
  const step1 = el('fieldset', 'rc-q itp-trigger-group');
  const l1 = el('legend');
  l1.append(el('span', 'rc-num', '1'), document.createTextNode(' Who or what is this about?'));
  const o1 = el('div', 'rc-options');
  for (const b of E.BRANCHES) o1.appendChild(radio('branch', b.id, b.label, b.help));
  step1.append(l1, o1);
  form.appendChild(step1);

  // ---- Step 2 (rebuilt for each branch) ----
  const step2 = el('div');
  form.appendChild(step2);
  function renderStep2() {
    step2.textContent = '';
    if (!branch) return;
    const fs = el('fieldset', 'rc-q itp-trigger-group');
    const legend = el('legend');
    legend.append(el('span', 'rc-num', '2'), document.createTextNode(' What happened?'));
    fs.appendChild(legend);
    for (const g of E.groupsFor(branch)) {
      fs.appendChild(el('p', 'itp-ref', g));
      const opts = el('div', 'rc-options');
      for (const ev of E.eventsFor(branch).filter((e) => e.group === g)) opts.appendChild(radio('event', ev.id, ev.label));
      fs.appendChild(opts);
    }
    step2.appendChild(fs);
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'branch') {
      branch = e.target.value;
      current = null;
      renderStep2();
      render();
    } else if (e.target.name === 'event') {
      current = { event: E.byId(e.target.value), answers: {} };
      anchors = { learned: W.today(), anchor: '' };
      render();
      if (window.matchMedia('(max-width: 960px)').matches) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ---- Step 3 and the outcome ----
  function render() {
    out.textContent = '';
    if (!current) {
      out.appendChild(el('p', 'rc-progress', branch ? 'Pick what happened.' : 'Start with step 1.'));
      return;
    }
    const ev = current.event;
    const a = current.answers;
    const asked = ev.ask(a);
    // Answered questions, then the pending one.
    let o = null;
    for (const qid of asked) {
      const q = E.QUESTIONS[qid];
      const box = el('div', 'rc-q');
      const head = el('p', 'rc-verdict');
      head.append(el('span', 'rc-num', '3'), document.createTextNode(` ${q.q}`));
      box.appendChild(head);
      if (q.help) box.appendChild(reference('p', q.help, 'rc-help'));
      const opts = el('div', 'rc-options');
      for (const opt of q.options) {
        const label = radio(`ask-${qid}`, opt.v, opt.label);
        const input = label.querySelector('input');
        input.checked = a[qid] === opt.v;
        input.addEventListener('change', () => {
          // Later answers depend on earlier ones: drop them.
          const keep = {};
          for (const k of asked) {
            if (k === qid) break;
            keep[k] = a[k];
          }
          keep[qid] = opt.v;
          if (qid === 'dod' || qid === 'cdc') sticky[qid] = opt.v;
          current.answers = keep;
          render();
        });
        opts.appendChild(label);
      }
      box.appendChild(opts);
      out.appendChild(box);
      if (a[qid] == null) {
        // Offer the answer given earlier in this session, without choosing it.
        if (sticky[qid] && !a[qid]) box.appendChild(el('p', 'rc-help', `Earlier in this session you answered “${sticky[qid] === 'yes' ? 'Yes' : sticky[qid] === 'no' ? 'No' : 'Not sure'}”.`));
        break;
      }
      if (a[qid] === 'unsure' || (qid === 'danger' && a[qid] === 'yes') || (a[qid] === 'no' && q.no)) break;
    }
    o = E.decide(ev.id, a);
    if (o.kind === 'question') return;
    out.appendChild(outcomeCard(o));
  }

  const ANSWER = {
    yes: ['Yes', 'ra-answer-yes', ''],
    duty: ['No report to file: a standing duty', 'ra-answer-duty', ' itp-hold'],
    inquiry: ['Not yet: preliminary inquiry first', 'ra-answer-inquiry', ' itp-hold'],
    consider: ['Not under these rules, but consider…', 'ra-answer-consider', ' itp-consider'],
    settle: ['Settle this before deciding', 'ra-answer-settle', ' itp-hold'],
    stop: ['Stop: emergency route', 'ra-answer-stop', ' itp-stop'],
  };

  function outcomeCard(o) {
    const [answer, badge, cls] = ANSWER[o.kind];
    const card = el('div', `itp-result${cls}`);
    card.appendChild(el('h3', null, o.title));
    const dl = el('dl');
    const row = (k, node) => {
      dl.append(el('dt', null, k), node);
    };
    const dd = el('dd');
    dd.appendChild(el('span', `ra-answer ${badge}`, answer));
    row('Report?', dd);
    if (o.text) row('Why', reference('dd', o.text));
    if (o.recipients && o.recipients.length) {
      const ul = el('ul', 'ra-recipients');
      for (const r of o.recipients) {
        const li = el('li', r.kind === 'conditional' ? 'ra-conditional' : r.kind === 'practice' ? 'ra-practice' : '');
        li.appendChild(el('b', null, r.kind === 'conditional' ? `${r.who} (if required)` : r.kind === 'practice' ? `${r.who} (good practice)` : r.who));
        li.appendChild(reference('span', r.via));
        li.appendChild(reference('small', r.basis));
        ul.appendChild(li);
      }
      const d = el('dd');
      d.appendChild(ul);
      row('To whom', d);
    }
    if (o.when) {
      const d = el('dd');
      d.appendChild(reference('p', E.whenText(o.when)));
      if (o.when.note) d.appendChild(el('p', 'rc-help', o.when.note));
      if (o.when.days) {
        const due = el('p', 'ra-due');
        const label = el('label');
        label.append(document.createTextNode(`${E.ANCHOR_LABEL[o.when.from] || 'Date learned'}:`));
        const input = document.createElement('input');
        input.type = 'date';
        input.value = anchors.anchor || anchors.learned;
        const show = el('span');
        const update = () => {
          anchors.anchor = input.value;
          const dd2 = W.dueDate(input.value, o.when);
          show.textContent = dd2 ? ` Due by ${dd2}${o.when.business ? ' (business days; no holiday list)' : ''}.` : ' Enter the date to compute the due date.';
        };
        input.addEventListener('change', update);
        label.appendChild(input);
        due.append(label, show);
        update();
        d.appendChild(due);
      }
      row('By when', d);
    }
    if (o.include && o.include.length) {
      const d = el('dd');
      const ul = el('ul');
      for (const t of o.include) ul.appendChild(reference('li', t));
      d.appendChild(ul);
      row('What to include', d);
    }
    if (o.next && o.next.length) {
      const d = el('dd');
      const ul = el('ul');
      for (const t of o.next) ul.appendChild(reference('li', t));
      d.appendChild(ul);
      row('What to do next', d);
    }
    if (o.authority) row('Authority', reference('dd', o.authority));
    if (o.verified) row('Checked against', reference('dd', o.verified));
    const linksDd = el('dd', 'ra-links');
    const link = (href, text) => {
      const a = el('a', null, text);
      a.href = href;
      linksDd.appendChild(a);
    };
    if (o.links.site) link(o.links.site, 'This row on fsotools.ai');
    if (o.links.cfr) link(o.links.cfr, 'eCFR paragraph');
    if (o.links.sead3) link(o.links.sead3, 'SEAD 3 (ODNI)');
    if (o.links.isl) link(o.links.isl, 'ISL 2021-02 (DCSA)');
    if (o.links.dfars) link(o.links.dfars, 'DFARS 252.204-7012');
    if (o.links.itpm) link(o.links.itpm, 'FSO ITPM Assistant: Is this reportable?');
    row('Links', linksDd);
    card.appendChild(dl);
    card.appendChild(el('p', 'ra-prep', o.prep || 'A preparation aid, not a determination and not legal advice.'));
    if (o.kind !== 'stop') card.appendChild(logForm(o));
    return card;
  }

  // ---- the reporting log ----
  const STATUS_FOR = { yes: 'Open', duty: 'Open', inquiry: 'Open', consider: 'Not reportable', settle: 'Open' };
  function logRow(o, fields) {
    const req = (o.recipients || []).filter((r) => r.kind !== 'practice');
    return [
      fields.no,
      fields.learned,
      fields.subject,
      o.event.label,
      req.map((r) => r.who).join('; ') || (o.kind === 'consider' ? 'Internal record: FSO decision' : 'FSO / ITPSO'),
      req.map((r) => r.via).join('; '),
      o.when ? E.whenText(o.when) : '',
      fields.due,
      '',
      '',
      STATUS_FOR[o.kind] || 'Open',
      'No',
      o.authority || '',
      [o.kind === 'yes' ? '' : `${o.title}.`, fields.notes].filter(Boolean).join(' '),
      '',
    ];
  }

  function logForm(o) {
    const f = el('form', 'itp-log-form');
    f.setAttribute('autocomplete', 'off');
    f.appendChild(el('p', 'rc-verdict', o.kind === 'yes' ? 'Add to the reporting log' : 'Record the decision in the log'));
    const field = (label, input, hint) => {
      const l = el('label', 'itp-field');
      l.appendChild(el('span', null, label));
      l.appendChild(input);
      if (hint) l.appendChild(el('small', null, hint));
      f.appendChild(l);
      return input;
    };
    const mk = (type, value) => {
      const i = document.createElement('input');
      i.type = type;
      if (value) i.value = value;
      return i;
    };
    const no = field('Log no.', mk('text', String(log.length + 1)));
    const learned = field('Date learned', mk('date', anchors.learned));
    learned.addEventListener('change', () => {
      anchors.learned = learned.value;
    });
    const subject = field('Subject: internal case ID (optional)', mk('text', ''), 'Use an internal ID; a name belongs only in the company’s protected records. Leave blank for company-level reports.');
    const computed = o.when && o.when.days ? W.dueDate(anchors.anchor || anchors.learned, o.when) : '';
    const due = field('Due by', mk('date', computed), computed ? 'Computed from the clock above; change it if your CSA or procedure gives another date.' : 'No fixed clock in the rule: enter your company standard or the date the CSA gives.');
    const notes = document.createElement('textarea');
    field('Notes (optional)', notes, 'Facts only: no rumor, no diagnoses.');
    const add = el('button', 'btn btn-primary btn-sm', 'Add to log');
    add.type = 'submit';
    const note = el('a', 'btn btn-light btn-sm', 'Prepare the file note');
    note.href = noteUrl(o);
    const bar = el('div', 'itp-toolbar');
    bar.append(add, note);
    f.appendChild(bar);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      log.push(logRow(o, { no: no.value.trim(), learned: learned.value, subject: subject.value.trim(), due: due.value, notes: notes.value.trim() }));
      renderLog();
      add.textContent = 'Added';
      add.disabled = true;
    });
    return f;
  }

  // Hand the event, the answers and the dates to the file note page in the URL
  // (nothing typed by the user goes in it; the note page recomputes the outcome).
  function noteUrl(o) {
    const p = new URLSearchParams();
    p.set('event', o.event.id);
    p.set('a', Object.entries(current.answers).map(([k, v]) => `${k}:${v}`).join(','));
    if (anchors.learned) p.set('learned', anchors.learned);
    if (anchors.anchor) p.set('anchor', anchors.anchor);
    return `file-note.html?${p.toString()}`;
  }

  const tbody = document.getElementById('rp-log');
  const exportBtn = document.getElementById('rp-export');
  const clearBtn = document.getElementById('rp-clear');
  let exported = true;
  function renderLog() {
    tbody.textContent = '';
    log.forEach((r, i) => {
      const tr = el('tr');
      for (const v of [r[0], r[1], r[2], r[3], r[4], r[7]]) tr.appendChild(el('td', null, v));
      const st = el('td');
      const overdue = W.logOverdue({ due: r[7], status: r[10] });
      st.appendChild(el('span', `itp-status ${overdue ? 'itp-s-bad' : r[10] === 'Open' ? 'itp-s-warn' : 'itp-s-none'}`, overdue ? `${r[10]} (overdue)` : r[10]));
      tr.appendChild(st);
      const td = el('td');
      const rm = el('button', 'itp-remove', 'Remove');
      rm.type = 'button';
      rm.setAttribute('aria-label', `Remove log entry ${r[0]}`);
      rm.addEventListener('click', () => {
        log.splice(i, 1);
        renderLog();
      });
      td.appendChild(rm);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    exported = log.length === 0;
    exportBtn.disabled = clearBtn.disabled = log.length === 0;
    document.getElementById('rp-count').textContent = log.length ? `${log.length} entr${log.length > 1 ? 'ies' : 'y'} in this session.` : 'No entries yet.';
  }
  exportBtn.addEventListener('click', () => {
    const sheets = [{ name: 'Read Me', notes: W.README('Export from the reporting decision aid: the Reporting Log sheet, with the same columns as the Reporting Log sheet of the blank workbook (and of the FSO ITPM Assistant workbook).') }, W.sheet('log', log)];
    X.download(X.buildWorkbook(sheets, { title: 'FSO Reporting Log', activeTab: 1 }), W.fileName('RA-reporting-log'));
    exported = true;
  });
  clearBtn.addEventListener('click', () => {
    if (window.confirm('Clear every entry in this session’s log?')) {
      log.length = 0;
      renderLog();
    }
  });
  W.guardUnsaved(() => !exported);
  render();
})();
