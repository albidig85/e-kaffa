import React from 'react';
import { X, Share, PlusSquare, Smartphone, CheckCircle, ExternalLink } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  appName?: string;
  onTriggerInstall?: () => Promise<boolean>;
  canPromptNative?: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  appName = 'e-Kafah',
  onTriggerInstall,
  canPromptNative = false,
}) => {
  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (onTriggerInstall) {
      const ok = await onTriggerInstall();
      if (ok) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="relative bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5">
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-950 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/pwa-192x192.png"
                alt={appName}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded-full mb-1">
                Progressive Web App
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Pasang {appName} di Layar HP
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Pasang aplikasi ini ke layar utama smartphone Anda agar dapat dibuka langsung seperti aplikasi Android/iOS asli: lebih cepat, hemat kuota, dan tanpa bilah alamat browser.
          </p>

          {canPromptNative ? (
            <div className="pt-2">
              <button
                onClick={handleNativeInstall}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Instal Langsung Sekarang</span>
              </button>
            </div>
          ) : isIOS ? (
            /* Panduan Safari iOS */
            <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                Cara Pasang di iPhone / iPad (Safari):
              </h4>
              <ol className="text-xs text-slate-700 space-y-2.5 pl-1">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Ketuk tombol <strong>Bagikan (Share)</strong> <Share className="inline w-3.5 h-3.5 text-blue-600 mx-1" /> pada bilah menu Safari di bagian bawah.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Gulir menu ke bawah lalu pilih menu <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong> <PlusSquare className="inline w-3.5 h-3.5 text-slate-700 mx-1" />.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas. Ikon {appName} akan langsung muncul di menu HP Anda!
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            /* Panduan Android Browser Chrome / Samsung Internet */
            <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                Cara Pasang di Browser Smartphone (Android):
              </h4>
              <ol className="text-xs text-slate-700 space-y-2.5 pl-1">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Ketuk <strong>menu titik tiga (⋮)</strong> di pojok kanan atas browser Anda.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Pilih menu <strong>Instal Aplikasi</strong> atau <strong>Tambahkan ke Layar Utama (Add to Home screen)</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Konfirmasi dengan memilih <strong>Instal</strong>. Aplikasi siap digunakan secara instan.
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* Keuntungan Fitur */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Akses Cepat 1 Ketukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Layar Penuh Standalone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Hemat Memori & Kuota</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Terhubung Google Sheets</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
