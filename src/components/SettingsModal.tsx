import React, { useState } from 'react';
import { AppSettings } from '../types';
import { GasService } from '../services/gasService';
import {
  X,
  Save,
  KeyRound,
  Coins,
  Building2,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
  Eye,
  EyeOff,
  ExternalLink,
  Wrench,
} from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
  onOpenGuide: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onSave,
  onClose,
  onOpenGuide,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);
  const [initStatus, setInitStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'minIuran' || name === 'defaultSantunan' ? Number(value) || 0 : value,
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.gasUrl) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setTestStatus({ loading: true });
    const result = await GasService.testConnection(formData.gasUrl);
    if (result.normalizedUrl && result.normalizedUrl !== formData.gasUrl) {
      setFormData((prev) => ({ ...prev, gasUrl: result.normalizedUrl }));
    }
    setTestStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });
  };

  const handleInitSheets = async () => {
    if (!formData.gasUrl) {
      setInitStatus({
        loading: false,
        success: false,
        message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setInitStatus({ loading: true });
    const result = await GasService.initializeSheets(formData.gasUrl);
    if (result.normalizedUrl && result.normalizedUrl !== formData.gasUrl) {
      setFormData((prev) => ({ ...prev, gasUrl: result.normalizedUrl }));
    }
    setInitStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });
  };

  const handleOpenDirectInit = () => {
    const norm = formData.gasUrl.trim().replace(/\/+$/, '');
    const cleanUrl = norm.includes('script.google.com/macros/s/') && !norm.endsWith('/exec')
      ? `${norm}/exec`
      : norm;
    if (!cleanUrl) return;
    const directUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=init`;
    window.open(directUrl, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-800 rounded-lg">
              <Coins className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Pengaturan Aplikasi & Keuangan</h2>
              <p className="text-xs text-emerald-200">Atur minimal iuran, akun admin & integrasi Google Sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          
          {/* Section 1: Besaran Keuangan */}
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-4">
            <h3 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-700" />
              1. Besaran Iuran & Santunan (Rupiah)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimal Iuran Per Warga (Rp) <span className="text-rose-500">*</span>
                </label>
                <CurrencyInput
                  value={formData.minIuran}
                  onChange={(val) => setFormData((prev) => ({ ...prev, minIuran: val }))}
                  placeholder="10.000"
                  required
                  className="w-full py-2 pr-3 bg-white rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Standar minimal yang harus dibayar warga tiap ada kifayah.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Standar Santunan Keluarga Duka (Rp)
                </label>
                <CurrencyInput
                  value={formData.defaultSantunan}
                  onChange={(val) => setFormData((prev) => ({ ...prev, defaultSantunan: val }))}
                  placeholder="1.500.000"
                  className="w-full py-2 pr-3 bg-white rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Rekomendasi nominal uang santunan ke ahli waris.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: User & Sandi Admin */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              2. Kredensial & Sandi Login Admin (Pengurus)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Admin
                </label>
                <input
                  type="text"
                  name="adminUsername"
                  value={formData.adminUsername}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Admin
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="adminPasswordHash"
                    value={formData.adminPasswordHash}
                    onChange={handleChange}
                    required
                    className="w-full pl-3 pr-10 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Digunakan bendahara untuk mencatat iuran & ubah data.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Identitas Organisasi */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              3. Profil Paguyuban & Kontak Bendahara
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lembaga / Rukun Kifayah
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Bendahara / Pengurus
                </label>
                <input
                  type="text"
                  name="treasurerName"
                  value={formData.treasurerName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Bendahara
                </label>
                <input
                  type="text"
                  name="treasurerPhone"
                  value={formData.treasurerPhone}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pesan Penutup Kuitansi & WhatsApp
                </label>
                <input
                  type="text"
                  name="whatsappFooter"
                  value={formData.whatsappFooter}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Database Google Sheets via Google Apps Script (GAS) */}
          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-300/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-700" />
                4. Integrasi Database Google Sheets (GAS)
              </h3>
              <button
                type="button"
                onClick={onOpenGuide}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-medium self-start sm:self-auto transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Panduan Deploy & Kode Script
              </button>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  URL Web App Google Apps Script
                </label>
                {formData.gasUrl && !formData.gasUrl.endsWith('/exec') && formData.gasUrl.includes('script.google.com') && (
                  <span className="text-[11px] text-amber-700 font-medium">
                    ⚠️ URL belum ada /exec (akan otomatis ditambahkan)
                  </span>
                )}
              </div>
              <input
                type="url"
                name="gasUrl"
                value={formData.gasUrl}
                onChange={handleChange}
                onBlur={() => {
                  if (formData.gasUrl && formData.gasUrl.includes('script.google.com') && !formData.gasUrl.endsWith('/exec')) {
                    const norm = formData.gasUrl.trim().replace(/\/+$/, '') + '/exec';
                    setFormData((prev) => ({ ...prev, gasUrl: norm }));
                  }
                }}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Diperoleh setelah deploy script di menu Ekstensi &gt; Apps Script Google Sheets. <strong>Harus berakhiran <code>/exec</code></strong>.
              </p>
            </div>

            {/* Action Buttons for GAS */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus?.loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {testStatus?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-slate-500" />}
                Tes Koneksi
              </button>

              <button
                type="button"
                onClick={handleInitSheets}
                disabled={initStatus?.loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {initStatus?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-200" />}
                Inisialisasi Sheet & Kolom Otomatis
              </button>

              {formData.gasUrl && (
                <button
                  type="button"
                  onClick={handleOpenDirectInit}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                  title="Jalankan inisialisasi sheet langsung di tab baru browser (bebas CORS)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                  Buka Inisialisasi di Tab Baru
                </button>
              )}
            </div>

            {/* Test result message */}
            {testStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 whitespace-pre-line ${
                  testStatus.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-50 text-rose-800'
                }`}
              >
                {testStatus.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}

            {/* Init result message */}
            {initStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex flex-col gap-2 ${
                  initStatus.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-50 text-rose-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {initStatus.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="whitespace-pre-line">{initStatus.message}</div>
                </div>

                {!initStatus.success && formData.gasUrl && (
                  <div className="pt-2 border-t border-rose-200 mt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-rose-900 font-medium">
                      Atau jalankan pembuatan sheet secara langsung:
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenDirectInit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Klik Di Sini: Inisialisasi di Tab Baru
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Submit */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
