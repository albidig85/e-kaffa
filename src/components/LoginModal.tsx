import React, { useState } from 'react';
import { UserRole, AppSettings } from '../types';
import { X, ShieldCheck, UserCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  currentRole: UserRole;
  settings: AppSettings;
  onSelectRole: (role: UserRole) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentRole,
  settings,
  onSelectRole,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'admin' | 'public'>('admin');

  if (!isOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validUser = settings.adminUsername || 'admin';
    const validPass = settings.adminPasswordHash || 'admin123';

    if (username.trim() === validUser && password === validPass) {
      onSelectRole('admin');
      onClose();
    } else {
      setError('Username atau Kata Sandi Admin salah! Default: admin / admin123');
    }
  };

  const handlePublicLogin = () => {
    onSelectRole('public');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <h2 className="text-base font-bold">Pilih Akses Pengguna</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 gap-1 text-xs font-semibold">
          <button
            onClick={() => { setTab('admin'); setError(null); }}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'admin'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Pengurus / Admin
          </button>
          <button
            onClick={() => { setTab('public'); setError(null); }}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'public'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Warga / Pelihat
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {tab === 'admin' ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-xs text-emerald-900">
                <p className="font-semibold text-emerald-950">Akses Penuh Pengurus / Bendahara</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Dapat mencatat iuran, menambah anggota, menginput peristiwa kematian, dan mengubah pengaturan.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Masuk Sebagai Admin
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-[11px] text-slate-400">
                  Default akun baru: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">admin</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">admin123</code>
                </span>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Masuk Sebagai Warga / Pelihat</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Mode transparansi publik tanpa kata sandi. Warga dapat memantau total kas, melihat almarhum/ah aktif, dan mengecek status iuran keluarga.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handlePublicLogin}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  Buka Sebagai Pelihat (Warga)
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
