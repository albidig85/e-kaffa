import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'outline';
  appName?: string;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  appName = 'e-Kafah',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Jika sudah terpasang dan berjalan standalone, sembunyikan tombol
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  if (variant === 'full') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-md transition-all active:scale-[0.99] border border-emerald-600/40 ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-amber-300" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white">Pasang Aplikasi di Layar Utama HP</h4>
              <p className="text-[11px] text-emerald-200">Akses cepat seperti aplikasi Android/iOS</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-lg shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Pasang
          </span>
        </button>

        <PWAInstallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isIOS={isIOS}
          appName={appName}
          onTriggerInstall={install}
          canPromptNative={isInstallable}
        />
      </>
    );
  }

  if (variant === 'outline') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pasang di HP</span>
        </button>

        <PWAInstallModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isIOS={isIOS}
          appName={appName}
          onTriggerInstall={install}
          canPromptNative={isInstallable}
        />
      </>
    );
  }

  // Variant 'compact' untuk Header / Toolbar
  return (
    <>
      <button
        onClick={handleClick}
        title="Pasang aplikasi e-Kafah di layar smartphone"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-300 text-xs font-extrabold shadow-sm transition-all active:scale-95 shrink-0 ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5 text-slate-900 shrink-0" />
        <span className="hidden sm:inline text-[11px] font-black">Pasang App</span>
        <span className="sm:hidden text-[10px] font-black">Instal</span>
      </button>

      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isIOS={isIOS}
        appName={appName}
        onTriggerInstall={install}
        canPromptNative={isInstallable}
      />
    </>
  );
};
