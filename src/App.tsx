/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SupportedLanguage, VaultItem } from './types';
import { getVaultItems } from './utils/db';
import { Header } from './components/Header';
import { HeroDemo } from './components/HeroDemo';
import { DocumentProcessor } from './components/DocumentProcessor';
import { VaultModal } from './components/VaultModal';
import { AboutView } from './components/AboutView';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'editor' | 'vault' | 'security' | 'about'>('editor');
  const [lang, setLang] = useState<SupportedLanguage>('es');
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [autoLoadSample, setAutoLoadSample] = useState<boolean>(false);

  // Load vault items from local IndexedDB
  const refreshVault = async () => {
    try {
      const items = await getVaultItems();
      setVaultItems(items);
    } catch (e) {
      console.error('Failed to load vault items:', e);
    }
  };

  useEffect(() => {
    refreshVault();
  }, []);

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
        vaultCount={vaultItems.length}
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
                onOpenVault={() => setIsVaultModalOpen(true)}
                initialSample={autoLoadSample}
              />
            </div>
          </div>
        )}

        {(currentTab === 'security' || currentTab === 'about') && (
          <AboutView
            lang={lang}
            onNavigateToEditor={() => setCurrentTab('editor')}
          />
        )}
      </main>

      {/* Private Vault Modal */}
      <VaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        vaultItems={vaultItems}
        onRefreshVault={refreshVault}
        lang={lang}
      />

      {/* Footer */}
      <Footer
        lang={lang}
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
