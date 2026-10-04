import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { VaultItem, VaultItemMeta, SupportedLanguage } from '../types';
import {
  TooManyAttemptsError,
  VaultCryptoUnavailableError,
  WrongPassphraseError,
  clearVault,
  deleteVaultItem,
  getVaultItemData,
  getVaultItems,
  getVaultStatus,
  isVaultUnlocked,
  lockVault,
  onVaultLockChange,
  resetVault,
  saveToVault,
  setupVault,
  touchVault,
  unlockVault,
  type VaultStatus,
} from '../utils/db';
import { checkPassphrase } from '../utils/vaultCrypto';
import { getVaultTexts } from '../utils/vaultTexts';
import {
  FolderLock,
  Trash2,
  Download,
  X,
  ShieldCheck,
  AlertTriangle,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { exportDocumentsToPdf } from '../utils/pdfExport';
import { sanitizeFileName } from '../utils/fileValidation';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshVault: () => void;
  lang: SupportedLanguage;
  /** Documento pendiente de guardar: se guarda en cuanto se crea o desbloquea la bóveda. */
  pendingItem?: VaultItem | null;
  onPendingConsumed?: () => void;
}

type View = 'loading' | 'setup' | 'locked' | 'list' | 'error';

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  onRefreshVault,
  lang,
  pendingItem = null,
  onPendingConsumed,
}) => {
  const t = getVaultTexts(lang);

  const [view, setView] = useState<View>('loading');
  const [status, setStatus] = useState<VaultStatus>({ initialized: false, itemCount: 0, legacyCount: 0 });
  const [items, setItems] = useState<VaultItemMeta[]>([]);
  const [selected, setSelected] = useState<{ meta: VaultItemMeta; dataUrl: string | null } | null>(null);

  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [ack, setAck] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const strength = useMemo(() => checkPassphrase(pass), [pass]);

  const clearSecrets = () => {
    setPass('');
    setPass2('');
    setAck(false);
    setShowPass(false);
  };

  // Si el Vault se bloquea (botón, inactividad o cierre de pestaña) se descarta todo lo descifrado.
  useEffect(() => {
    return onVaultLockChange((unlocked) => {
      if (!unlocked) {
        setItems([]);
        setSelected(null);
        setConfirmClear(false);
        clearSecrets();
        setView((v) => (v === 'list' ? 'locked' : v));
      }
    });
  }, []);

  const mapError = useCallback(
    (err: unknown): string => {
      if (err instanceof VaultCryptoUnavailableError) return t.errCrypto;
      if (err instanceof TooManyAttemptsError) return t.errWait(Math.ceil(err.retryAfterMs / 1000));
      if (err instanceof WrongPassphraseError) return t.errWrong;
      return t.errGeneric;
    },
    [t]
  );

  const loadList = useCallback(async () => {
    const list = await getVaultItems();
    setItems(list);
    setStatus(await getVaultStatus());
    setView('list');
    onRefreshVault();
  }, [onRefreshVault]);

  const init = useCallback(async () => {
    setView('loading');
    setError(null);
    setNotice(null);
    setSelected(null);
    setConfirmClear(false);
    setConfirmReset(false);
    clearSecrets();
    try {
      const st = await getVaultStatus();
      setStatus(st);
      if (!st.initialized) {
        setView('setup');
      } else if (isVaultUnlocked()) {
        await loadList();
      } else {
        setView('locked');
      }
    } catch (err) {
      console.error('Vault init error:', err);
      setView('error');
    }
  }, [loadList]);

  useEffect(() => {
    if (isOpen) void init();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    clearSecrets();
    setSelected(null);
    setError(null);
    setConfirmReset(false);
    onPendingConsumed?.(); // un documento pendiente no confirmado se descarta
    onClose();
  };

  // Escape cierra la vista previa o, si no hay, el modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selected) setSelected(null);
      else handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /** Guarda el documento pendiente (si lo hay) y devuelve el aviso a mostrar. */
  const flushPending = async (): Promise<string | null> => {
    if (!pendingItem) return null;
    try {
      await saveToVault(pendingItem);
      return t.savedNotice;
    } finally {
      onPendingConsumed?.();
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const chk = checkPassphrase(pass);
    if (!chk.ok) {
      setError(chk.reason === 'too_short' ? t.errShort : chk.reason === 'too_common' ? t.errCommon : t.errWeak);
      return;
    }
    if (pass !== pass2) {
      setError(t.errMismatch);
      return;
    }
    if (!ack) {
      setError(t.errAck);
      return;
    }

    setBusy(true);
    try {
      const { migrated } = await setupVault(pass);
      clearSecrets();
      const notes: string[] = [];
      if (migrated > 0) notes.push(t.migratedNotice(migrated));
      const saved = await flushPending();
      if (saved) notes.push(saved);
      setNotice(notes.length ? notes.join(' ') : null);
      await loadList();
    } catch (err) {
      console.error('Vault setup error:', err);
      setError(mapError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pass) return;
    setError(null);
    setBusy(true);
    try {
      const { migrated } = await unlockVault(pass);
      clearSecrets();
      const notes: string[] = [];
      if (migrated > 0) notes.push(t.migratedNotice(migrated));
      const saved = await flushPending();
      if (saved) notes.push(saved);
      setNotice(notes.length ? notes.join(' ') : null);
      await loadList();
    } catch (err) {
      setPass('');
      setError(mapError(err));
    } finally {
      setBusy(false);
    }
  };

  const refreshList = async () => {
    try {
      await loadList();
    } catch (err) {
      setError(mapError(err));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    touchVault();
    await deleteVaultItem(id);
    if (selected?.meta.id === id) setSelected(null);
    await refreshList();
  };

  const handleClearAll = async () => {
    touchVault();
    await clearVault();
    setConfirmClear(false);
    setSelected(null);
    await refreshList();
  };

  const handleReset = async () => {
    await resetVault();
    setConfirmReset(false);
    clearSecrets();
    setError(null);
    setNotice(null);
    setItems([]);
    setStatus({ initialized: false, itemCount: 0, legacyCount: 0 });
    setView('setup');
    onRefreshVault();
  };

  const openItem = async (meta: VaultItemMeta) => {
    touchVault();
    setSelected({ meta, dataUrl: null });
    try {
      const dataUrl = await getVaultItemData(meta.id);
      setSelected((cur) => (cur && cur.meta.id === meta.id ? { meta, dataUrl } : cur));
    } catch (err) {
      setSelected(null);
      setError(mapError(err));
    }
  };

  const fullData = async (meta: VaultItemMeta): Promise<string> =>
    selected && selected.meta.id === meta.id && selected.dataUrl
      ? selected.dataUrl
      : getVaultItemData(meta.id);

  const baseName = (meta: VaultItemMeta) =>
    sanitizeFileName(meta.name.replace(/\.[^/.]+$/, ''), 'documento');

  const handleDownloadItem = async (meta: VaultItemMeta) => {
    touchVault();
    try {
      const dataUrl = await fullData(meta);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `protegido-${baseName(meta)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(mapError(err));
    }
  };

  const handleExportPdf = async (meta: VaultItemMeta) => {
    touchVault();
    try {
      const dataUrl = await fullData(meta);
      await exportDocumentsToPdf({
        dataUrls: [dataUrl],
        filename: `protegido-${baseName(meta)}.pdf`,
        mode: 'id1_standard',
      });
    } catch (err) {
      setError(mapError(err));
    }
  };

  if (!isOpen) return null;

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-none text-sm text-white placeholder-slate-600 font-mono';
  const primaryBtn =
    'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm transition';

  const subtitle = view === 'list' ? t.subtitleOpen : t.subtitleLocked;
  const strengthColors = ['bg-rose-500', 'bg-rose-500', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-400'];

  const passwordField = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    autoComplete: 'new-password' | 'current-password',
    autoFocus = false
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPass ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          spellCheck={false}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShowPass((s) => !s)}
          aria-label={showPass ? t.hide : t.show}
          title={showPass ? t.hide : t.show}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white"
        >
          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onPointerDown={touchVault}
      onKeyDown={touchVault}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-title"
        className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-800 bg-[#0b101d] p-6 shadow-2xl flex flex-col text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h2 id="vault-title" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.title}</span>
                {view === 'list' && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-cyan-300 font-mono">
                    {items.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'list' && (
              <>
                {items.length > 0 && (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="hidden sm:block px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition"
                  >
                    {t.clearAll}
                  </button>
                )}
                <button
                  onClick={() => lockVault()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.lock}</span>
                </button>
              </>
            )}
            <button
              onClick={handleClose}
              aria-label={t.close}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Avisos */}
        {notice && view === 'list' && (
          <div className="mt-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-xs text-emerald-200 flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        {error && view === 'list' && (
          <div role="alert" className="mt-3 p-3 rounded-xl border border-rose-500/30 bg-rose-950/40 text-xs text-rose-200 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Confirmación de borrado total */}
        {confirmClear && view === 'list' && (
          <div className="p-4 my-3 rounded-2xl border border-rose-500/40 bg-rose-950/40 flex items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{t.clearConfirm}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                {t.clearYes}
              </button>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 py-4 pr-1">
          {view === 'loading' && (
            <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.loading}</span>
            </div>
          )}

          {view === 'error' && (
            <div className="py-16 text-center text-sm text-rose-300 max-w-md mx-auto">{t.errGeneric}</div>
          )}

          {/* ---------- Crear contraseña ---------- */}
          {view === 'setup' && (
            <form onSubmit={handleSetup} className="max-w-md mx-auto space-y-4 py-2" noValidate>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white">{t.setupTitle}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t.setupIntro}</p>
              </div>

              {status.legacyCount > 0 && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/30 text-xs text-amber-200 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{t.setupLegacy(status.legacyCount)}</span>
                </div>
              )}
              {pendingItem && (
                <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-xs text-cyan-200 flex gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{t.setupPending}</span>
                </div>
              )}

              {passwordField('vault-pass', t.passLabel, pass, setPass, 'new-password', true)}

              {pass.length > 0 && (
                <div className="space-y-1" aria-live="polite">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1.5 flex-1 rounded-full ${
                          strength.score >= n ? strengthColors[strength.score] : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">{t.strength[strength.score]}</p>
                </div>
              )}

              {passwordField('vault-pass2', t.passConfirm, pass2, setPass2, 'new-password')}

              <p className="text-[11px] text-slate-500 leading-relaxed">{t.passHint}</p>

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="mt-0.5 accent-cyan-500"
                />
                <span className="leading-relaxed">{t.ackLabel}</span>
              </label>

              {error && (
                <div role="alert" className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/40 text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={busy} className={primaryBtn}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>{busy ? t.creating : t.createBtn}</span>
              </button>

              <p className="text-[11px] text-slate-500 leading-relaxed text-center">{t.limits}</p>
            </form>
          )}

          {/* ---------- Bloqueada ---------- */}
          {view === 'locked' && (
            <div className="max-w-sm mx-auto space-y-4 py-4">
              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 mx-auto">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-white">{t.lockedTitle}</h3>
                  <p className="text-xs text-slate-400">{t.lockedIntro}</p>
                  {status.itemCount + status.legacyCount > 0 && (
                    <p className="text-[11px] font-mono text-slate-500">
                      {status.itemCount + status.legacyCount} {lang === 'es' ? 'documentos cifrados' : 'encrypted documents'}
                    </p>
                  )}
                </div>

                {pendingItem && (
                  <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-xs text-cyan-200 flex gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{lang === 'es'
                      ? 'El documento que acabas de proteger se guardará al desbloquear.'
                      : 'The document you just protected will be saved once you unlock.'}</span>
                  </div>
                )}

                {passwordField('vault-unlock', t.passLabel, pass, setPass, 'current-password', true)}

                {error && (
                  <div role="alert" className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/40 text-xs text-rose-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={busy || !pass} className={primaryBtn}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>{busy ? t.unlocking : t.unlockBtn}</span>
                </button>
              </form>

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="block mx-auto text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2"
                >
                  {t.forgot}
                </button>
              ) : (
                <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/40 text-xs space-y-3">
                  <div className="flex items-center gap-2 text-rose-200 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{t.resetTitle}</span>
                  </div>
                  <p className="text-rose-200/90 leading-relaxed">{t.resetBody}</p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                    >
                      {t.resetConfirm}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- Lista ---------- */}
          {view === 'list' &&
            (items.length === 0 ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4">
                  <FolderLock className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">{t.empty}</h4>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{t.emptyHint}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openItem(item)}
                    className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-slate-900 transition p-3.5 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="aspect-[856/540] rounded-xl overflow-hidden bg-black/40 border border-slate-800 mb-3 relative">
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain" />
                        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-cyan-300 backdrop-blur-sm">
                          {item.date}
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white truncate mb-1">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 font-mono">
                        {item.purpose || t.noPurpose}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span className="text-[10px] text-slate-500">{item.fileSizeFormatted}</span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDownloadItem(item);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                          title={t.downloadPng}
                          aria-label={t.downloadPng}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition"
                          title={t.deleteTitle}
                          aria-label={t.deleteTitle}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>

        {/* Vista previa completa (se descifra bajo demanda) */}
        {selected && view === 'list' && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-150">
            <div className="relative max-w-3xl w-full rounded-2xl bg-slate-900 border border-slate-800 p-5">
              <button
                onClick={() => setSelected(null)}
                aria-label={t.close}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-white mb-1 truncate pr-8">{selected.meta.name}</h3>
              <p className="text-xs text-cyan-400 mb-3 font-mono">
                {selected.meta.purpose} • {selected.meta.date}
              </p>

              <div className="aspect-[856/540] max-h-[60vh] bg-black/60 rounded-xl overflow-hidden border border-slate-800 mb-4 flex items-center justify-center">
                {selected.dataUrl ? (
                  <img src={selected.dataUrl} alt={selected.meta.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.decrypting}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => void handleDownloadItem(selected.meta)}
                  disabled={!selected.dataUrl}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadPng}</span>
                </button>
                <button
                  onClick={() => void handleExportPdf(selected.meta)}
                  disabled={!selected.dataUrl}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadPdf}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
