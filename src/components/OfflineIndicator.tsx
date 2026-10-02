import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/90 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-amber-200 shadow-2xl shadow-amber-950/50 animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Modo Sin Conexión — DNI Anticopia funciona al 100% offline.</span>
    </div>
  );
};
