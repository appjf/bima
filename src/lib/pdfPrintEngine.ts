/**
 * Utility for printing documents and exporting cleanly as PDF in SIMBG.OS DPUPR Garut.
 * Handles printable HTML formatting, Kop Surat DPUPR Garut, and triggers print/PDF dialog.
 */

export const triggerPdfPrint = (elementId?: string, documentTitle: string = 'Daftar_Simak_SIMBG_DPUPR_Garut') => {
  if (elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      // Clean up React's className to standard HTML class, and unhide root elements
      let rawHtml = el.innerHTML;
      let cleanHtml = rawHtml
        .replace(/className=/g, 'class=')
        .replace(/hidden print:block/g, 'block')
        .replace(/\bhidden\b/g, 'block');

      // Try opening a new print window for maximum compatibility
      const printWin = window.open('', '_blank', 'width=950,height=1000,scrollbars=yes');
      
      if (printWin) {
        printWin.document.open();
        printWin.document.write(`
          <!DOCTYPE html>
          <html lang="id">
            <head>
              <title>${documentTitle}</title>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page {
                  size: A4 portrait;
                  margin: 10mm 12mm 10mm 12mm;
                }
                body {
                  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  background-color: #ffffff !important;
                  color: #0f172a !important;
                  margin: 0;
                  padding: 12px;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                }
                .break-inside-avoid {
                  break-inside: avoid !important;
                }
                @media print {
                  .no-print-bar {
                    display: none !important;
                  }
                  body {
                    padding: 0 !important;
                  }
                }
              </style>
            </head>
            <body>
              <div class="no-print-bar flex items-center justify-between bg-slate-900 text-white p-3 mb-4 rounded font-mono text-xs shadow-md">
                <div>
                  <strong class="text-amber-400 uppercase">SIMBG.OS // DAFTAR SIMAK VERIFIKASI (PDF PRINT)</strong>
                  <span class="block text-[11px] text-slate-300 font-sans mt-0.5">
                    Klik 'CETAK / SIMPAN PDF' di kanan jika dialog cetak browser belum terbuka otomatis.
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <button 
                    onclick="window.print()" 
                    style="background:#059669; color:white; padding:8px 16px; border:none; font-weight:bold; font-size:12px; cursor:pointer; font-family:monospace; text-transform:uppercase;"
                  >
                    🖨️ CETAK / SIMPAN PDF
                  </button>
                  <button 
                    onclick="window.close()" 
                    style="background:#475569; color:white; padding:8px 12px; border:none; font-weight:bold; font-size:12px; cursor:pointer; font-family:monospace; text-transform:uppercase;"
                  >
                    TUTUP
                  </button>
                </div>
              </div>

              <div id="print-content-wrapper">
                ${cleanHtml}
              </div>

              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
        return;
      }
    }
  }

  // Fallback direct window.print()
  window.print();
};
