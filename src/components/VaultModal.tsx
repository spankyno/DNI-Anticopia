import React, { useState } from 'react';
import { VaultItem, SupportedLanguage } from '../types';
import { clearVault, deleteVaultItem } from '../utils/db';
import { translations } from '../utils/translations';
import { FolderLock, Trash2, Download, ExternalLink, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { exportDocumentsToPdf } from '../utils/pdfExport';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultItems: VaultItem[];
  onRefreshVault: () => void;
  lang: SupportedLanguage;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  vaultItems,
  onRefreshVault,
  lang,
}) => {
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const t = translations[lang];

  if (!isOpen) return null;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteVaultItem(id);
    onRefreshVault();
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleClearAll = async () => {
    await clearVault();
    setConfirmClear(false);
    onRefreshVault();
    setSelectedItem(null);
  };

  const handleDownloadItem = (item: VaultItem) => {
    const a = document.createElement('a');
    a.href = item.dataUrl;
    a.download = `protegido-${item.name.replace(/\.[^/.]+$/, '')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPdf = async (item: VaultItem) => {
    await exportDocumentsToPdf({
      dataUrls: [item.dataUrl],
      filename: `protegido-${item.name.replace(/\.[^/.]+$/, '')}.pdf`,
      mode: 'id1_standard',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-800 bg-[#0b101d] p-6 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.vaultTitle}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-cyan-300 font-mono">
                  {vaultItems.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'es'
                  ? 'Tus copias protegidas guardadas exclusivamente en este dispositivo (IndexedDB cifrada)'
                  : 'Your protected copies stored strictly on this device (IndexedDB)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {vaultItems.length > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition"
              >
                {t.vaultClearAll}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clear confirmation alert */}
        {confirmClear && (
          <div className="p-4 my-3 rounded-2xl border border-rose-500/40 bg-rose-950/40 flex items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{t.vaultConfirmClear}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Sí, borrar todo
              </button>
            </div>
          </div>
        )}

        {/* Vault Grid / Content */}
        <div className="overflow-y-auto flex-1 py-4 pr-1">
          {vaultItems.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4">
                <FolderLock className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Bóveda vacía</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                {t.vaultEmpty}
              </p>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Cuando proteges un documento, pulsa "Guardar en Bóveda" para archivarlo localmente.</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {vaultItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-slate-900 transition p-3.5 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="aspect-[856/540] rounded-xl overflow-hidden bg-black/40 border border-slate-800 mb-3 relative">
                      <img
                        src={item.thumbnail || item.dataUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-cyan-300 backdrop-blur-sm">
                        {item.date}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate mb-1">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 font-mono">
                      {item.purpose || 'Sin propósito específico'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500">{item.fileSizeFormatted}</span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadItem(item);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        title="Descargar PNG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition"
                        title="Eliminar de la bóveda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full Image Preview Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-150">
            <div className="relative max-w-3xl w-full rounded-2xl bg-slate-900 border border-slate-800 p-5">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-white mb-1 truncate pr-8">
                {selectedItem.name}
              </h3>
              <p className="text-xs text-cyan-400 mb-3 font-mono">
                {selectedItem.purpose} • {selectedItem.date}
              </p>

              <div className="aspect-[856/540] max-h-[60vh] bg-black/60 rounded-xl overflow-hidden border border-slate-800 mb-4 flex items-center justify-center">
                <img
                  src={selectedItem.dataUrl}
                  alt={selectedItem.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => handleDownloadItem(selectedItem)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PNG</span>
                </button>
                <button
                  onClick={() => handleExportPdf(selectedItem)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF DNI (85.6×54mm)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
