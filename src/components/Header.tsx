import React, { useState } from 'react';
import { ShieldCheck, Lock, FolderLock, FileText, Info, Globe, Menu, X } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../utils/translations';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentTab: 'editor' | 'vault' | 'security' | 'about';
  setCurrentTab: (tab: 'editor' | 'vault' | 'security' | 'about') => void;
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  vaultCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  vaultCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang];

  const handleNavClick = (tab: 'editor' | 'vault' | 'security' | 'about') => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNavClick('editor')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-fuchsia-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  DNI Anticopia
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Lock className="w-2.5 h-2.5 mr-1" />
                  100% Local
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block -mt-0.5">
                {lang === 'es' ? 'Protector de Identidad y Documentos' : 'Identity & Document Shield'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNavClick('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'editor'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t.tabEditor}
            </button>
            <button
              onClick={() => handleNavClick('vault')}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'vault'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FolderLock className="w-3.5 h-3.5" />
              {t.tabVault}
              {vaultCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-cyan-500 text-slate-950">
                  {vaultCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleNavClick('security')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'security'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {t.tabSecurity}
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'about'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              {t.tabAbout}
            </button>
          </nav>

          {/* Right Action: Language + PWA Button */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition"
              title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="uppercase font-bold">{lang}</span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton lang={lang} variant="header" />

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0c1220] px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => handleNavClick('editor')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              currentTab === 'editor' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300'
            }`}
          >
            {t.tabEditor}
          </button>
          <button
            onClick={() => handleNavClick('vault')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
              currentTab === 'vault' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderLock className="w-4 h-4" />
              {t.tabVault}
            </span>
            {vaultCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-500 text-slate-950">
                {vaultCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleNavClick('security')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              currentTab === 'security' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            {t.tabSecurity}
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              currentTab === 'about' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300'
            }`}
          >
            <Info className="w-4 h-4" />
            {t.tabAbout}
          </button>
        </div>
      )}
    </header>
  );
};
