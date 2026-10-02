import React, { useRef, useState } from 'react';
import { RedactionBox, RedactionStyle, SupportedLanguage } from '../types';
import { Trash2, Shield, EyeOff, Sparkles, CheckSquare } from 'lucide-react';
import { translations } from '../utils/translations';

interface RedactionCanvasProps {
  imageSrc: string;
  redactions: RedactionBox[];
  onChangeRedactions: (boxes: RedactionBox[]) => void;
  lang: SupportedLanguage;
  aspectRatio?: number;
}

export const RedactionCanvas: React.FC<RedactionCanvasProps> = ({
  imageSrc,
  redactions,
  onChangeRedactions,
  lang,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<RedactionStyle>('solid_black');

  const t = translations[lang];

  // Mouse / Touch handlers for drawing new redaction
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox({ x, y, w: 0, h: 0 });
    setSelectedBoxId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPos || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const curY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const x = Math.min(startPos.x, curX);
    const y = Math.min(startPos.y, curY);
    const w = Math.abs(curX - startPos.x);
    const h = Math.abs(curY - startPos.y);

    setCurrentBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) {
      setIsDrawing(false);
      return;
    }

    // If box has minimal dimensions (> 2% width/height), add it
    if (currentBox.w > 2 && currentBox.h > 2) {
      const newBox: RedactionBox = {
        id: `censor-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        x: Math.round(currentBox.x * 10) / 10,
        y: Math.round(currentBox.y * 10) / 10,
        width: Math.round(currentBox.w * 10) / 10,
        height: Math.round(currentBox.h * 10) / 10,
        label: 'CENSURADO',
        style: activeStyle,
      };

      onChangeRedactions([...redactions, newBox]);
      setSelectedBoxId(newBox.id);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentBox(null);
  };

  const handleDeleteBox = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChangeRedactions(redactions.filter((b) => b.id !== id));
    if (selectedBoxId === id) setSelectedBoxId(null);
  };

  const handleStyleChange = (id: string, style: RedactionStyle) => {
    onChangeRedactions(
      redactions.map((b) => (b.id === id ? { ...b, style } : b))
    );
  };

  const handleLabelChange = (id: string, label: string) => {
    onChangeRedactions(
      redactions.map((b) => (b.id === id ? { ...b, label } : b))
    );
  };

  return (
    <div className="space-y-3">
      {/* Controls Bar for Redaction Styles */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300">
            {lang === 'es' ? 'Estilo para nuevas censuras:' : 'New redactions style:'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveStyle('solid_black')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              activeStyle === 'solid_black'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.styles.solid_black}
          </button>
          <button
            onClick={() => setActiveStyle('caution_tape')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              activeStyle === 'caution_tape'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.styles.caution_tape}
          </button>
          <button
            onClick={() => setActiveStyle('blur')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              activeStyle === 'blur'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.styles.blur}
          </button>
        </div>

        {redactions.length > 0 && (
          <button
            onClick={() => onChangeRedactions([])}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-rose-400 hover:bg-rose-950/40 transition ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearCensors} ({redactions.length})</span>
          </button>
        )}
      </div>

      {/* Interactive Overlay Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-inner select-none cursor-crosshair group"
      >
        <img
          src={imageSrc}
          alt="Document to redact"
          className="w-full h-auto block object-contain pointer-events-none"
        />

        {/* Existing Redaction Boxes */}
        {redactions.map((box) => {
          const isSelected = selectedBoxId === box.id;
          return (
            <div
              key={box.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBoxId(box.id);
              }}
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
              }}
              className={`absolute cursor-pointer transition-all flex items-center justify-center ${
                isSelected ? 'ring-2 ring-cyan-400 shadow-lg' : 'hover:ring-1 hover:ring-rose-400'
              } ${
                box.style === 'solid_black'
                  ? 'bg-black text-rose-400 border border-rose-600'
                  : box.style === 'caution_tape'
                  ? 'bg-yellow-400 text-black border border-yellow-600'
                  : 'bg-cyan-500/30 backdrop-blur-md text-cyan-200 border border-cyan-400/80'
              }`}
            >
              <span className="font-mono font-bold text-[9px] sm:text-xs truncate px-1 text-center select-none">
                {box.label || 'CENSURADO'}
              </span>

              {/* Delete button on hover or select */}
              <button
                onClick={(e) => handleDeleteBox(box.id, e)}
                className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow transition cursor-pointer"
                title="Eliminar censura"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Temporary Box while dragging */}
        {isDrawing && currentBox && (
          <div
            style={{
              left: `${currentBox.x}%`,
              top: `${currentBox.y}%`,
              width: `${currentBox.w}%`,
              height: `${currentBox.h}%`,
            }}
            className="absolute border-2 border-dashed border-cyan-400 bg-cyan-500/20 pointer-events-none"
          />
        )}

        {/* Helper Hint Badge */}
        <div className="absolute bottom-2 left-2 pointer-events-none px-2.5 py-1 rounded-lg bg-black/75 border border-slate-700 text-[10px] text-slate-300 backdrop-blur-sm">
          {lang === 'es'
            ? 'Haz clic y arrastra con el ratón para censurar cualquier área'
            : 'Click and drag over the image to redact any area'}
        </div>
      </div>

      {/* Selected Box Config Editor */}
      {selectedBoxId && (
        <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          {(() => {
            const b = redactions.find((box) => box.id === selectedBoxId);
            if (!b) return null;
            return (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Texto de censura:</span>
                  <input
                    type="text"
                    value={b.label}
                    onChange={(e) => handleLabelChange(b.id, e.target.value)}
                    className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                    placeholder="CENSURADO"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Estilo:</span>
                  <select
                    value={b.style}
                    onChange={(e) => handleStyleChange(b.id, e.target.value as RedactionStyle)}
                    className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                  >
                    <option value="solid_black">Barra Negra</option>
                    <option value="caution_tape">Cinta Precaución</option>
                    <option value="blur">Desenfocado (Blur)</option>
                    <option value="white_bar">Barra Blanca</option>
                  </select>

                  <button
                    onClick={() => handleDeleteBox(b.id)}
                    className="p-1 rounded bg-rose-950/60 text-rose-400 hover:bg-rose-900 border border-rose-800 ml-2"
                    title="Eliminar esta censura"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
