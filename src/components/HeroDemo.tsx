import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, Sliders, Eye, ArrowRight, Play, Pause } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../utils/translations';
import { generateSampleDNICanvas } from '../utils/watermark';

interface HeroDemoProps {
  lang: SupportedLanguage;
  onStartProtect: () => void;
  onUseSample: () => void;
}

export const HeroDemo: React.FC<HeroDemoProps> = ({
  lang,
  onStartProtect,
  onUseSample,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseDniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activePurpose, setActivePurpose] = useState<string>('SOLO PARA ALQUILER - NO VÁLIDO PARA CRÉDITOS');
  const [enableGrayscale, setEnableGrayscale] = useState<boolean>(true);
  const [enableSignatureCensor, setEnableSignatureCensor] = useState<boolean>(true);

  const t = translations[lang];

  // Initialize base sample DNI
  useEffect(() => {
    baseDniCanvasRef.current = generateSampleDNICanvas();
  }, []);

  // Real-time animation loop of undulating anti-AI waves
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const renderFrame = () => {
      if (isPlaying) {
        time += 0.035;
      }

      const baseCanvas = baseDniCanvasRef.current;
      if (!baseCanvas) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw base card
      ctx.drawImage(baseCanvas, 0, 0, w, h);

      // If user is splitting the view with the slider:
      // Left side is RAW EXPOSED, Right side is PROTECTED (or based on slider)
      const splitX = (sliderPos / 100) * w;

      // Draw the PROTECTED side using canvas clipping
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, w - splitX, h);
      ctx.clip();

      // Grayscale filter over protected area
      if (enableGrayscale) {
        const imgData = ctx.getImageData(splitX, 0, w - splitX, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = g;
          data[i + 1] = g;
          data[i + 2] = g;
        }
        ctx.putImageData(imgData, splitX, 0);
      }

      // Draw Censorship on Signature (Bottom left)
      if (enableSignatureCensor) {
        const sx = (44 / 856) * w;
        const sy = (380 / 540) * h;
        const sw = (220 / 856) * w;
        const sh = (80 / 540) * h;

        ctx.fillStyle = '#090d16';
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, sw, sh);

        ctx.fillStyle = '#f43f5e';
        ctx.font = `bold ${Math.floor(sh * 0.35)}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FIRMA CENSURADA', sx + sw / 2, sy + sh / 2);

        // Also censor IDESP support number on top
        const supx = (480 / 856) * w;
        const supy = (260 / 540) * h;
        const supw = (140 / 856) * w;
        const suph = (28 / 540) * h;
        ctx.fillStyle = '#090d16';
        ctx.fillRect(supx, supy, supw, suph);
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(supx, supy, supw, suph);
        ctx.fillStyle = '#f43f5e';
        ctx.font = `bold 10px monospace`;
        ctx.fillText('Nº PROTEGIDO', supx + supw / 2, supy + suph / 2);
      }

      // Draw Dynamic Undulating Guilloché Curves
      ctx.save();
      ctx.lineWidth = 2;
      for (let c = 1; c <= 7; c++) {
        const cy = (h / 8) * c;
        const grad = ctx.createLinearGradient(0, cy, w, cy);
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(0.5, '#ec4899');
        grad.addColorStop(1, '#3b82f6');
        ctx.strokeStyle = grad;
        ctx.globalAlpha = 0.55;

        ctx.beginPath();
        for (let x = splitX; x <= w; x += 8) {
          const y = cy + Math.sin(x * 0.02 + time + c * 0.9) * 14 + Math.cos(x * 0.01 - time) * 6;
          if (x === splitX) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Draw Flowing Undulating Text Across Protected Side
      ctx.save();
      const textToDraw = `  ✦  ${activePurpose}  ✦  ${activePurpose}  `;
      const fontSize = Math.floor(w * 0.024);
      ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;

      // Angled grid
      const angle = -0.32; // ~-18 degrees
      ctx.translate(w / 2, h / 2);
      ctx.rotate(angle);

      const rows = [-h * 0.6, -h * 0.25, h * 0.1, h * 0.45];
      rows.forEach((ry, idx) => {
        const grad = ctx.createLinearGradient(-w, ry, w, ry);
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(0.3, '#3b82f6');
        grad.addColorStop(0.7, '#ec4899');
        grad.addColorStop(1, '#06b6d4');

        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.75;

        const chars = textToDraw.split('');
        const charSpacing = fontSize * 0.62;
        const startX = -w * 0.9 + (idx % 2 === 0 ? -120 : 0);

        for (let i = 0; i < chars.length; i++) {
          const cx = startX + i * charSpacing;
          const cy = ry + Math.sin(cx * 0.018 + time * 1.5 + idx) * 12;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.fillText(chars[i], 0, 0);

          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 1;
          ctx.strokeText(chars[i], 0, 0);
          ctx.restore();
        }
      });
      ctx.restore();

      ctx.restore(); // restore clip

      // 4. Draw interactive divider line and handle
      ctx.save();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();

      // Divider Handle Circle
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(splitX, h / 2, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Handle arrows < >
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◀ ▶', splitX, h / 2);
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, sliderPos, activePurpose, enableGrayscale, enableSignatureCensor]);

  // Handle dragging the split slider directly on canvas or range input
  const handleSliderDrag = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  return (
    <div className="relative overflow-hidden py-10 sm:py-16">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/20 via-fuchsia-600/20 to-blue-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-semibold mb-6 shadow-lg shadow-cyan-950/40 backdrop-blur-sm animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.badgeLocal}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5 leading-[1.15]">
          {t.heroTitle.split('Fraude')[0]}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 bg-clip-text text-transparent">
            {lang === 'es' ? 'el Fraude y la IA' : 'Fraud and AI Clones'}
          </span>
        </h1>

        {/* Hero Description */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
          {t.heroDescription}
        </p>

        {/* Call to action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
          <button
            onClick={onStartProtect}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-cyan-200" />
            <span>{t.ctaProtect}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onUseSample}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm sm:text-base hover:border-slate-500 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{t.sampleButton}</span>
          </button>
        </div>

        {/* Interactive Comparison Simulator Card */}
        <div className="relative max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-[#0d1424]/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          {/* Header of simulator */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80 text-left">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{lang === 'es' ? 'Simulador en Tiempo Real Anti-IA' : 'Real-Time Anti-AI Simulator'}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">
                    60 FPS Canvas
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'es'
                    ? 'Arrastra el divisor para ver la diferencia entre un DNI expuesto y uno protegido'
                    : 'Drag the split handle to compare exposed vs protected state'}
                </p>
              </div>
            </div>

            {/* Animation Play/Pause & Options */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title={isPlaying ? 'Pausar ondas' : 'Reanudar animación'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => setEnableGrayscale(!enableGrayscale)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  enableGrayscale
                    ? 'bg-slate-800 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {lang === 'es' ? 'B&N' : 'B&W'}
              </button>

              <button
                onClick={() => setEnableSignatureCensor(!enableSignatureCensor)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  enableSignatureCensor
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {lang === 'es' ? 'Censura Firma' : 'Censor Sig'}
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative w-full aspect-[856/540] max-h-[460px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner bg-[#030712] select-none">
            <canvas
              ref={canvasRef}
              width={856}
              height={540}
              className="w-full h-full object-contain cursor-ew-resize"
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleSliderDrag(e.clientX, rect);
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  handleSliderDrag(moveEvent.clientX, rect);
                };
                const handleMouseUp = () => {
                  window.removeEventListener('mousemove', handleMouseMove);
                  window.removeEventListener('mouseup', handleMouseUp);
                };
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                handleSliderDrag(touch.clientX, rect);
              }}
            />

            {/* Floating Labels over canvas */}
            <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/40 text-[11px] font-bold text-rose-300 backdrop-blur-sm">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.demoBadgeRisk}</span>
            </div>

            <div className="absolute top-3 right-3 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.demoBadgeSafe}</span>
            </div>
          </div>

          {/* Quick interactive purpose pills */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-left">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              {lang === 'es' ? 'Prueba cambiar el propósito en vivo:' : 'Test dynamic watermark purpose:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'SOLO PARA ALQUILER - NO VÁLIDO PARA CRÉDITOS',
                'CONTRATO DE SUMINISTROS 02/10/2026',
                'VERIFICACIÓN EMPRESA X - COPIA SEGURA',
              ].map((text) => (
                <button
                  key={text}
                  onClick={() => setActivePurpose(text)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    activePurpose === text
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14 text-left">
          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm hover:border-cyan-500/30 transition group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">{t.feat1Title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t.feat1Desc}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm hover:border-rose-500/30 transition group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">{t.feat2Title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t.feat2Desc}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm hover:border-emerald-500/30 transition group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">{t.feat3Title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t.feat3Desc}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm hover:border-indigo-500/30 transition group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">{t.feat4Title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{t.feat4Desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
