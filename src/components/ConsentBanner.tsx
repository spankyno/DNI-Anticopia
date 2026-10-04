import React from 'react';
import { BarChart3 } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { ConsentChoice } from '../utils/analytics';

interface ConsentBannerProps {
  lang: SupportedLanguage;
  current: ConsentChoice | null;
  onChoose: (choice: ConsentChoice) => void;
  onMoreInfo: () => void;
}

const texts = {
  es: {
    title: 'Analítica de visitas (opcional)',
    body: 'Si aceptas, al entrar se envía a mi servidor propio tu dirección IP, el nombre de la app, la página y la hora, solo para contar visitas. Tus documentos nunca se envían. Sin cookies.',
    more: 'Más información',
    accept: 'Aceptar',
    reject: 'Rechazar',
  },
  en: {
    title: 'Visit analytics (optional)',
    body: 'If you accept, on entry your IP address, the app name, the page and the time are sent to my own server, only to count visits. Your documents are never sent. No cookies.',
    more: 'More information',
    accept: 'Accept',
    reject: 'Reject',
  },
};

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ lang, current, onChoose, onMoreInfo }) => {
  const t = texts[lang];
  const btn =
    'flex-1 sm:flex-none sm:min-w-[7.5rem] px-5 py-2.5 rounded-xl text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';

  return (
    <div
      role="region"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-[45] p-3 sm:p-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-slate-700 bg-[#0b101d]/95 backdrop-blur-md shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h2 id="consent-title" className="text-sm font-bold text-white">
              {t.title}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.body}{' '}
              <button
                type="button"
                onClick={onMoreInfo}
                className="underline underline-offset-2 text-cyan-300 hover:text-cyan-200"
              >
                {t.more}
              </button>
            </p>
          </div>
        </div>

        {/* Mismo tamaño y peso visual: rechazar es tan fácil como aceptar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChoose('denied')}
            aria-pressed={current === 'denied'}
            className={`${btn} bg-slate-200 hover:bg-white text-slate-900`}
          >
            {t.reject}
          </button>
          <button
            type="button"
            onClick={() => onChoose('granted')}
            aria-pressed={current === 'granted'}
            className={`${btn} bg-cyan-500 hover:bg-cyan-400 text-slate-950`}
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
};
