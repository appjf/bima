import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Utility for printing documents and exporting cleanly as PDF in SIMBG.OS DPUPR Garut.
 * Handles printable HTML formatting, Kop Surat DPUPR Garut, and triggers print/PDF dialog.
 */

export const exportToPdf = async (elementId: string, filename: string = 'document.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Temporarily make it visible for html2canvas
  const originalDisplay = element.style.display;
  const originalPosition = element.style.position;
  const originalVisibility = element.style.visibility;
  const originalClassName = element.className;
  const originalZIndex = element.style.zIndex;
  const originalTop = element.style.top;
  const originalLeft = element.style.left;
  
  // Clone the node to avoid messing up the UI during generation? 
  // html2canvas is better at rendering the actual DOM node. We'll just move it offscreen.
  element.style.display = 'block';
  element.style.position = 'absolute';
  element.style.visibility = 'visible';
  element.style.zIndex = '-9999';
  element.style.top = '0';
  element.style.left = '0';
  // Strip hidden classes
  element.className = element.className.replace(/\bhidden\b/g, '').replace(/\bprint:block\b/g, 'block');

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution for better text clarity
      useCORS: true,
      logging: false,
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // F4 size in mm: 215 x 330
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [215, 330] 
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    const pageHeight = pdf.internal.pageSize.getHeight();
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    // Restore original styles
    element.style.display = originalDisplay;
    element.style.position = originalPosition;
    element.style.visibility = originalVisibility;
    element.style.zIndex = originalZIndex;
    element.style.top = originalTop;
    element.style.left = originalLeft;
    element.className = originalClassName;
  }
};

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
              <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
              <style>
                @page {
                  size: 215mm 330mm; /* F4 size */
                  margin: 5mm 5mm 5mm 5mm;
                }
                body {
                  font-family: "Times New Roman", Times, serif;
                  background-color: #ffffff !important;
                  color: #000000 !important;
                  margin: 0;
                  padding: 0;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                }
                td, th {
                  border: 1px solid black !important;
                  padding: 2px 4px !important;
                }
                .no-border td, .no-border th {
                  border: none !important;
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
                  <strong class="text-amber-400 uppercase">SIMBG.OS // DOCUMENT EXPORT (F4)</strong>
                  <span class="block text-[11px] text-slate-300 font-sans mt-0.5">
                    Gunakan CETAK untuk print fisik atau DOWNLOAD PDF untuk export langsung.
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <button 
                    onclick="downloadPdf()" 
                    id="btn-download-pdf"
                    style="background:#0284c7; color:white; padding:8px 16px; border:none; font-weight:bold; font-size:12px; cursor:pointer; font-family:monospace; text-transform:uppercase;"
                  >
                    📄 DOWNLOAD PDF (F4)
                  </button>
                  <button 
                    onclick="window.print()" 
                    style="background:#059669; color:white; padding:8px 16px; border:none; font-weight:bold; font-size:12px; cursor:pointer; font-family:monospace; text-transform:uppercase;"
                  >
                    🖨️ CETAK (PRINT)
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
                async function downloadPdf() {
                  const btn = document.getElementById('btn-download-pdf');
                  const originalText = btn.innerText;
                  btn.innerText = '⏳ MEMPROSES PDF...';
                  btn.disabled = true;

                  try {
                    const { jsPDF } = window.jspdf;
                    const element = document.getElementById('print-content-wrapper');
                    
                    const canvas = await html2canvas(element, {
                      scale: 2,
                      useCORS: true,
                      logging: false
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                      orientation: 'portrait',
                      unit: 'mm',
                      format: [215, 330] // F4 format
                    });

                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    
                    let heightLeft = pdfHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft > 0) {
                      position = heightLeft - pdfHeight;
                      pdf.addPage();
                      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                      heightLeft -= pageHeight;
                    }

                    pdf.save('${documentTitle}.pdf');
                  } catch(e) {
                    alert('Gagal mengekspor PDF: ' + e.message);
                  } finally {
                    btn.innerText = originalText;
                    btn.disabled = false;
                  }
                }

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
