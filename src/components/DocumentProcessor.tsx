import React, { useState, useEffect, useRef } from 'react';
import {
  DocumentItem,
  DocumentType,
  WatermarkConfig,
  RedactionBox,
  SupportedLanguage,
  VaultItem,
} from '../types';
import { translations } from '../utils/translations';
import { renderProtectedDocument, generateSampleDNICanvas } from '../utils/watermark';
import { getPresetRedactions } from '../utils/dniPresets';
import { exportDocumentsToPdf } from '../utils/pdfExport';
import { saveToVault, isVaultUnlocked, VaultLockedError } from '../utils/db';
import { makeThumbnail } from '../utils/vaultThumb';
import {
  MAX_FILES_PER_BATCH,
  MAX_FILE_BYTES,
  MAX_IMAGE_SIDE,
  checkImageDimensions,
  precheckImageFile,
  sanitizeFileName,
  type FileRejection,
} from '../utils/fileValidation';
import { RedactionCanvas } from './RedactionCanvas';
import { CameraCaptureModal } from './CameraCaptureModal';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  Camera,
  FileText,
  ShieldCheck,
  Download,
  Share2,
  FolderPlus,
  RefreshCw,
  Sliders,
  Eye,
  Check,
  Sparkles,
  Trash2,
  Plus,
  Layers,
  Palette,
  Calendar,
  AlertCircle,
  Archive,
  Fingerprint,
  Grid,
  FileDown,
} from 'lucide-react';
import { exportInFormat, ExportFormatType } from '../utils/exportFormats';

let confettiMainThread: ReturnType<typeof confetti.create> | null = null;

interface DocumentProcessorProps {
  lang: SupportedLanguage;
  onRefreshVault: () => void;
  /** `pending`: documento a guardar cuando la bóveda esté desbloqueada. */
  onOpenVault: (pending?: VaultItem) => void;
  initialSample?: boolean;
}

const DEFAULT_CONFIG: WatermarkConfig = {
  text: 'SOLO PARA ALQUILER - NO VÁLIDO PARA CRÉDITOS',
  preset: 'saferlayer_waves',
  opacity: 0.48,
  angle: -22,
  density: 3,
  fontSize: 22,
  waveFrequency: 4,
  waveAmplitude: 16,
  colorTheme: 'cyan_magenta',
  customColor: '#06b6d4',
  includeDate: true,
  customDate: '',
  grayscale: true,
  microNoise: true,
  guillocheCurves: true,
  moireInterference: true,
  steganographicMicroprint: true,
  subtleEmboss: false,
  micropunteado: false,
  stampBorder: false,
  subtletyLevel: 'balanced',
};

export const DocumentProcessor: React.FC<DocumentProcessorProps> = ({
  lang,
  onRefreshVault,
  onOpenVault,
  initialSample = false,
}) => {
  const t = translations[lang];

  // Document items (supports batch processing)
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [vaultToast, setVaultToast] = useState<boolean>(false);
  const [editorMode, setEditorMode] = useState<'preview' | 'redact'>('preview');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeDoc = documents[activeIndex] || null;

  // Load sample on mount if requested
  useEffect(() => {
    if (initialSample && documents.length === 0) {
      loadSampleDoc();
    }
  }, [initialSample]);

  // Whenever activeDoc changes (or redactions/config changes), re-render the protected version
  useEffect(() => {
    if (!activeDoc) return;
    renderCurrentDoc(activeDoc);
  }, [
    activeDoc?.originalDataUrl,
    activeDoc?.redactions,
    activeDoc?.config,
  ]);

  const loadSampleDoc = () => {
    const sampleCanvas = generateSampleDNICanvas();
    const dataUrl = sampleCanvas.toDataURL('image/png');
    const presets = getPresetRedactions('dni_front');

    const newDoc: DocumentItem = {
      id: `sample-dni-${Date.now()}`,
      name: 'DNI-Ejemplo-Protegido.png',
      originalDataUrl: dataUrl,
      processedDataUrl: dataUrl,
      width: sampleCanvas.width,
      height: sampleCanvas.height,
      aspectRatio: sampleCanvas.width / sampleCanvas.height,
      type: 'dni_front',
      redactions: presets,
      config: { ...DEFAULT_CONFIG },
      status: 'idle',
    };

    setDocuments([newDoc]);
    setActiveIndex(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processUploadedFiles(Array.from(files));
    e.target.value = '';
  };

  const processUploadedFiles = async (files: File[]) => {
    const newDocs: DocumentItem[] = [];
    const rejected: { name: string; reason: RejectionReason }[] = [];

    // Límite de archivos por lote
    if (files.length > MAX_FILES_PER_BATCH) {
      rejected.push({ name: `+${files.length - MAX_FILES_PER_BATCH}`, reason: 'too_many' });
      files = files.slice(0, MAX_FILES_PER_BATCH);
    }

    for (const file of files) {
      if (file.type === 'application/pdf') {
        rejected.push({ name: file.name, reason: 'pdf' });
        continue;
      }

      try {
        // 1) Tamaño y formato REAL (cabecera), no solo el MIME declarado
        const pre = await precheckImageFile(file);
        if (pre) {
          rejected.push({ name: file.name, reason: pre });
          continue;
        }

        // 2) Debe decodificarse como imagen de verdad
        const dataUrl = await readFileAsDataUrl(file);
        const img = await loadImage(dataUrl);

        // 3) Dimensiones razonables
        const dim = checkImageDimensions(img.width, img.height);
        if (dim) {
          rejected.push({ name: file.name, reason: dim });
          continue;
        }

        // Auto detect if ratio matches ID card (~1.58)
        const ratio = img.width / img.height;
        const isCardRatio = ratio >= 1.4 && ratio <= 1.75;
        const initialType: DocumentType = isCardRatio ? 'dni_front' : 'generic';
        const initialRedactions = isCardRatio ? getPresetRedactions('dni_front') : [];

        newDocs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          originalFile: file,
          originalDataUrl: dataUrl,
          processedDataUrl: dataUrl,
          width: img.width,
          height: img.height,
          aspectRatio: ratio,
          type: initialType,
          redactions: initialRedactions,
          config: { ...DEFAULT_CONFIG },
          status: 'idle',
        });
      } catch {
        rejected.push({ name: file.name, reason: 'corrupt' });
      }
    }

    if (newDocs.length > 0) {
      setDocuments((prev) => [...prev, ...newDocs]);
      setActiveIndex(documents.length); // switch to first new doc
    }

    if (rejected.length > 0) {
      alert(buildRejectionMessage(rejected, lang));
    }
  };

  const handleCameraCapture = async (file: File, dataUrl: string) => {
    const img = await loadImage(dataUrl);
    const newDoc: DocumentItem = {
      id: `cam-${Date.now()}`,
      name: file.name,
      originalFile: file,
      originalDataUrl: dataUrl,
      processedDataUrl: dataUrl,
      width: img.width,
      height: img.height,
      aspectRatio: img.width / img.height,
      type: 'dni_front',
      redactions: getPresetRedactions('dni_front'),
      config: { ...DEFAULT_CONFIG },
      status: 'idle',
    };

    setDocuments((prev) => [...prev, newDoc]);
    setActiveIndex(documents.length);
  };

  const renderCurrentDoc = async (doc: DocumentItem) => {
    try {
      setIsProcessing(true);
      const img = await loadImage(doc.originalDataUrl);
      const { dataUrl } = await renderProtectedDocument({
        imageSource: img,
        config: doc.config,
        redactions: doc.redactions,
        targetWidth: doc.width,
        targetHeight: doc.height,
      });

      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, processedDataUrl: dataUrl, status: 'done' } : d))
      );
    } catch (err) {
      console.error('Error rendering protected doc:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateActiveConfig = (partial: Partial<WatermarkConfig>) => {
    if (!activeDoc) return;
    const updated = { ...activeDoc.config, ...partial };
    setDocuments((prev) =>
      prev.map((d, i) => (i === activeIndex ? { ...d, config: updated } : d))
    );
  };

  const updateActiveType = (type: DocumentType) => {
    if (!activeDoc) return;
    const presets = getPresetRedactions(type);
    setDocuments((prev) =>
      prev.map((d, i) =>
        i === activeIndex ? { ...d, type, redactions: presets } : d
      )
    );
  };

  const applyPresetToActive = (type: DocumentType) => {
    if (!activeDoc) return;
    const presets = getPresetRedactions(type);
    setDocuments((prev) =>
      prev.map((d, i) =>
        i === activeIndex ? { ...d, redactions: presets } : d
      )
    );
  };

  const handleApplyConfigToAll = () => {
    if (!activeDoc) return;
    setDocuments((prev) =>
      prev.map((d) => ({ ...d, config: { ...activeDoc.config } }))
    );
  };

  const removeDocument = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = documents.filter((_, i) => i !== indexToRemove);
    setDocuments(updated);
    if (activeIndex >= updated.length) {
      setActiveIndex(Math.max(0, updated.length - 1));
    }
  };

  // Unified Multi-Format Export handler
  const handleExportInFormat = async (format: ExportFormatType) => {
    if (!activeDoc) return;
    try {
      setIsProcessing(true);
      const allDocsData = documents.map((d) => ({ name: d.name, dataUrl: d.processedDataUrl }));
      await exportInFormat({
        dataUrl: activeDoc.processedDataUrl,
        filenameBase: activeDoc.name,
        format,
        allDocsDataUrls: allDocsData,
      });
      triggerConfetti();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!activeDoc) return;

    // Miniatura ligera para la lista: así listar la bóveda no obliga a descifrar la imagen completa
    let thumbnail = activeDoc.processedDataUrl;
    try {
      thumbnail = await makeThumbnail(activeDoc.processedDataUrl);
    } catch {
      /* se usa la imagen completa como miniatura */
    }

    const vaultItem: VaultItem = {
      id: `vault-${Date.now()}`,
      name: activeDoc.name,
      type: activeDoc.type,
      date: new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      timestamp: Date.now(),
      thumbnail,
      dataUrl: activeDoc.processedDataUrl,
      fileSizeFormatted: `${Math.round(activeDoc.processedDataUrl.length / 1024)} KB`,
      purpose: activeDoc.config.text,
    };

    // Bóveda bloqueada o aún sin crear: se abre el modal y el documento se guarda al desbloquear.
    if (!isVaultUnlocked()) {
      onOpenVault(vaultItem);
      return;
    }

    try {
      await saveToVault(vaultItem);
    } catch (err) {
      if (err instanceof VaultLockedError) {
        onOpenVault(vaultItem); // se bloqueó por inactividad justo ahora
        return;
      }
      console.error('Vault save error:', err);
      return;
    }
    onRefreshVault();

    setVaultToast(true);
    setTimeout(() => setVaultToast(false), 3500);
  };

  const handleShare = async () => {
    if (!activeDoc) return;

    if (navigator.share && navigator.canShare) {
      try {
        const res = await fetch(activeDoc.processedDataUrl);
        const blob = await res.blob();
        const file = new File([blob], `protegido-${sanitizeFileName(activeDoc.name)}`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Documento Protegido con DNI Anticopia',
            text: `Documento con marca de agua anti-IA para: ${activeDoc.config.text}`,
            files: [file],
          });
          return;
        }
      } catch (err) {
        console.log('Share canceled or fallback needed:', err);
      }
    }

    // Fallback: copy to clipboard
    try {
      const res = await fetch(activeDoc.processedDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch {
      handleExportInFormat('png');
    }
  };

  const triggerConfetti = () => {
    try {
      // Instancia sin Web Worker: la de confetti() por defecto crea un Worker desde una URL blob:,
      // que una CSP estricta (worker-src 'self') bloquea. Para una ráfaga corta basta el hilo principal.
      if (!confettiMainThread) {
        confettiMainThread = confetti.create(undefined, { resize: true, useWorker: false });
      }
      confettiMainThread({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#ec4899', '#10b981'],
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        lang={lang}
      />

      {/* Toasts */}
      {vaultToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{t.savedVaultSuccess}</span>
          <button
            onClick={() => onOpenVault()}
            className="ml-2 underline text-white font-bold cursor-pointer"
          >
            Abrir Bóveda
          </button>
        </div>
      )}

      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs font-semibold shadow-2xl backdrop-blur-md">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>{t.copiedSuccess}</span>
        </div>
      )}

      {/* Main Studio Container */}
      {documents.length === 0 ? (
        /* Empty Dropzone State */
        <div className="max-w-3xl mx-auto">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) {
                processUploadedFiles(Array.from(e.dataTransfer.files));
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-3xl border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 bg-gradient-to-b from-[#0e1628]/80 to-[#0a0f1d]/90 p-10 sm:p-14 text-center cursor-pointer transition-all shadow-2xl backdrop-blur-xl hover:shadow-cyan-500/10"
          >
            {/* Glow circle */}
            <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all shadow-lg shadow-cyan-500/10">
              <UploadCloud className="w-10 h-10" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {t.dropzoneTitle}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {t.dropzoneSubtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                Seleccionar Archivo
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCameraOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>{t.cameraButton}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  loadSampleDoc();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 font-semibold text-xs transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{t.sampleButton}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
              <span>{t.dropzoneSupported}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.badgeLocal}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Active Protection Studio Interface */
        <div className="space-y-6">
          {/* Top Bar: Batch carousel + Add files + Camera */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            {/* Carousel of uploaded docs */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Documentos ({documents.length}):</span>
              </span>

              {documents.map((doc, idx) => (
                <div
                  key={doc.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition shrink-0 ${
                    idx === activeIndex
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <span className="max-w-[120px] truncate">{doc.name}</span>
                  <button
                    onClick={(e) => removeDocument(idx, e)}
                    className="opacity-60 hover:opacity-100 text-rose-400 hover:text-rose-300 ml-1"
                    title="Quitar documento"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add file button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir</span>
              </button>

              <button
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition shrink-0 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>

            {/* Apply config to all docs */}
            {documents.length > 1 && (
              <button
                onClick={handleApplyConfigToAll}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                Aplicar esta marca de agua a todos ({documents.length})
              </button>
            )}
          </div>

          {/* Studio Split Layout: Controls on Left, Live Document on Right */}
          {activeDoc && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Watermark & Censorship Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                {/* 1. Purpose / Text Card */}
                <div className="p-5 rounded-3xl border border-slate-800 bg-[#0c1322]/90 backdrop-blur-md shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>{t.watermarkTitle}</span>
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                      Anti-IA Vectorial
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {t.purposeLabel}
                    </label>
                    <textarea
                      rows={2}
                      value={activeDoc.config.text}
                      onChange={(e) => updateActiveConfig({ text: e.target.value })}
                      placeholder={t.purposePlaceholder}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 outline-none leading-relaxed resize-none"
                    />
                  </div>

                  {/* Quick Preset Pills */}
                  <div>
                    <span className="block text-[11px] font-medium text-slate-400 mb-2">
                      {t.quickPresetsTitle}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(t.presets).map(([key, val]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateActiveConfig({ text: val })}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                            activeDoc.config.text === val
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                              : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date & Grayscale Toggles */}
                  <div className="pt-2 border-t border-slate-800 space-y-2.5">
                    {/* Grayscale (Police recommendation) */}
                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition">
                      <input
                        type="checkbox"
                        checked={activeDoc.config.grayscale}
                        onChange={(e) => updateActiveConfig({ grayscale: e.target.checked })}
                        className="mt-0.5 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-200 block">
                          {t.grayscaleLabel}
                        </span>
                        <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                          {t.grayscaleHint}
                        </span>
                      </div>
                    </label>

                    {/* Include Date */}
                    <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 transition text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        {t.includeDateLabel}
                      </span>
                      <input
                        type="checkbox"
                        checked={activeDoc.config.includeDate}
                        onChange={(e) => updateActiveConfig({ includeDate: e.target.checked })}
                        className="rounded text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Censorship & Presets Card */}
                <div className="p-5 rounded-3xl border border-slate-800 bg-[#0c1322]/90 backdrop-blur-md shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-rose-400" />
                      <span>{t.quickCensorship}</span>
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {activeDoc.redactions.length} censuras activas
                    </span>
                  </div>

                  {/* Document Type Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {t.docTypeLabel}
                    </label>
                    <select
                      value={activeDoc.type}
                      onChange={(e) => updateActiveType(e.target.value as DocumentType)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-cyan-400"
                    >
                      {Object.entries(t.types).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 1-Click Censorship Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => applyPresetToActive('dni_front')}
                      className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/40 text-rose-300 font-semibold text-xs transition cursor-pointer"
                    >
                      {t.applyDniFrontCensor}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetToActive('dni_back')}
                      className="flex-1 min-w-[140px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                    >
                      {t.applyDniBackCensor}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditorMode(editorMode === 'preview' ? 'redact' : 'preview')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        editorMode === 'redact'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>
                        {editorMode === 'redact'
                          ? 'Finalizar Edición de Censuras'
                          : 'Editar / Dibujar Censuras a Mano'}
                      </span>
                    </button>

                    {activeDoc.redactions.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDocuments((prev) =>
                            prev.map((d, i) =>
                              i === activeIndex ? { ...d, redactions: [] } : d
                            )
                          )
                        }
                        className="text-xs text-rose-400 hover:underline"
                      >
                        {t.clearCensors}
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Advanced Watermark Aesthetics Card */}
                <div className="p-5 rounded-3xl border border-slate-800 bg-[#0c1322]/90 backdrop-blur-md shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <span>{t.watermarkTheme}</span>
                  </h3>

                  {/* Themes */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cyan_magenta', name: 'Cian / Magenta', color: 'from-cyan-400 to-pink-500' },
                      { id: 'emerald_cyan', name: 'Neón Esmeralda', color: 'from-emerald-400 to-cyan-400' },
                      { id: 'red_amber', name: 'Alerta Rojo', color: 'from-red-500 to-amber-500' },
                      { id: 'slate_mono', name: 'Sello Monocromo', color: 'from-slate-400 to-slate-600' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => updateActiveConfig({ colorTheme: th.id as any })}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          activeDoc.config.colorTheme === th.id
                            ? 'bg-slate-800 border-cyan-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${th.color}`} />
                        <span className="truncate">{th.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sliders: Opacity, Wave Amp, Angle */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{t.opacityLabel}</span>
                        <span className="font-mono text-cyan-300">
                          {Math.round(activeDoc.config.opacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={activeDoc.config.opacity}
                        onChange={(e) => updateActiveConfig({ opacity: parseFloat(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{t.waveAmplitudeLabel}</span>
                        <span className="font-mono text-cyan-300">
                          {activeDoc.config.waveAmplitude}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="35"
                        value={activeDoc.config.waveAmplitude}
                        onChange={(e) => updateActiveConfig({ waveAmplitude: parseInt(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{t.angleLabel}</span>
                        <span className="font-mono text-cyan-300">{activeDoc.config.angle}°</span>
                      </div>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        value={activeDoc.config.angle}
                        onChange={(e) => updateActiveConfig({ angle: parseInt(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Anti-AI Subtle Security Layers (Saferlayer & Official Document Style) */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Capas de Seguridad Sutil Anti-IA</span>
                      </span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                        {activeDoc.config.subtletyLevel === 'subtle' ? 'Casi Invisible' : activeDoc.config.subtletyLevel === 'balanced' ? 'Equilibrado' : 'Intenso'}
                      </span>
                    </div>

                    {/* Subtlety Level Selector */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1.5">
                        {t.subtletyLabel}
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'subtle', name: 'Sutil', hint: 'Casi invisible' },
                          { id: 'balanced', name: 'Equilibrado', hint: 'Recomendado' },
                          { id: 'intense', name: 'Intenso', hint: 'Disuasorio' },
                        ].map((lvl) => (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => updateActiveConfig({ subtletyLevel: lvl.id as any })}
                            className={`p-1.5 rounded-lg text-center text-xs font-medium border transition cursor-pointer ${
                              activeDoc.config.subtletyLevel === lvl.id
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className="block text-[11px]">{lvl.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Checkboxes for Subtle Features */}
                    <div className="space-y-2 text-xs pt-1">
                      {/* 1. Guilloché Curves */}
                      <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeDoc.config.guillocheCurves}
                          onChange={(e) => updateActiveConfig({ guillocheCurves: e.target.checked })}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <span className="font-semibold block">{t.guillocheLabel}</span>
                          <span className="text-[10px] text-slate-400 block">Ondulaciones de seguridad vectoriales continuas</span>
                        </div>
                      </label>

                      {/* 2. Steganographic Microprint */}
                      <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeDoc.config.steganographicMicroprint}
                          onChange={(e) => updateActiveConfig({ steganographicMicroprint: e.target.checked })}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <span className="font-semibold block">{t.steganographicLabel}</span>
                          <span className="text-[10px] text-slate-400 block">Micro-texto continuo que dificulta la clonación por IA</span>
                        </div>
                      </label>

                      {/* 3. Moiré Interference Grid */}
                      <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeDoc.config.moireInterference}
                          onChange={(e) => updateActiveConfig({ moireInterference: e.target.checked })}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <span className="font-semibold block">{t.moireLabel}</span>
                          <span className="text-[10px] text-slate-400 block">Interferencia óptica que genera aliasing al intentar borrar</span>
                        </div>
                      </label>

                      {/* 4. Micro-Noise */}
                      <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeDoc.config.microNoise}
                          onChange={(e) => updateActiveConfig({ microNoise: e.target.checked })}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <span className="font-semibold block">{t.microNoiseLabel}</span>
                          <span className="text-[10px] text-slate-400 block">Micro-dither de alta frecuencia anti-latentes de difusión</span>
                        </div>
                      </label>

                      {/* 5. Subtle Water-Emboss Relief */}
                      <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeDoc.config.subtleEmboss}
                          onChange={(e) => updateActiveConfig({ subtleEmboss: e.target.checked })}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <span className="font-semibold block">{t.embossLabel}</span>
                          <span className="text-[10px] text-slate-400 block">Sello óptico de agua en relieve táctil 3D</span>
                        </div>
                      </label>

                      {/* 6. Micropunteado en clotoide */}
                      <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeDoc.config.micropunteado}
                          onChange={(e) => updateActiveConfig({ micropunteado: e.target.checked })}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <span className="font-semibold block">{t.micropunteadoLabel}</span>
                          <span className="text-[10px] text-slate-400 block">{t.micropunteadoHint}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Document Preview / Interactive Redactor (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* View Mode Switcher Header */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">
                      {activeDoc.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {activeDoc.width} × {activeDoc.height}px
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditorMode('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        editorMode === 'preview'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang === 'es' ? 'Resultado Protegido' : 'Protected Result'}
                    </button>
                    <button
                      onClick={() => setEditorMode('redact')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        editorMode === 'redact'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang === 'es' ? 'Ajustar Censuras' : 'Adjust Censorship'}
                    </button>
                  </div>
                </div>

                {/* Display Canvas or Redaction Editor */}
                <div className="rounded-3xl border border-slate-800 bg-[#070b14] p-3 sm:p-5 shadow-2xl relative overflow-hidden">
                  {editorMode === 'redact' ? (
                    <RedactionCanvas
                      imageSrc={activeDoc.originalDataUrl}
                      redactions={activeDoc.redactions}
                      onChangeRedactions={(newBoxes) =>
                        setDocuments((prev) =>
                          prev.map((d, i) =>
                            i === activeIndex ? { ...d, redactions: newBoxes } : d
                          )
                        )
                      }
                      lang={lang}
                    />
                  ) : (
                    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/60 bg-black/80 flex items-center justify-center">
                      <img
                        src={activeDoc.processedDataUrl}
                        alt="Documento Protegido"
                        className="w-full h-auto object-contain max-h-[650px] shadow-2xl"
                      />

                      {/* Processing spinner indicator */}
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center gap-2 text-cyan-300 text-xs font-bold">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Actualizando protección en tiempo real...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Security Guarantee Tag */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {lang === 'es'
                        ? '100% Procesado en la memoria de tu navegador'
                        : '100% Processed in browser client memory'}
                    </span>
                    <span className="text-slate-500">
                      Anti-Inpainting IA • Sin Metadatos
                    </span>
                  </div>
                </div>

                {/* Export Options & Actions Bar */}
                <div className="p-5 rounded-3xl border border-slate-800 bg-[#0c1322]/90 backdrop-blur-md shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>{t.exportTitle}</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      8 formatos disponibles
                    </span>
                  </div>

                  {/* Format Category 1: Formatos de Imagen */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Imágenes Digitales
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportInFormat('png')}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/40 text-cyan-200 transition cursor-pointer text-center group"
                      >
                        <FileDown className="w-4 h-4 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">PNG</span>
                        <span className="text-[9px] text-cyan-400/80">Sin pérdidas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportInFormat('jpg_high')}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition cursor-pointer text-center group"
                      >
                        <FileDown className="w-4 h-4 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">JPG HQ</span>
                        <span className="text-[9px] text-slate-400">95% Calidad</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportInFormat('jpg_compact')}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition cursor-pointer text-center group"
                      >
                        <FileDown className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">JPG Web</span>
                        <span className="text-[9px] text-slate-400">&lt; 1.5 MB</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportInFormat('webp')}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition cursor-pointer text-center group"
                      >
                        <FileDown className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">WEBP</span>
                        <span className="text-[9px] text-slate-400">Ultra eficiente</span>
                      </button>
                    </div>
                  </div>

                  {/* Format Category 2: Formatos PDF Documentales */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Documentos PDF Oficiales
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportInFormat('pdf_id1')}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 hover:border-indigo-400 text-indigo-200 transition cursor-pointer text-left"
                      >
                        <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold block text-white">PDF DNI ID-1</span>
                          <span className="text-[10px] text-indigo-300">85.60 × 53.98 mm</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportInFormat('pdf_a4')}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition cursor-pointer text-left"
                      >
                        <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold block text-white">PDF Folio A4</span>
                          <span className="text-[10px] text-slate-400">Centrado oficial</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportInFormat('pdf_original')}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition cursor-pointer text-left"
                      >
                        <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold block text-white">PDF Original</span>
                          <span className="text-[10px] text-slate-400">Resolución nativa</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Format Category 3: Pack Completo ZIP & Acciones */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleExportInFormat('zip_bundle')}
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
                    >
                      <Archive className="w-4 h-4" />
                      <span>{t.downloadZipBundle}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveToVault}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold transition cursor-pointer"
                        title={t.saveToVault}
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.saveToVault}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                        title={t.shareNative}
                      >
                        <Share2 className="w-4 h-4 text-emerald-400" />
                        <span className="hidden sm:inline">{t.shareNative}</span>
                      </button>
                    </div>
                  </div>

                  {/* Batch export if multiple files */}
                  {documents.length > 1 && (
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleExportInFormat('zip_bundle')}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan-500/40 bg-slate-900 text-cyan-300 font-bold text-xs hover:bg-cyan-950/40 transition cursor-pointer"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Exportar los {documents.length} Documentos en 1 solo ZIP Completo</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helpers
type RejectionReason = FileRejection | 'pdf' | 'too_many';

function buildRejectionMessage(
  rejected: { name: string; reason: RejectionReason }[],
  lang: SupportedLanguage
): string {
  const es = lang === 'es';
  const mb = Math.round(MAX_FILE_BYTES / (1024 * 1024));
  const text: Record<RejectionReason, string> = {
    too_large: es ? `supera el máximo de ${mb} MB` : `exceeds the ${mb} MB limit`,
    empty: es ? 'el archivo está vacío' : 'the file is empty',
    unsupported: es ? 'formato no admitido (usa JPG, PNG o WebP)' : 'unsupported format (use JPG, PNG or WebP)',
    corrupt: es ? 'no se pudo leer como imagen' : 'could not be read as an image',
    dimensions: es
      ? `dimensiones excesivas (máx. ${MAX_IMAGE_SIDE} px por lado)`
      : `dimensions too large (max ${MAX_IMAGE_SIDE} px per side)`,
    pdf: es
      ? 'los PDF no se procesan; conviértelo a imagen (JPG/PNG) antes de subirlo'
      : 'PDFs are not processed; convert it to an image (JPG/PNG) first',
    too_many: es
      ? `se admiten ${MAX_FILES_PER_BATCH} archivos por lote; el resto se ignoró`
      : `${MAX_FILES_PER_BATCH} files per batch maximum; the rest were ignored`,
  };
  const head = es ? 'Algunos archivos no se pudieron añadir:' : 'Some files could not be added:';
  const lines = rejected.map((r) =>
    r.reason === 'too_many' ? `• ${text[r.reason]}` : `• ${r.name}: ${text[r.reason]}`
  );
  return `${head}\n${lines.join('\n')}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
