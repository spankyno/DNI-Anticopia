/**
 * Validación y saneado de archivos que entran y salen de la app.
 */

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB por archivo
export const MAX_FILES_PER_BATCH = 20;
export const MAX_IMAGE_PIXELS = 40_000_000; // 40 megapíxeles
export const MAX_IMAGE_SIDE = 10_000; // px

export type ImageKind = 'png' | 'jpeg' | 'webp';

export type FileRejection =
  | 'too_large'
  | 'empty'
  | 'unsupported'
  | 'corrupt'
  | 'dimensions';

/**
 * Detecta el formato REAL de la imagen leyendo su cabecera (magic bytes), sin fiarse
 * del tipo MIME ni de la extensión que declara el cliente.
 */
export async function sniffImageKind(file: Blob): Promise<ImageKind | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (
    head.length >= 8 &&
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 &&
    head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a
  ) {
    return 'png';
  }
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'jpeg';
  }
  if (
    head.length >= 12 &&
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && // RIFF
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50 // WEBP
  ) {
    return 'webp';
  }
  return null;
}

/** Comprobaciones previas a decodificar (tamaño y formato real). */
export async function precheckImageFile(file: File): Promise<FileRejection | null> {
  if (file.size === 0) return 'empty';
  if (file.size > MAX_FILE_BYTES) return 'too_large';
  const kind = await sniffImageKind(file);
  if (!kind) return 'unsupported';
  return null;
}

/** Comprobación posterior a decodificar (dimensiones razonables). */
export function checkImageDimensions(width: number, height: number): FileRejection | null {
  if (!width || !height) return 'corrupt';
  if (width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE) return 'dimensions';
  if (width * height > MAX_IMAGE_PIXELS) return 'dimensions';
  return null;
}

/**
 * Convierte un nombre arbitrario en un nombre de archivo seguro:
 * elimina separadores de ruta, caracteres de control y reservados, evita ".." y
 * nombres vacíos, y limita la longitud.
 */
export function sanitizeFileName(name: string, fallback = 'documento'): string {
  const cleaned = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f\\/:*?"<>|]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 100)
    .trim();
  return cleaned || fallback;
}

/** Devuelve un nombre no repetido dentro de `used` (añade -2, -3...) y lo registra. */
export function uniqueName(base: string, used: Set<string>): string {
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}-${i++}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}
