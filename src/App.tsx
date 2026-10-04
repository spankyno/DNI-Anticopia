/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SupportedLanguage, VaultItem } from './types';
import { getVaultCount } from './utils/db';
import { Header } from './components/Header';
import { HeroDemo } from './components/HeroDemo';
import { DocumentProcessor } from './components/DocumentProcessor';
import { VaultModal } from './components/VaultModal';
import { AboutView } from './components/AboutView';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ConsentBanner } from './components/ConsentBanner';
import { ConsentChoice, getConsent, initAnalytics, setConsent } from './utils/analytics';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'editor' | 'vault' | 'security' | 'about'>('editor');
  const [lang, setLang] = useState<SupportedLanguage>('es');
  const [vaultCount, setVaultCount] = useState<number>(0);
  // Documento recién protegido que espera a que se cree/desbloquee la bóveda para guardarse
  const [pendingVaultItem, setPendingVaultItem] = useState<VaultItem | null>(null);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [autoLoadSample, setAutoLoadSample] = useState<boolean>(false);

  // Consentimiento de analítica: el tracker no se carga hasta que el visitante acepta
  const [consent, setConsentState] = useState<ConsentChoice | null>(() => getConsent());
  const [bannerOpen, setBannerOpen] = useState<boolean>(() => getConsent() === null);

  useEffect(() => {
    initAnalytics();
  }, []);

  const handleConsent = (choice: ConsentChoice) => {
    setConsent(choice);
    setConsentState(choice);
    setBannerOpen(false);
  };

  const goToPrivacy = () => {
    setCurrentTab('about');
    // Esperar a que AboutView se monte antes de desplazar
    setTimeout(() => {
      document.getElementById('privacidad')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // Nº de documentos guardados (no requiere desbloquear la bóveda: no se descifra nada)
  const refreshVault = async () => {
    try {
      setVaultCount(await getVaultCount());
    } catch (e) {
      console.error('Failed to load vault items:', e);
    }
  };

  useEffect(() => {
    refreshVault();
  }, []);

  // Mantener el atributo lang del documento sincronizado con el idioma de la interfaz
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const handleStartProtect = () => {
    setCurrentTab('editor');
    // Scroll down to editor area smoothly
    const editorElem = document.getElementById('studio-section');
    if (editorElem) {
      editorElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUseSample = () => {
    setAutoLoadSample(true);
    setCurrentTab('editor');
    const editorElem = document.getElementById('studio-section');
    if (editorElem) {
      editorElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'vault') {
            setIsVaultModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        lang={lang}
        setLang={setLang}
        vaultCount={vaultCount}
      />

      {/* Main Body */}
      <main className="flex-1">
        {currentTab === 'editor' && (
          <div className="space-y-6">
            {/* Animated Interactive Hero with Sample DNI */}
            <HeroDemo
              lang={lang}
              onStartProtect={handleStartProtect}
              onUseSample={handleUseSample}
            />

            {/* Document Processing Studio Section */}
            <div id="studio-section" className="scroll-mt-20">
              <DocumentProcessor
                lang={lang}
                onRefreshVault={refreshVault}
                onOpenVault={(pending) => {
                  setPendingVaultItem(pending ?? null);
                  setIsVaultModalOpen(true);
                }}
                initialSample={autoLoadSample}
              />
            </div>
          </div>
        )}

        {(currentTab === 'security' || currentTab === 'about') && (
          <AboutView
            lang={lang}
            onNavigateToEditor={() => setCurrentTab('editor')}
            consent={consent}
            onOpenConsent={() => setBannerOpen(true)}
          />
        )}
      </main>

      {/* Private Vault Modal */}
      <VaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        onRefreshVault={refreshVault}
        lang={lang}
        pendingItem={pendingVaultItem}
        onPendingConsumed={() => setPendingVaultItem(null)}
      />

      {/* Banner de consentimiento de analítica */}
      {bannerOpen && (
        <ConsentBanner
          lang={lang}
          current={consent}
          onChoose={handleConsent}
          onMoreInfo={goToPrivacy}
        />
      )}

      {/* Footer */}
      <Footer
        lang={lang}
        onPrivacy={goToPrivacy}
        onConsentPrefs={() => setBannerOpen(true)}
        onNavigate={(tab) => {
          if (tab === 'vault') {
            setIsVaultModalOpen(true);
          } else {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
}
