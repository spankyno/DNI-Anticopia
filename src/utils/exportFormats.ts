import JSZip from 'jszip';
import { exportDocumentsToPdf } from './pdfExport';
import { sanitizeFileName, uniqueName } from './fileValidation';

export type ExportFormatType = 
  | 'png'
  | 'jpg_high'
  | 'jpg_compact'
  | 'webp'
  | 'pdf_id1'
  | 'pdf_a4'
  | 'pdf_original'
  | 'zip_bundle';

export interface MultiExportOptions {
  dataUrl: string;
  filenameBase: string;
  format: ExportFormatType;
  allDocsDataUrls?: { name: string; dataUrl: string }[];
}

/**
 * Converts a dataURL image to a specific image MIME type and quality via Canvas
 */
export async function convertDataUrlToFormat(
  dataUrl: string,
  targetMime: 'image/png' | 'image/jpeg' | 'image/webp',
  quality = 0.95
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context failed'));
        return;
      }

      // If exporting to JPEG, draw white background first to avoid black transparency
      if (targetMime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('toBlob failed'));
            return;
          }
          const convertedDataUrl = canvas.toDataURL(targetMime, quality);
          resolve({ blob, dataUrl: convertedDataUrl });
        },
        targetMime,
        quality
      );
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Triggers a browser download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Main multi-format export dispatcher
 */
export async function exportInFormat({
  dataUrl,
  filenameBase,
  format,
  allDocsDataUrls = [],
}: MultiExportOptions): Promise<void> {
  const cleanBase = sanitizeFileName(filenameBase.replace(/\.[^/.]+$/, ''), 'documento-protegido');

  switch (format) {
    case 'png': {
      const { blob } = await convertDataUrlToFormat(dataUrl, 'image/png');
      downloadBlob(blob, `${cleanBase}-anticopia.png`);
      break;
    }

    case 'jpg_high': {
      const { blob } = await convertDataUrlToFormat(dataUrl, 'image/jpeg', 0.95);
      downloadBlob(blob, `${cleanBase}-anticopia-hq.jpg`);
      break;
    }

    case 'jpg_compact': {
      const { blob } = await convertDataUrlToFormat(dataUrl, 'image/jpeg', 0.72);
      downloadBlob(blob, `${cleanBase}-anticopia-web.jpg`);
      break;
    }

    case 'webp': {
      const { blob } = await convertDataUrlToFormat(dataUrl, 'image/webp', 0.92);
      downloadBlob(blob, `${cleanBase}-anticopia.webp`);
      break;
    }

    case 'pdf_id1': {
      await exportDocumentsToPdf({
        dataUrls: [dataUrl],
        filename: `${cleanBase}-dni-85x54mm.pdf`,
        mode: 'id1_standard',
      });
      break;
    }

    case 'pdf_a4': {
      await exportDocumentsToPdf({
        dataUrls: [dataUrl],
        filename: `${cleanBase}-a4-oficial.pdf`,
        mode: 'a4_centered',
      });
      break;
    }

    case 'pdf_original': {
      await exportDocumentsToPdf({
        dataUrls: [dataUrl],
        filename: `${cleanBase}-escala-original.pdf`,
        mode: 'original_fit',
      });
      break;
    }

    case 'zip_bundle': {
      const zip = new JSZip();

      // If batch docs provided, zip all docs in batch!
      if (allDocsDataUrls.length > 1) {
        const usedNames = new Set<string>();
        for (let i = 0; i < allDocsDataUrls.length; i++) {
          const item = allDocsDataUrls[i];
          // Nombre saneado y único: evita rutas con "../" y que dos archivos
          // con el mismo nombre se sobrescriban dentro del ZIP.
          const itemBase = uniqueName(
            sanitizeFileName(item.name.replace(/\.[^/.]+$/, ''), `doc-${i + 1}`),
            usedNames
          );
          const pngRes = await convertDataUrlToFormat(item.dataUrl, 'image/png');
          const webpRes = await convertDataUrlToFormat(item.dataUrl, 'image/webp', 0.9);
          const jpgRes = await convertDataUrlToFormat(item.dataUrl, 'image/jpeg', 0.9);

          zip.file(`${itemBase}-protegido.png`, pngRes.blob);
          zip.file(`${itemBase}-protegido.webp`, webpRes.blob);
          zip.file(`${itemBase}-protegido.jpg`, jpgRes.blob);
        }
      } else {
        // Single document multi-format package
        const png = await convertDataUrlToFormat(dataUrl, 'image/png');
        const webp = await convertDataUrlToFormat(dataUrl, 'image/webp', 0.92);
        const jpgHq = await convertDataUrlToFormat(dataUrl, 'image/jpeg', 0.95);
        const jpgWeb = await convertDataUrlToFormat(dataUrl, 'image/jpeg', 0.72);

        zip.file(`${cleanBase}-anticopia.png`, png.blob);
        zip.file(`${cleanBase}-anticopia.webp`, webp.blob);
        zip.file(`${cleanBase}-anticopia-hq.jpg`, jpgHq.blob);
        zip.file(`${cleanBase}-anticopia-web-compacto.jpg`, jpgWeb.blob);
        zip.file(
          'README-SEGURIDAD.txt',
          `DOCUMENTO PROTEGIDO CON DNI ANTICOPIA\n` +
          `=======================================\n` +
          `Este documento ha sido generado con marcas de agua onduladas y censura de datos sensibles.\n` +
          `Recomendaciones de Policía Nacional e INCIBE aplicadas.\n` +
          `Procesamiento 100% local en cliente. No válido para créditos ni contrataciones fraudulentas.\n`
        );
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${cleanBase}-pack-completo.zip`);
      break;
    }
  }
}
