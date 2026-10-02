import { PDFDocument } from 'pdf-lib';

export interface ExportPdfOptions {
  dataUrls: string[];
  filename?: string;
  mode?: 'id1_standard' | 'original_fit' | 'a4_centered';
}

/**
 * Creates and downloads a high-fidelity PDF directly in the browser using pdf-lib.
 */
export async function exportDocumentsToPdf({
  dataUrls,
  filename = 'documento-protegido-anticopia.pdf',
  mode = 'original_fit',
}: ExportPdfOptions): Promise<void> {
  if (!dataUrls.length) return;

  // Sin metadatos: pdf-lib por defecto escribe Producer/Creator ("pdf-lib") y fechas de
  // creación/modificación. Se desactiva para no dejar rastro de herramienta ni de fecha.
  const pdfDoc = await PDFDocument.create({ updateMetadata: false });

  // 1 mm = 2.83464567 points in PDF coordinate space
  const MM_TO_PT = 2.83464567;
  const ID1_WIDTH_PT = 85.60 * MM_TO_PT; // ~242.64 pt
  const ID1_HEIGHT_PT = 53.98 * MM_TO_PT; // ~153.01 pt
  const A4_WIDTH_PT = 595.28;
  const A4_HEIGHT_PT = 841.89;

  for (const dataUrl of dataUrls) {
    const pngImageBytes = await fetch(dataUrl).then((res) => res.arrayBuffer());
    const embeddedImage = await pdfDoc.embedPng(pngImageBytes);
    const { width: imgW, height: imgH } = embeddedImage;

    if (mode === 'id1_standard') {
      // Create exact ID-1 card page (horizontal orientation)
      const page = pdfDoc.addPage([ID1_WIDTH_PT, ID1_HEIGHT_PT]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: ID1_WIDTH_PT,
        height: ID1_HEIGHT_PT,
      });
    } else if (mode === 'a4_centered') {
      // Place centered on standard A4 page with clean margins
      const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
      const maxW = A4_WIDTH_PT - 60;
      const maxH = A4_HEIGHT_PT - 80;
      const scale = Math.min(maxW / imgW, maxH / imgH, 1);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = (A4_WIDTH_PT - drawW) / 2;
      const drawY = (A4_HEIGHT_PT - drawH) / 2;

      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });
    } else {
      // Original size fit
      const page = pdfDoc.addPage([imgW, imgH]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: imgW,
        height: imgH,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
