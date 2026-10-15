import React, { useState } from 'react';
import { Smartphone, X, Download, ChevronRight, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallBannerProps {
  appName?: string;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  appName = 'e-Kafah',
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isMobile,
    isDismissed,
    install,
    dismissBanner,
  } = usePWAInstall();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // Jangan tampilkan jika sudah diinstal sebagai PWA standalone
  if (isInstalled) {
    return null;
  }

  // Jika sudah ditutup oleh pengguna, sembunyikan banner mengambang
  if (isDismissed) {
    return (
      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isIOS={isIOS}
        appName={appName}
        onTriggerInstall={install}
        canPromptNative={isInstallable}
      />
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else {
      // Jika browser belum memicu beforeinstallprompt atau di iOS Safari
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {/* Floating Mobile Smartphone Install Bar */}
      <aside
        aria-label="Pasang Aplikasi"
        className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 sm:max-w-md bg-emerald-950/95 backdrop-blur-md text-white border border-emerald-700/80 rounded-2xl p-3 shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
      >
        <div className="flex items-center gap-3">
          {/* Logo / Icon */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center">
            <img
              src="/pwa-192x192.png"
              alt={appName}
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Info Text */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                Pasang Aplikasi {appName}
              </h4>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-sm shrink-0">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-emerald-200 truncate">
              {isIOS
                ? 'Tambahkan ke Layar Utama iPhone/iPad'
                : 'Instal di smartphone untuk akses instan & cepat'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {justInstalled ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl">
                <Check className="w-3.5 h-3.5" />
                Terpasang
              </span>
            ) : (
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Instal</span>
              </button>
            )}

            <button
              onClick={dismissBanner}
              aria-label="Tutup notifikasi pasang aplikasi"
              title="Tutup pemberitahuan"
              className="w-7 h-7 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Petunjuk jika diperlukan (khususnya Safari iOS & fallback manual) */}
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
