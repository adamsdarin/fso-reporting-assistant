// The blank workbook download, made in the browser (button #ra-blank on every page).
(function () {
  const button = document.getElementById('ra-blank');
  if (!button || !window.ItpXlsx || !window.RaWorkbook) return;
  button.addEventListener('click', () => {
    const W = window.RaWorkbook;
    window.ItpXlsx.download(window.ItpXlsx.buildWorkbook(W.blankWorkbook(), { title: 'FSO Reporting Workbook' }), 'RA-workbook.xlsx');
  });
})();
