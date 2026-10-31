// Minimal .xlsx writer for the FSO Reporting Assistant. Copied unchanged
// (apart from this header) from src/assets/itp-xlsx.js in the FSO ITPM
// Assistant repository (adamsdarin/fso-itpm-assistant, same owner), so both
// products write identical workbook parts and their Reporting Log rows paste
// across. Keep the body byte-identical to the original: fix bugs there first.
// The global stays `ItpXlsx` for the same reason.
//
// No library and no network: it builds the SpreadsheetML parts as strings
// and packs them into an uncompressed ZIP in memory. Every workbook the tools
// make (the blank one and each export) goes through buildWorkbook(), so their
// columns, widths, styles, formulas and drop-down lists always match and rows
// can be copied from an export and pasted into the blank workbook.
// Sheet definition: { name, columns: [{ header, width, type, list, formula }],
//   rows: [[value, ...]], blankRows, notes, highlight }
//   type     'text' (default), 'date' (value 'YYYY-MM-DD'), 'number', 'wrap'
//   list     allowed values, written as an Excel drop-down
//   formula  (rowNumber) => formula text without '=', for calculated columns
//   notes    a plain read-me sheet: an array of lines instead of columns
//
// A form-style sheet (cells placed anywhere, merged ranges) is
//   { name, grid: true, cols: [widths], rows: [{ ht, cells: [{ c, v, f, s, date }] }],
//     merges: ['A1:D1'], lists: [{ sqref, values }], cf: [{ sqref, rules: [[formula, dxf]] }] }
//   c is the column letter; s a style name from S below; f a formula without
//   '='; date: true writes v ('YYYY-MM-DD') as an Excel date.
(function (root) {
  'use strict';

  const enc = new TextEncoder();
  const xml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

  // ---- CRC-32 and a store-only ZIP ----
  const CRC = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    CRC[n] = c >>> 0;
  }
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function zip(files) {
    const chunks = [];
    const central = [];
    let offset = 0;
    // Fixed DOS timestamp (2026-01-01 00:00) so identical content gives identical bytes.
    const time = 0;
    const date = ((2026 - 1980) << 9) | (1 << 5) | 1;
    for (const [name, text] of files) {
      const nameBytes = enc.encode(name);
      const data = enc.encode(text);
      const crc = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0x0800, true); // UTF-8 names
      local.setUint16(8, 0, true); // stored
      local.setUint16(10, time, true);
      local.setUint16(12, date, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, nameBytes.length, true);
      local.setUint16(28, 0, true);
      const head = new DataView(new ArrayBuffer(46));
      head.setUint32(0, 0x02014b50, true);
      head.setUint16(4, 20, true);
      head.setUint16(6, 20, true);
      head.setUint16(8, 0x0800, true);
      head.setUint16(10, 0, true);
      head.setUint16(12, time, true);
      head.setUint16(14, date, true);
      head.setUint32(16, crc, true);
      head.setUint32(20, data.length, true);
      head.setUint32(24, data.length, true);
      head.setUint16(28, nameBytes.length, true);
      head.setUint32(42, offset, true);
      chunks.push(new Uint8Array(local.buffer), nameBytes, data);
      central.push(new Uint8Array(head.buffer), nameBytes);
      offset += 30 + nameBytes.length + data.length;
    }
    const centralSize = central.reduce((n, c) => n + c.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);
    const all = [...chunks, ...central, new Uint8Array(end.buffer)];
    const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
    let p = 0;
    for (const c of all) {
      out.set(c, p);
      p += c.length;
    }
    return out;
  }

  // ---- cells ----
  const colName = (i) => {
    let s = '';
    for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
    return s;
  };
  // Excel's day number for a 'YYYY-MM-DD' date (1900 date system).
  function serial(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
    if (!m) return null;
    return (Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000;
  }
  // Style ids, in the order of cellXfs in STYLES below.
  const S = { plain: 0, header: 1, date: 2, wrap: 3, calcDate: 4, calcText: 5, title: 6, note: 7, number: 8, titleBar: 9, section: 10, label: 11, input: 12, resultText: 13, resultNum: 14, body: 15, bodyBold: 16, calcNum: 17, inputDate: 18 };
  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd"/><numFmt numFmtId="165" formatCode="0.0"/></numFmts>
<fonts count="8"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="14"/><color rgb="FF13263F"/><name val="Calibri"/><family val="2"/></font><font><i/><sz val="11"/><color rgb="FF4D5B6B"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="12"/><color rgb="FF13263F"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FF13263F"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="12"/><color rgb="FF0F5A3A"/><name val="Calibri"/><family val="2"/></font></fonts>
<fills count="7"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF13263F"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF2F6"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE4EFFF"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF4F6F9"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3F4EA"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFDDE3EA"/></left><right style="thin"><color rgb="FFDDE3EA"/></right><top style="thin"><color rgb="FFDDE3EA"/></top><bottom style="thin"><color rgb="FFDDE3EA"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="19">
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
<xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="5" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="6" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="7" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="165" fontId="7" fillId="6" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="left"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="165" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" horizontal="left"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" horizontal="left"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="3"><dxf><font><b/><color rgb="FF8A1F14"/></font><fill><patternFill><bgColor rgb="FFFBE3E0"/></patternFill></fill></dxf><dxf><font><color rgb="FF6B4700"/></font><fill><patternFill><bgColor rgb="FFFFF3D6"/></patternFill></fill></dxf><dxf><font><color rgb="FF0F5A3A"/></font><fill><patternFill><bgColor rgb="FFE3F4EA"/></patternFill></fill></dxf></dxfs>
</styleSheet>`;

  const textCell = (ref, s, v) => (v === '' || v == null ? `<c r="${ref}" s="${s}"/>` : `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`);

  function cell(col, ci, rowNum, value) {
    const ref = `${colName(ci)}${rowNum}`;
    if (col.formula) return `<c r="${ref}" s="${col.type === 'date' ? S.calcDate : S.calcText}"><f>${xml(col.formula(rowNum))}</f></c>`;
    if (col.type === 'date') {
      const n = serial(value);
      if (n !== null) return `<c r="${ref}" s="${S.date}"><v>${n}</v></c>`;
      return textCell(ref, S.date, value);
    }
    if (col.type === 'number' && value !== '' && value != null && Number.isFinite(Number(value))) return `<c r="${ref}" s="${S.number}"><v>${Number(value)}</v></c>`;
    return textCell(ref, col.type === 'wrap' ? S.wrap : S.plain, value);
  }

  function notesSheet(sheet) {
    const rows = sheet.notes.map((line, i) => {
      const r = i + 1;
      const s = i === 0 ? S.title : line.startsWith('  ') ? S.note : S.plain;
      return `<row r="${r}">${line === '' ? '' : textCell(`A${r}`, s, line.trim())}</row>`;
    });
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><cols><col min="1" max="1" width="120" customWidth="1"/></cols><sheetData>${rows.join('')}</sheetData><pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;
  }

  function tableSheet(sheet) {
    const cols = sheet.columns;
    const last = colName(cols.length - 1);
    const count = Math.max(sheet.rows.length, sheet.blankRows || 0);
    const lastRow = count + 1;
    const header = `<row r="1" ht="32" customHeight="1">${cols.map((c, i) => textCell(`${colName(i)}1`, S.header, c.header)).join('')}</row>`;
    const body = [];
    for (let i = 0; i < count; i++) {
      const values = sheet.rows[i] || [];
      body.push(`<row r="${i + 2}">${cols.map((c, ci) => cell(c, ci, i + 2, values[ci])).join('')}</row>`);
    }
    const widths = cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 16}" customWidth="1"/>`).join('');
    const lists = cols
      .map((c, i) => (c.list ? `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${colName(i)}2:${colName(i)}${Math.max(lastRow, 500)}"><formula1>"${xml(c.list.join(','))}"</formula1></dataValidation>` : ''))
      .filter(Boolean);
    // Rule priorities must be unique within a sheet.
    let priority = 0;
    const cf = (sheet.highlight || [])
      .map((h) => {
        const ci = cols.findIndex((c) => c.header === h.column);
        const range = `${colName(ci)}2:${colName(ci)}${Math.max(lastRow, 500)}`;
        // expr: [[formula for row 2, dxf], ...], applied down the column.
        if (h.expr) return `<conditionalFormatting sqref="${range}">${h.expr.map(([f, dxf]) => `<cfRule type="expression" dxfId="${dxf}" priority="${++priority}"><formula>${xml(f)}</formula></cfRule>`).join('')}</conditionalFormatting>`;
        return `<conditionalFormatting sqref="${range}">${h.rules.map(([text, dxf]) => `<cfRule type="containsText" dxfId="${dxf}" priority="${++priority}" operator="containsText" text="${xml(text)}"><formula>NOT(ISERROR(SEARCH("${xml(text)}",${colName(ci)}2)))</formula></cfRule>`).join('')}</conditionalFormatting>`;
      })
      .join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:${last}${lastRow}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${widths}</cols><sheetData>${header}${body.join('')}</sheetData><autoFilter ref="A1:${last}${lastRow}"/>${cf}${lists.length ? `<dataValidations count="${lists.length}">${lists.join('')}</dataValidations>` : ''}<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToHeight="0"/></worksheet>`;
  }

  function gridSheet(sheet) {
    let maxCol = 0;
    const rows = sheet.rows.map((row, i) => {
      const r = i + 1;
      const cells = (row.cells || []).map((c) => {
        const ci = c.c.charCodeAt(0) - 65;
        maxCol = Math.max(maxCol, ci);
        const ref = `${c.c}${r}`;
        const s = S[c.s || 'body'];
        if (s === undefined) throw new Error(`unknown style ${c.s}`);
        if (c.f) return `<c r="${ref}" s="${s}"><f>${xml(c.f)}</f></c>`;
        if (c.date && serial(c.v) !== null) return `<c r="${ref}" s="${s}"><v>${serial(c.v)}</v></c>`;
        if (typeof c.v === 'number') return `<c r="${ref}" s="${s}"><v>${c.v}</v></c>`;
        return textCell(ref, s, c.v);
      });
      return `<row r="${r}"${row.ht ? ` ht="${row.ht}" customHeight="1"` : ''}>${cells.join('')}</row>`;
    });
    const widths = sheet.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
    const merges = sheet.merges && sheet.merges.length ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '';
    let priority = 0;
    const cf = (sheet.cf || []).map((c) => `<conditionalFormatting sqref="${c.sqref}">${c.rules.map(([f, dxf]) => `<cfRule type="expression" dxfId="${dxf}" priority="${++priority}"><formula>${xml(f)}</formula></cfRule>`).join('')}</conditionalFormatting>`).join('');
    const lists = (sheet.lists || []).map((l) => `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${l.sqref}"><formula1>"${xml(l.values.join(','))}"</formula1></dataValidation>`);
    const pane = sheet.freeze ? `<pane ySplit="${sheet.freeze}" topLeftCell="A${sheet.freeze + 1}" activePane="bottomLeft" state="frozen"/>` : '';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:${colName(Math.max(maxCol, sheet.cols.length - 1))}${rows.length}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${widths}</cols><sheetData>${rows.join('')}</sheetData>${merges}${cf}${lists.length ? `<dataValidations count="${lists.length}">${lists.join('')}</dataValidations>` : ''}<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToHeight="0"/></worksheet>`;
  }

  // sheets: array of sheet definitions. Returns the .xlsx file as bytes.
  function buildWorkbook(sheets, meta) {
    const files = [];
    const n = sheets.length;
    files.push([
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
    ]);
    files.push([
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    ]);
    // No author or company in the file properties: only the title.
    files.push([
      'docProps/core.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml((meta && meta.title) || 'Insider Threat Program Workbook')}</dc:title></cp:coreProperties>`,
    ]);
    files.push([
      'docProps/app.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>FSOtools ITP workbook</Application></Properties>`,
    ]);
    const names = sheets
      .map((s, i) => (s.notes || s.grid ? '' : `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xml(s.name)}'!$A$1:$${colName(s.columns.length - 1)}$${Math.max(s.rows.length, s.blankRows || 0) + 1}</definedName>`))
      .join('');
    files.push([
      'xl/workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="${(meta && meta.activeTab) || 0}"/></bookViews><sheets>${sheets.map((s, i) => `<sheet name="${xml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>${names ? `<definedNames>${names}</definedNames>` : ''}<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
    ]);
    files.push([
      'xl/_rels/workbook.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ]);
    files.push(['xl/styles.xml', STYLES]);
    sheets.forEach((s, i) => files.push([`xl/worksheets/sheet${i + 1}.xml`, s.grid ? gridSheet(s) : s.notes ? notesSheet(s) : tableSheet(s)]));
    return zip(files);
  }

  // Offer bytes to the user as a download. A blob: URL never leaves the browser.
  function download(bytes, filename, type) {
    const blob = new Blob([bytes], { type: type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  root.ItpXlsx = { buildWorkbook, download, crc32, serial, colName, zip };
})(typeof window !== 'undefined' ? window : globalThis);
