import { WatermarkConfig, RedactionBox } from '../types';

export interface RenderWatermarkOptions {
  imageSource: HTMLImageElement | HTMLCanvasElement;
  config: WatermarkConfig;
  redactions: RedactionBox[];
  targetWidth?: number;
  targetHeight?: number;
}

/**
 * High-performance 100% client-side anti-AI watermark & document protection processor.
 */
export async function renderProtectedDocument({
  imageSource,
  config,
  redactions,
  targetWidth,
  targetHeight,
}: RenderWatermarkOptions): Promise<{ canvas: HTMLCanvasElement; dataUrl: string }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create canvas 2D context');
  }

  const width = targetWidth || imageSource.width || 1200;
  const height = targetHeight || imageSource.height || 800;

  canvas.width = width;
  canvas.height = height;

  // 1. Draw base image
  ctx.drawImage(imageSource, 0, 0, width, height);

  // 2. Grayscale processing if enabled
  if (config.grayscale) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Perceptual luminance calculation
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Slight contrast boost to make document text crisp
      const contrastAdjusted = (gray - 128) * 1.08 + 128;
      const clamped = Math.min(255, Math.max(0, contrastAdjusted));
      data[i] = clamped;
      data[i + 1] = clamped;
      data[i + 2] = clamped;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // 3. Render Redactions / Censorship zones
  renderRedactions(ctx, redactions, width, height);

  // 4. Render Anti-AI Guilloché Isoline Curves
  if (config.guillocheCurves) {
    renderGuillocheCurves(ctx, config, width, height);
  }

  // 4.1 Steganographic Microprint (banknote micro-text security)
  if (config.steganographicMicroprint) {
    renderSteganographicMicroprint(ctx, config, width, height);
  }

  // 4.2 Moiré Anti-Aliasing Interference Grid
  if (config.moireInterference) {
    renderMoireInterference(ctx, config, width, height);
  }

  // 4.3 Micropunteado: símbolos «@» diminutos en clotoides desde el centro
  if (config.micropunteado) {
    renderMicropunteado(ctx, config, width, height);
  }

  // 5. Render Undulating Anti-AI Watermark Text & Wave Field
  renderUndulatingWatermark(ctx, config, width, height);

  // 5.1 Subtle Digital Water-Emboss Relief
  if (config.subtleEmboss) {
    renderSubtleEmboss(ctx, config, width, height);
  }

  // 6. Micro-noise / High-frequency latent interference
  if (config.microNoise) {
    renderMicroNoise(ctx, width, height, config.opacity);
  }

  // 7. Security Stamp Border (if enabled)
  if (config.stampBorder) {
    renderSecurityBorder(ctx, width, height, config.opacity);
  }

  const dataUrl = canvas.toDataURL('image/png', 0.95);
  return { canvas, dataUrl };
}

/**
 * Draws redaction boxes (Solid black bar, caution tape, or frosted blur)
 */
function renderRedactions(
  ctx: CanvasRenderingContext2D,
  redactions: RedactionBox[],
  width: number,
  height: number
) {
  for (const box of redactions) {
    const rx = (box.x / 100) * width;
    const ry = (box.y / 100) * height;
    const rw = (box.width / 100) * width;
    const rh = (box.height / 100) * height;

    ctx.save();

    if (box.style === 'solid_black') {
      // Solid deep black bar with subtle border and bold text
      ctx.fillStyle = '#090d16';
      ctx.fillRect(rx, ry, rw, rh);

      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = Math.max(1.5, Math.min(rw, rh) * 0.05);
      ctx.strokeRect(rx, ry, rw, rh);

      // Centered label
      const fontSize = Math.max(10, Math.min(rh * 0.45, rw * 0.15, 20));
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(box.label ? box.label.toUpperCase() : 'CENSURADO', rx + rw / 2, ry + rh / 2);
    } else if (box.style === 'caution_tape') {
      // Yellow / Black caution hazard diagonal stripes
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();

      ctx.fillStyle = '#facc15';
      ctx.fillRect(rx, ry, rw, rh);

      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = Math.max(6, rh * 0.25);
      const stripeSpacing = ctx.lineWidth * 2;
      const diagonalDist = rw + rh;

      for (let offset = -rh; offset < diagonalDist; offset += stripeSpacing) {
        ctx.beginPath();
        ctx.moveTo(rx + offset, ry);
        ctx.lineTo(rx + offset + rh, ry + rh);
        ctx.stroke();
      }

      ctx.restore();

      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (box.style === 'white_bar') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx, ry, rw, rh);
    } else if (box.style === 'blur') {
      // Censura "esmerilada" IRREVERSIBLE.
      // Un pixelado clásico conserva información de la imagen original en cada bloque y
      // puede reconstruirse parcialmente con herramientas de ML. Aquí cada bloque se rellena
      // con el color MEDIO de toda la zona más una variación pseudoaleatoria que no depende
      // de la imagen: del contenido original solo sobrevive un único color medio.
      const x0 = Math.max(0, Math.floor(rx));
      const y0 = Math.max(0, Math.floor(ry));
      const x1 = Math.min(width, Math.ceil(rx + rw));
      const y1 = Math.min(height, Math.ceil(ry + rh));
      const bw = x1 - x0;
      const bh = y1 - y0;

      if (bw > 0 && bh > 0) {
        const data = ctx.getImageData(x0, y0, bw, bh).data;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        for (let i = 0; i < data.length; i += 4) {
          sumR += data[i];
          sumG += data[i + 1];
          sumB += data[i + 2];
        }
        const n = bw * bh;
        const meanR = sumR / n;
        const meanG = sumG / n;
        const meanB = sumB / n;

        const block = Math.max(8, Math.floor(Math.min(bw, bh) / 6));
        // Semilla derivada del id de la caja (no de la imagen): resultado estable entre
        // renders, sin parpadeo en la vista previa.
        const rand = createSeededRandom(box.id);
        const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

        for (let y = 0; y < bh; y += block) {
          for (let x = 0; x < bw; x += block) {
            const jitter = (rand() - 0.5) * 48;
            ctx.fillStyle = `rgb(${clamp(meanR + jitter)},${clamp(meanG + jitter)},${clamp(meanB + jitter)})`;
            ctx.fillRect(x0 + x, y0 + y, Math.min(block, bw - x), Math.min(block, bh - y));
          }
        }
      }

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}

/**
 * PRNG determinista (mulberry32) sembrado con un texto. Se usa solo para el relleno de la
 * censura "blur"; no depende en ningún caso del contenido de la imagen.
 */
function createSeededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Renders anti-AI undulating isoline curves (similar to banknote guilloché patterns)
 */
function renderGuillocheCurves(
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalAlpha = config.opacity * 0.45;
  ctx.lineWidth = 1.5;

  const numCurves = Math.floor(12 * (config.density / 3));
  const stepY = height / (numCurves + 1);

  for (let i = 1; i <= numCurves; i++) {
    const baseY = i * stepY;
    const gradient = ctx.createLinearGradient(0, baseY, width, baseY);

    if (config.colorTheme === 'cyan_magenta') {
      gradient.addColorStop(0, '#06b6d4');
      gradient.addColorStop(0.5, '#ec4899');
      gradient.addColorStop(1, '#3b82f6');
    } else if (config.colorTheme === 'emerald_cyan') {
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(0.5, '#06b6d4');
      gradient.addColorStop(1, '#059669');
    } else if (config.colorTheme === 'red_amber') {
      gradient.addColorStop(0, '#ef4444');
      gradient.addColorStop(0.5, '#f59e0b');
      gradient.addColorStop(1, '#dc2626');
    } else if (config.colorTheme === 'custom') {
      gradient.addColorStop(0, config.customColor);
      gradient.addColorStop(1, config.customColor);
    } else {
      gradient.addColorStop(0, '#64748b');
      gradient.addColorStop(1, '#334155');
    }

    ctx.strokeStyle = gradient;
    ctx.beginPath();

    const freq = (config.waveFrequency * 0.005);
    const amp = config.waveAmplitude * 1.5;
    const phase = i * 0.8;

    for (let x = 0; x <= width; x += 10) {
      const y = baseY + Math.sin(x * freq + phase) * amp + Math.cos(x * freq * 0.5 + phase) * (amp * 0.4);
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders undulating anti-AI watermark with sine displacement and flag-wave coloration
 */
function renderUndulatingWatermark(
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  width: number,
  height: number
) {
  if (!config.text.trim()) return;

  ctx.save();

  // Date inclusion
  let fullText = config.text.toUpperCase();
  if (config.includeDate) {
    const dateStr = config.customDate || new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    fullText = `${fullText} • FECHA: ${dateStr}`;
  }

  // Interlocking repeated text
  const repeatedText = `  ✦  ${fullText}  ✦  ${fullText}  ✦  ${fullText}  `;

  const scale = width / 1000;
  const baseFontSize = Math.max(14, Math.floor(config.fontSize * scale));
  ctx.font = `800 ${baseFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;

  const rad = (config.angle * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;

  // We rotate around center to allow angled watermarks
  ctx.translate(cx, cy);
  ctx.rotate(rad);

  const diag = Math.sqrt(width * width + height * height);
  const rowCount = Math.floor(6 * (config.density / 2.5));
  const rowSpacing = (diag / rowCount) * 0.85;

  const startY = -diag / 1.5;
  const endY = diag / 1.5;

  let rowIndex = 0;
  for (let y = startY; y <= endY; y += rowSpacing) {
    rowIndex++;
    const rowOffset = (rowIndex % 2 === 0) ? -150 : 0;

    // Create wave gradient
    const gradient = ctx.createLinearGradient(-diag / 2, y, diag / 2, y);
    if (config.colorTheme === 'cyan_magenta') {
      gradient.addColorStop(0, '#06b6d4');
      gradient.addColorStop(0.3, '#3b82f6');
      gradient.addColorStop(0.7, '#ec4899');
      gradient.addColorStop(1, '#06b6d4');
    } else if (config.colorTheme === 'emerald_cyan') {
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(0.5, '#06b6d4');
      gradient.addColorStop(1, '#34d399');
    } else if (config.colorTheme === 'red_amber') {
      gradient.addColorStop(0, '#ef4444');
      gradient.addColorStop(0.5, '#f59e0b');
      gradient.addColorStop(1, '#f43f5e');
    } else if (config.colorTheme === 'custom') {
      gradient.addColorStop(0, config.customColor);
      gradient.addColorStop(1, config.customColor);
    } else {
      gradient.addColorStop(0, '#334155');
      gradient.addColorStop(0.5, '#64748b');
      gradient.addColorStop(1, '#334155');
    }

    ctx.fillStyle = gradient;
    ctx.globalAlpha = config.opacity;

    // Render undulating characters along sine curve
    const chars = repeatedText.split('');
    const charSpacing = baseFontSize * 0.62;
    const waveFreq = config.waveFrequency * 0.015;
    const waveAmp = config.waveAmplitude * (scale * 0.9);
    const startX = -diag / 1.4 + rowOffset;

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charX = startX + i * charSpacing;
      // Undulate Y based on sine wave
      const waveY = y + Math.sin(charX * waveFreq + rowIndex * 0.7) * waveAmp;

      // Slight angle tilt per letter along derivative of sine curve
      const slope = Math.cos(charX * waveFreq + rowIndex * 0.7) * waveAmp * waveFreq;
      const charAngle = Math.atan(slope) * 0.6;

      ctx.save();
      ctx.translate(charX, waveY);
      ctx.rotate(charAngle);
      ctx.fillText(char, 0, 0);

      // Add thin outline stroke for maximum contrast over both light and dark documents
      ctx.strokeStyle = config.grayscale ? 'rgba(0,0,0,0.45)' : 'rgba(15, 23, 42, 0.4)';
      ctx.lineWidth = Math.max(1, baseFontSize * 0.08);
      ctx.strokeText(char, 0, 0);

      ctx.restore();
    }

    // Add continuous flowing wave line underneath the text for maximum AI inpainting resistance
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = config.opacity * 0.7;
    ctx.lineWidth = Math.max(2, baseFontSize * 0.12);

    for (let lx = -diag / 1.4; lx <= diag / 1.4; lx += 15) {
      const ly = y + baseFontSize * 0.4 + Math.sin(lx * waveFreq + rowIndex * 0.7) * waveAmp;
      if (lx === -diag / 1.4) {
        ctx.moveTo(lx, ly);
      } else {
        ctx.lineTo(lx, ly);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Steganographic Microprint:
 * Ultra-fine microscopic security micro-lettering (similar to Euro banknotes and Spanish DNI 4.0 background microprint).
 * Near-imperceptible to normal viewing, but prevents AI inpainting diffusion models from synthesizing texture.
 */
function renderSteganographicMicroprint(
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  width: number,
  height: number
) {
  ctx.save();
  const baseAlpha = config.subtletyLevel === 'subtle' ? 0.12 : config.subtletyLevel === 'intense' ? 0.35 : 0.22;
  ctx.globalAlpha = config.opacity * baseAlpha;

  const microText = '✦ DNI ANTICOPIA • COPIA DE SEGURIDAD • NO VÁLIDO PARA CRÉDITOS NI PRÉSTAMOS • COTEJADO ✦ ';
  const fontSize = Math.max(7, Math.floor(width * 0.009));
  ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;

  if (config.colorTheme === 'slate_mono' || config.grayscale) {
    ctx.fillStyle = '#475569';
  } else if (config.colorTheme === 'emerald_cyan') {
    ctx.fillStyle = '#065f46';
  } else if (config.colorTheme === 'red_amber') {
    ctx.fillStyle = '#991b1b';
  } else {
    ctx.fillStyle = '#1e293b';
  }

  const rowHeight = fontSize * 2.2;
  const numRows = Math.floor(height / rowHeight) + 2;

  // Staggered dense micro-text lines
  for (let r = 0; r < numRows; r++) {
    const y = r * rowHeight;
    const offset = (r % 2 === 0) ? 0 : -fontSize * 8;
    const repeated = microText.repeat(8);
    ctx.fillText(repeated, offset, y);
  }

  ctx.restore();
}

/** Extensión del parámetro t que se dibuja (≈ 1,7 vueltas de tangente). */
const CLOTHOID_T_MAX = 2.6;

/**
 * Radio máximo (distancia al origen) de la clotoide unitaria hasta CLOTHOID_T_MAX. La curva
 * sobrepasa algo la distancia a su «ojo» (0.7071) antes de enroscarse, por eso se calcula.
 */
const CLOTHOID_UNIT_MAX_RADIUS = clothoidMaxRadius(CLOTHOID_T_MAX);

function clothoidMaxRadius(tMax: number): number {
  const dt = 0.0005;
  let x = 0;
  let y = 0;
  let max = 0;
  for (let i = 0, n = Math.ceil(tMax / dt); i < n; i++) {
    const tMid = (i + 0.5) * dt;
    const phase = (Math.PI * tMid * tMid) / 2;
    x += Math.cos(phase) * dt;
    y += Math.sin(phase) * dt;
    max = Math.max(max, Math.hypot(x, y));
  }
  return max;
}

/**
 * Puntos de media clotoide (espiral de Euler / de Cornu) equiespaciados por longitud de arco.
 *
 * La clotoide tiene curvatura proporcional al arco recorrido: arranca recta en el origen y se
 * enrosca cada vez más. Con parámetro t:  x(t) = scale·∫cos(πu²/2)du,  y(t) = scale·∫sin(πu²/2)du
 * (integrales de Fresnel). La velocidad es constante (= scale), así que la longitud de arco es
 * scale·t. Se integra por la regla del punto medio.
 *
 * La curva completa (t de −tMax a tMax) es simétrica respecto al origen: una «S» que sale del
 * centro en dos sentidos opuestos y se enrosca hacia dos «ojos» en (±0.5, ±0.5)·scale.
 */
export function clothoidHalfPath(
  scale: number,
  tMax: number,
  spacing: number
): { x: number; y: number; t: number }[] {
  const points: { x: number; y: number; t: number }[] = [{ x: 0, y: 0, t: 0 }];
  const dt = 0.0005;
  const steps = Math.ceil(tMax / dt);
  let x = 0;
  let y = 0;
  let sinceLast = 0;

  for (let i = 0; i < steps; i++) {
    const tMid = (i + 0.5) * dt;
    const phase = (Math.PI * tMid * tMid) / 2;
    const dx = Math.cos(phase) * dt * scale;
    const dy = Math.sin(phase) * dt * scale;
    x += dx;
    y += dy;
    sinceLast += scale * dt;
    if (sinceLast >= spacing) {
      sinceLast -= spacing;
      points.push({ x, y, t: (i + 1) * dt });
    }
  }
  return points;
}

/**
 * Micropunteado: símbolos «@» muy pequeños (casi puntos de unos pocos píxeles) colocados a lo
 * largo de clotoides que nacen en el centro del documento. Cada familia es una «S» (dos brazos
 * opuestos); las familias se giran entre sí para repartir los brazos alrededor del centro.
 */
function renderMicropunteado(
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  width: number,
  height: number
) {
  const level = config.subtletyLevel;
  const families = level === 'subtle' ? 1 : level === 'intense' ? 3 : 2;
  const baseAlpha = level === 'subtle' ? 0.55 : level === 'intense' ? 1 : 0.8;

  // Tamaño del símbolo: unos pocos píxeles, proporcional a la resolución del documento
  const glyph = Math.max(3, Math.min(7, Math.round(Math.min(width, height) / 190)));
  const spacing = glyph * 2.4;

  // La clotoide se escala para que su punto más lejano del centro quede cerca de las esquinas
  const maxRadius = 0.5 * Math.hypot(width, height) * 0.92;
  const scale = maxRadius / CLOTHOID_UNIT_MAX_RADIUS;
  const half = clothoidHalfPath(scale, CLOTHOID_T_MAX, spacing);

  const cx = width / 2;
  const cy = height / 2;

  ctx.save();
  ctx.globalAlpha = config.opacity * baseAlpha;
  ctx.font = `700 ${glyph}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (config.colorTheme === 'slate_mono' || config.grayscale) {
    ctx.fillStyle = '#334155';
  } else if (config.colorTheme === 'emerald_cyan') {
    ctx.fillStyle = '#065f46';
  } else if (config.colorTheme === 'red_amber') {
    ctx.fillStyle = '#991b1b';
  } else {
    ctx.fillStyle = '#1e293b';
  }

  const margin = glyph;
  for (let f = 0; f < families; f++) {
    const theta = (f * Math.PI) / families;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    for (let i = 0; i < half.length; i++) {
      const rx = half[i].x * cos - half[i].y * sin;
      const ry = half[i].x * sin + half[i].y * cos;

      // sign=+1 → brazo t>0; sign=−1 → brazo t<0 (simétrico respecto al centro)
      for (const sign of i === 0 ? [1] : [1, -1]) {
        const px = cx + sign * rx;
        const py = cy + sign * ry;
        if (px < -margin || px > width + margin || py < -margin || py > height + margin) continue;
        ctx.fillText('@', px, py);
      }
    }
  }

  ctx.restore();
}

/**
 * Moiré Anti-Aliasing Interference Grid:
 * Dual intersecting high-frequency angular gratings that produce optical moiré fringes.
 * Any attempt by generative AI to reconstruct or resample will produce massive phase aliasing smudges.
 */
function renderMoireInterference(
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  width: number,
  height: number
) {
  ctx.save();
  const baseAlpha = config.subtletyLevel === 'subtle' ? 0.08 : config.subtletyLevel === 'intense' ? 0.25 : 0.15;
  ctx.globalAlpha = config.opacity * baseAlpha;

  ctx.lineWidth = 0.75;
  ctx.strokeStyle = config.grayscale ? '#334155' : '#0891b2';

  const spacing = 10;
  const diag = Math.sqrt(width * width + height * height);

  // Grating 1 (Angle A)
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((config.angle * Math.PI) / 180);
  for (let x = -diag; x <= diag; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, -diag);
    ctx.lineTo(x, diag);
    ctx.stroke();
  }
  ctx.restore();

  // Grating 2 (Angle A + 3.2 degrees to trigger harmonic Moiré beat frequency)
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(((config.angle + 3.2) * Math.PI) / 180);
  ctx.strokeStyle = config.grayscale ? '#475569' : '#db2777';
  for (let x = -diag; x <= diag; x += spacing * 1.05) {
    ctx.beginPath();
    ctx.moveTo(x, -diag);
    ctx.lineTo(x, diag);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * Subtle Digital Water-Emboss Relief:
 * Tactile refractive security seal embossed into the document surface without blocking readability.
 */
function renderSubtleEmboss(
  ctx: CanvasRenderingContext2D,
  config: WatermarkConfig,
  width: number,
  height: number
) {
  ctx.save();
  const sealText = 'COPIA AUTÉNTICA • DNI ANTICOPIA';
  const sealSize = Math.min(width, height) * 0.42;
  const cx = width * 0.78;
  const cy = height * 0.45;

  ctx.translate(cx, cy);
  ctx.rotate((-15 * Math.PI) / 180);

  const baseAlpha = config.subtletyLevel === 'subtle' ? 0.12 : 0.24;
  ctx.globalAlpha = config.opacity * baseAlpha;

  // Double circle seal
  const r1 = sealSize * 0.45;
  const r2 = sealSize * 0.38;

  // Highlight pass (Offset -1, -1)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-1, -1, r1, 0, Math.PI * 2);
  ctx.arc(-1, -1, r2, 0, Math.PI * 2);
  ctx.stroke();

  // Shadow pass (Offset +1, +1)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.arc(1, 1, r1, 0, Math.PI * 2);
  ctx.arc(1, 1, r2, 0, Math.PI * 2);
  ctx.stroke();

  // Seal center text
  ctx.font = `bold ${Math.floor(sealSize * 0.08)}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(sealText, -1, -1);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillText(sealText, 1, 1);

  ctx.restore();
}

/**
 * Micro-noise generator: disrupts generative AI inpainting latent decoders
 */
function renderMicroNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseOpacity: number
) {
  const noiseCanvas = document.createElement('canvas');
  const nw = 120;
  const nh = 120;
  noiseCanvas.width = nw;
  noiseCanvas.height = nh;
  const nCtx = noiseCanvas.getContext('2d');
  if (!nCtx) return;

  const imgData = nCtx.createImageData(nw, nh);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.random() > 0.5 ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = Math.floor(Math.random() * 32);
  }
  nCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.globalAlpha = baseOpacity * 0.35;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(noiseCanvas, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

/**
 * Security border overlay
 */
function renderSecurityBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
  ctx.lineWidth = Math.max(3, width * 0.004);
  ctx.globalAlpha = opacity;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  // Micro corner brackets
  const cornerSize = Math.min(width, height) * 0.06;
  ctx.lineWidth = Math.max(5, width * 0.007);
  ctx.strokeStyle = '#ec4899';

  // Top-left
  ctx.beginPath();
  ctx.moveTo(10, 10 + cornerSize);
  ctx.lineTo(10, 10);
  ctx.lineTo(10 + cornerSize, 10);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - 10 - cornerSize, 10);
  ctx.lineTo(width - 10, 10);
  ctx.lineTo(width - 10, 10 + cornerSize);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(10, height - 10 - cornerSize);
  ctx.lineTo(10, height - 10);
  ctx.lineTo(10 + cornerSize, height - 10);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - 10 - cornerSize, height - 10);
  ctx.lineTo(width - 10, height - 10);
  ctx.lineTo(width - 10, height - 10 - cornerSize);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper to generate a realistic sample DNI canvas for live demos
 */
export function generateSampleDNICanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 856;
  canvas.height = 540;
  const ctx = canvas.getContext('2d')!;

  // 1. Background gradient (Spanish DNI 3.0 / 4.0 pastel beige/blueish security background)
  const bgGrad = ctx.createLinearGradient(0, 0, 856, 540);
  bgGrad.addColorStop(0, '#f1f5f9');
  bgGrad.addColorStop(0.3, '#e2e8f0');
  bgGrad.addColorStop(0.7, '#cbd5e1');
  bgGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 856, 540);

  // Rounded card frame
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 844, 528);

  // Spain & EU flag top left
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(36, 32, 70, 46);
  // EU stars ring
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ ES ★', 71, 60);

  // Header Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ESPAÑA • DOCUMENTO NACIONAL DE IDENTIDAD', 124, 52);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('REINO DE ESPAÑA • NATIONAL IDENTITY CARD', 124, 72);

  // Photo Box on left
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(44, 110, 190, 240);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 110, 190, 240);

  // Silhouette avatar
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(139, 190, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(139, 310, 75, Math.PI, 0);
  ctx.fill();

  // Ghost photo placeholder
  ctx.fillStyle = 'rgba(100, 116, 139, 0.25)';
  ctx.fillRect(720, 130, 84, 108);

  // Personal details
  const fields = [
    { label: 'APELLIDOS / SURNAMES', val: 'GARCÍA FERNÁNDEZ' },
    { label: 'NOMBRE / NAME', val: 'ALEJANDRO' },
    { label: 'SEXO / SEX', val: 'M    NACIONALIDAD / NATIONALITY: ESP' },
    { label: 'FECHA NACIMIENTO / DATE OF BIRTH', val: '14 09 1988' },
    { label: 'Nº SOPORTE / CARD SUPPORT', val: 'BAE984123' },
    { label: 'VALIDEZ / EXPIRY', val: '28 10 2031' },
    { label: 'DNI / NUM', val: '48.912.345-K' },
  ];

  let fy = 130;
  for (const f of fields) {
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(f.label, 260, fy);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillText(f.val, 260, fy + 20);
    fy += 36;
  }

  // Signature field box
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(44, 380, 220, 80);
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(44, 380, 220, 80);
  ctx.fillStyle = '#475569';
  ctx.font = '10px sans-serif';
  ctx.fillText('FIRMA DEL TITULAR', 52, 396);

  // Mock hand signature
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(60, 435);
  ctx.bezierCurveTo(90, 400, 110, 460, 140, 420);
  ctx.bezierCurveTo(160, 400, 180, 450, 230, 425);
  ctx.stroke();

  // Bottom MRZ lines
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(20, 485, 816, 42);
  ctx.fillStyle = '#1e293b';
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText('IDESP48912345K0<<<<<<<<<<<<<<<', 36, 504);
  ctx.fillText('8809142M3110284ESP<<<<<<<<<<<8', 36, 520);

  return canvas;
}
