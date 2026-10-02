import React from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../utils/translations';
import { ShieldCheck, Lock, Heart, FileCheck, Smartphone } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface FooterProps {
  lang: SupportedLanguage;
  onNavigate: (tab: 'editor' | 'vault' | 'security' | 'about') => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onNavigate }) => {
  const t = translations[lang];

  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#060911] text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                DNI Anticopia
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {lang === 'es'
                ? 'Protege tus documentos de identidad con marcas de agua anti-IA y censura de datos sensibles. Procesamiento 100% en cliente sin servidores.'
                : 'Protect your identity documents with AI-resistant undulating watermarks and sensitive data redaction. 100% client-side zero-server execution.'}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold pt-1">
              <Lock className="w-3.5 h-3.5" />
              <span>{t.badgeLocal}</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'es' ? 'Navegación' : 'Navigation'}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('editor')}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  {t.tabEditor}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('vault')}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  {t.tabVault}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('security')}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  {t.tabSecurity}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  {t.tabAbout}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: PWA & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'es' ? 'Instalación PWA' : 'PWA Install'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'es'
                ? 'Instala DNI Anticopia en tu dispositivo móvil u ordenador para usarla sin conexión a internet.'
                : 'Install DNI Anticopia on mobile or desktop for offline instant utility.'}
            </p>
            <div>
              <PWAInstallButton lang={lang} variant="header" />
            </div>
          </div>
        </div>

        {/* Bottom row: Disclaimer & Credits */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center sm:text-left max-w-2xl text-[11px] leading-relaxed">
            {t.disclaimerText}
          </p>
          <div className="flex items-center gap-1.5 shrink-0 text-slate-400 text-xs">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
            <span>{t.creditsText}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
