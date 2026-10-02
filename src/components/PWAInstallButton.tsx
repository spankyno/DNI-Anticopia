import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../utils/translations';

interface PWAInstallButtonProps {
  lang: SupportedLanguage;
  variant?: 'header' | 'hero' | 'floating';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang, variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const t = translations[lang];

  // If already running as an installed PWA, hide button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Guide general desktop or other browsers
      setShowIOSModal(true);
    }
  };

  const buttonClasses = {
    header: 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all shadow-sm shadow-cyan-950/40 cursor-pointer',
    hero: 'inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer',
    floating: 'fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-2xl hover:bg-slate-800 transition cursor-pointer',
  }[variant];

  return (
    <>
      <button
        onClick={handleInstallClick}
        aria-label={t.pwaInstallButton}
        className={buttonClasses}
        title={t.pwaInstallDesc}
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span>{isIOS ? t.pwaInstallIOS : t.pwaInstallButton}</span>
      </button>

      {/* iOS Safari / Manual Installation Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {lang === 'es' ? 'Instalar DNI Anticopia' : 'Install DNI Anticopia'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'es' ? 'Acceso rápido y 100% offline' : 'Fast and 100% offline access'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {lang === 'es'
                ? 'Para instalar esta aplicación en tu iPhone, iPad o navegador que no soporte instalación automática, sigue estos 2 sencillos pasos:'
                : 'To install this application on your iPhone, iPad or browser without automatic prompts, follow these 2 steps:'}
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-slate-200 block mb-0.5">
                    {lang === 'es' ? 'Paso 1: Pulsa Compartir' : 'Step 1: Tap Share'}
                  </strong>
                  <span className="text-slate-400">
                    {lang === 'es'
                      ? 'En la barra inferior de Safari, pulsa el icono de Compartir (el cuadrado con la flecha hacia arriba).'
                      : 'In Safari bottom bar, tap the Share icon (square with upward arrow).'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong className="text-slate-200 block mb-0.5">
                    {lang === 'es' ? 'Paso 2: Añadir a pantalla de inicio' : 'Step 2: Add to Home Screen'}
                  </strong>
                  <span className="text-slate-400">
                    {lang === 'es'
                      ? 'Desliza hacia abajo en el menú y selecciona "Añadir a pantalla de inicio".'
                      : 'Scroll down the menu and choose "Add to Home Screen".'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
            >
              {lang === 'es' ? 'Entendido' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
