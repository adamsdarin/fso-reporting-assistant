// Explicit source mappings. No guessed search-result URLs and no network calls.
// Copied from the FSO ITPM Assistant (itp-citation-links.js); the build and the
// pages use linkHtml()/apply() to turn citations into links to the official texts.
(function (root) {
  const CFR = 'https://www.ecfr.gov/current/title-32/subtitle-A/chapter-I/subchapter-D/part-117';
  const SEAD3 = 'https://www.dni.gov/files/NCSC/documents/Regulations/SEAD-3-Reporting-U.pdf';
  const ISL = 'https://www.dcsa.mil/Portals/128/Documents/CTP/tools/ISL2021-02_SEAD-3_052024_v2.pdf';
  const ISE = 'https://fsotools.ai/sources/dcsa-ise-2026-10-06.pptx';
  const PVMS = 'https://fsotools.ai/sources/pvms-appendix-c-2025-05.pdf';
  const VOI = 'https://www.dcsa.mil/Portals/128/Documents/CTP/tools/260930%20VOI%20Newsletter.pdf';
  const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const rules = [
    [/\b(?:DCSA\s+)?DAAPM\b/g, 'https://www.dcsa.mil/Systems-Applications/National-Industrial-Security-System-NISS/'],
    [/\b(?:E\.O\.|Executive Order)\s*13587\b/g, 'https://www.govinfo.gov/app/details/DCPD-201100732'],
    [/\bNational Insider Threat Policy and Minimum Standards\b/g, 'https://www.dni.gov/files/NCSC/documents/nittf/National_Insider_Threat_Policy.pdf'],
    [/(?:32\s+CFR\s*)?§{1,2}\s*117\.\d+(?:\([a-z0-9]+\))*(?:[–-]\([a-z0-9]+\))*/g, m => { const n=m.match(/117\.\d+/)[0]; const p=m.match(/117\.\d+(?:\([a-z0-9]+\))*/)[0]; return `${CFR}/section-${n}#p-${p}`; }],
    [/\b(?:32\s+CFR\s+)?Part\s+117\b|\bNISPOM\b/g, CFR],
    [/\b(?:DCSA\s+)?ISL\s*2021-02\b/g, ISL],
    [/\bSEAD[ -]3\b/g, SEAD3],
    [/\bSEAD[ -]4\b/g, 'https://www.dni.gov/files/NCSC/documents/Regulations/SEAD-4-Adjudicative-Guidelines-U.pdf'],
    [/\bDFARS\s+252\.204-7012(?:\([a-z0-9]+\))*/g, 'https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting.'],
    [/\bDoDM\s+5220\.32,?\s+(?:Volume|Vol\.)\s*1\b/g, 'https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/522032v1.PDF'],
    [/\bDoDM\s+5220\.32,?\s+(?:Volume|Vol\.)\s*2\b/g, 'https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/522032v2.PDF'],
    [/\bDoDM\s+5105\.21,?\s+(?:Volume|Vol\.)\s*3\b/g, 'https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/510521m_vol3.pdf'],
    [/\bDoDM\s+5205\.07\b/g, 'https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/520507m1.PDF'],
    [/\bDoDI\s+5205\.11\b/g, 'https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodi/520511p.pdf'],
    [/\bDoDM\s+5200\.02\b/g, 'https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/520002m.PDF'],
    [/\bExecutive Order\s+12968(?:,?\s*§4\.1)?/g, 'https://www.archives.gov/federal-register/codification/executive-order/12968.html'],
    [/\b18\s+U\.S\.C\.\s*§?\s*1001\b/g, 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title18-section1001&num=0&edition=prelim'],
    [/\b(?:DCSA\s+)?Industry Stakeholder Engagement,?\s+October 6, 2026(?:,?\s+slides?\s+[\d, –-]+)?/g, ISE],
    [/\b(?:October(?: 6,)?(?: 2026)? ISE|Oct 2026 ISE Slide Deck [–-] Final)(?:,?\s+slides?\s+[\d, –-]+)?/g, ISE],
    [/\b(?:DCSA\s+)?September 2026 (?:Voice of Industry|VOI)(?:,?\s+pp?\.\s*[\d, –-]+)?/g, VOI],
    [/\b(?:Federal Personnel Vetting Management Standards \(PVMS\),\s*)?(?:PVMS,?\s*)?Appendix C(?:, Version 2 \(May 2, 2025\))?(?:\s+§{1,2}[A-F](?:\.\d+)?(?:[–-][A-F])?)?/g, PVMS],
    [/\bPVMS\b/g, PVMS],
    [/\bGAO-26-108838\b|GAO, February 2026/g, 'https://www.gao.gov/products/gao-26-108838'],
    [/\bGAO-26-107100\b/g, 'https://www.gao.gov/products/gao-26-107100'],
    [/\bPAC, FY2026-Q2\b/g, 'https://assets.performance.gov/files/QPR_Legacy_Metrics_(FY26-Q2).pdf'],
    [/\bDD Form 254 Instructions\b/g, 'https://www.esd.whs.mil/Portals/54/Documents/DD/forms/dd/dd0254-Inst.pdf'],
    [/\bFederal Personnel Vetting Guidelines\b/g, 'https://www.odni.gov/files/NCSC/documents/Regulations/Federal_Personnel_Vetting_Guidelines_10FEB2022-15Jul22.pdf'],
  ];
  function linkText(text, context='') {
    // Find matches before inserting markup so added URLs cannot be matched again.
    const matches=[];
    const contextual = /reporting\/(?:government|industry)/.test(context) ? [
      [/§{1,2}[D-H](?:\.\d+)*(?:\([a-z0-9]+\))*(?:[–-][D-H])?/g, SEAD3],
      [/Appendix A(?:\.\d+)?(?:[–-]\d+)?/g, SEAD3],
      [/\bISL(?:\s+(?:Table\s+\d|pp?\.\s*\d+(?:[–-]\d+)?))?/g, ISL],
    ] : [];
    const pvq = /public-trust/.test(context) ? [[/§\d{2}\b/g, PVMS]] : [];
    const slides = /october-2026|security-reviews/.test(context) ? [[/\bslides?\s+\d+(?:[–-]\d+)?/g, ISE]] : [];
    for (const [re,url] of [...rules,...contextual,...pvq,...slides]) {
      re.lastIndex=0;
      for(const m of text.matchAll(re)) {
        const start=m.index,end=start+m[0].length;
        if(matches.some(x=>start<x.end && end>x.start))continue;
        matches.push({start,end,label:m[0],url:typeof url==='function'?url(m[0]):url});
      }
    }
    matches.sort((a,b)=>a.start-b.start);
    let cursor=0,out='';
    for(const m of matches){out+=text.slice(cursor,m.start)+`<a class="source-link" href="${esc(m.url)}">${m.label}</a>`;cursor=m.end;}
    return out+text.slice(cursor);
  }
  function linkHtml(html, context='') {
    // Preserve tags/attributes, complete raw-text elements, existing anchors,
    // and controls. Visible prose and citation-bearing headings get links.
    const tokens=html.match(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<textarea\b[^>]*>[\s\S]*?<\/textarea\s*>|<[^>]+>|[^<]+|</gi) || [];
    const stack=[];
    const blocked=new Set(['a','head','script','style','textarea','button','select','option','label']);
    return tokens.filter(x=>x!==undefined).map(token=>{
      if(!token)return token;
      if(token[0]==='<'){
        if(/^<!--|^<(script|style|textarea)\b/i.test(token))return token;
        const close=token.match(/^<\/([\w-]+)/);
        const open=token.match(/^<([\w-]+)/);
        if(close){const i=stack.lastIndexOf(close[1].toLowerCase());if(i>=0)stack.splice(i);}
        else if(open&&!/\/>$/.test(token)&&!/^<(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(token))stack.push(open[1].toLowerCase());
        return token;
      }
      return stack.some(t=>blocked.has(t))?token:linkText(token,context);
    }).join('');
  }
  function apply(element, text, context='') { element.innerHTML=linkText(esc(text),context); }
  const api={CFR,SEAD3,ISL,ISE,PVMS,VOI,linkText,linkHtml,apply};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.FsoSources=api;
})(typeof window!=='undefined'?window:globalThis);
