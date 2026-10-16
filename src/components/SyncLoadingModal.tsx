import React from 'react';
import { HeartHandshake } from 'lucide-react';

interface SyncLoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  appName?: string;
}

export const SyncLoadingModal: React.FC<SyncLoadingModalProps> = ({
  isOpen,
  title = 'Dentos Lun...',
  message = 'Mengambil data dari Google Sheet...',
  appName = 'e-Kafah',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Frosted Glass Card Container (sesuai contoh gambar) */}
      <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-2xl p-7 sm:p-9 flex flex-col items-center text-center text-white overflow-hidden transform animate-in zoom-in-95 duration-200">
        
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Title "Dentos Lun..." */}
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-6 drop-shadow-sm font-sans">
          {title}
        </h3>

        {/* Circular Spinner Ring with Logo inside */}
        <div className="relative flex items-center justify-center my-2">
          {/* Outer glow ring */}
          <div className="absolute w-28 h-28 rounded-full bg-cyan-400/10 blur-md pointer-events-none" />

          {/* Spinning gradient ring */}
          <div className="w-24 h-24 rounded-full border-[3.5px] border-white/20 border-t-cyan-400 border-r-cyan-400 animate-spin" />

          {/* Static Center White Badge with Logo */}
          <div className="absolute w-16 h-16 rounded-full bg-white shadow-xl flex flex-col items-center justify-center p-2.5 overflow-hidden border border-white/90">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <span className="text-[8px] font-black tracking-tight text-slate-800 leading-none mt-1 truncate max-w-full">
              {appName}
            </span>
          </div>
        </div>

        {/* 5 Equalizer / Wave Pulse Bars (sesuai bar biru di bawah spinner pada gambar) */}
        <div className="flex items-center justify-center gap-1.5 mt-6 mb-3 h-7">
          <span
            className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-sky-300 animate-pulse"
            style={{ height: '14px', animationDuration: '0.8s', animationDelay: '0s' }}
          />
          <span
            className="w-1.5 rounded-full bg-gradient-to-t from-cyan-400 to-sky-300 animate-pulse"
            style={{ height: '22px', animationDuration: '0.8s', animationDelay: '0.15s' }}
          />
          <span
            className="w-1.5 rounded-full bg-gradient-to-t from-cyan-300 to-sky-200 animate-pulse"
            style={{ height: '28px', animationDuration: '0.8s', animationDelay: '0.3s' }}
          />
          <span
            className="w-1.5 rounded-full bg-gradient-to-t from-cyan-400 to-sky-300 animate-pulse"
            style={{ height: '20px', animationDuration: '0.8s', animationDelay: '0.45s' }}
          />
          <span
            className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-sky-300 animate-pulse"
            style={{ height: '12px', animationDuration: '0.8s', animationDelay: '0.6s' }}
          />
        </div>

        {/* Action description / subtitle */}
        <p className="text-xs sm:text-sm text-cyan-100/90 font-medium tracking-wide mt-1 max-w-xs leading-relaxed">
          {message}
        </p>

        {/* Mini progress indicator dot */}
        <span className="mt-3 text-[10px] text-white/50 font-normal">
          Sinkronisasi Google Sheet
        </span>

      </div>
    </div>
  );
};
