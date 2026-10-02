import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { SupportedLanguage } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, dataUrl: string) => void;
  lang: SupportedLanguage;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  lang,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Start camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCapturedDataUrl(null);
      setErrorMsg(null);
      return;
    }

    startCamera();

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopStream();
    setErrorMsg(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg(
        lang === 'es'
          ? 'No se pudo acceder a la cámara. Por favor verifica los permisos del navegador o sube una imagen directamente.'
          : 'Could not access camera. Please check browser permissions or upload an image directly.'
      );
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    setCapturedDataUrl(dataUrl);
    stopStream();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera();
  };

  const handleAccept = () => {
    if (!capturedDataUrl) return;

    // Convert dataUrl to File
    const arr = capturedDataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], `captura-documento-${Date.now()}.png`, { type: mime });

    onCapture(file, capturedDataUrl);
    onClose();
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#0d1424] p-5 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'es' ? 'Capturar Documento con Cámara' : 'Capture Document with Camera'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'es'
                  ? 'Centra el DNI o documento dentro del recuadro'
                  : 'Center your ID or document inside the guide frame'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video or Snapshot Preview */}
        <div className="relative aspect-[16/10] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
          {errorMsg ? (
            <div className="p-6 text-center max-w-md">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <p className="text-xs text-rose-300 mb-4">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
              >
                {lang === 'es' ? 'Reintentar Acceso' : 'Retry Access'}
              </button>
            </div>
          ) : capturedDataUrl ? (
            <img
              src={capturedDataUrl}
              alt="Document Snapshot"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* ID Card Guide Frame */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <div className="w-full max-w-[85%] aspect-[85.6/53.98] border-2 border-dashed border-cyan-400/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Corners */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-cyan-300">
                    {lang === 'es' ? 'ENCUADRE DNI / TARJETA' : 'ID CARD FRAME'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
          {!capturedDataUrl ? (
            <>
              <button
                onClick={toggleCameraFacing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-slate-300 hover:text-white transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? 'Girar Cámara' : 'Switch Camera'}</span>
              </button>

              <button
                onClick={handleSnap}
                disabled={!!errorMsg}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/30 transition disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>{lang === 'es' ? 'Hacer Foto' : 'Take Photo'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? 'Repetir' : 'Retake'}</span>
              </button>

              <button
                onClick={handleAccept}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 transition"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'es' ? 'Usar esta Foto' : 'Use this Photo'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
