import React, { useState } from 'react';
import { GAS_SCRIPT_CODE } from '../data/gasScriptCode';
import { X, Copy, Check, ExternalLink, HelpCircle, Sparkles, Globe, ShieldCheck } from 'lucide-react';

interface GasGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasGuideModal: React.FC<GasGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'gas' | 'vercel' | 'code'>('gas');

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GAS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-800 rounded-lg">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Panduan Integrasi Google Sheets & Vercel</h2>
              <p className="text-xs text-emerald-200">Database otomatis tanpa ketik kolom manual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('gas')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'gas'
                ? 'border-emerald-600 text-emerald-800 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            1. Pasang Google Apps Script (GAS)
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'vercel'
                ? 'border-emerald-600 text-emerald-800 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            2. Publish ke Vercel.com
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-800 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Copy className="w-4 h-4" />
            Kode Lengkap (Code.gs)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          
          {/* TAB 1: GAS */}
          {activeTab === 'gas' && (
            <div className="space-y-5">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-950">Anda TIDAK PERLU membuat kolom sheet secara manual!</span>
                  Script kami sudah dilengkapi generator otomatis yang akan membuat 5 sheet (PENGATURAN, ANGGOTA, KIFAYAH, IURAN, PENGELUARAN) lengkap dengan warna header hijau emerald, border rapi, dan data percontohan.
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</span>
                  Buat File Google Spreadsheet Baru
                </h3>
                <p className="text-xs text-slate-600 pl-8">
                  Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-700 font-medium underline inline-flex items-center gap-1">sheets.new <ExternalLink className="w-3 h-3" /></a> di browser Anda. Beri nama file, misalnya: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-900">Database Kas Kifayah Raudlatul Umam</code>.
                </p>

                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">2</span>
                  Buka Editor Apps Script & Tempel Kode
                </h3>
                <div className="text-xs text-slate-600 pl-8 space-y-2">
                  <p>Pada Google Spreadsheet tersebut, klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</p>
                  <p>Hapus semua kode bawaan yang ada di file <code className="bg-slate-100 px-1.5 py-0.5 rounded">Code.gs</code>, lalu tempel kode otomatis dari aplikasi ini:</p>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg text-xs shadow-xs transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Kode Berhasil Disalin!' : 'Salin Kode Script (Code.gs)'}
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</span>
                  Deploy Sebagai Aplikasi Web (Paling Penting)
                </h3>
                <div className="text-xs text-slate-600 pl-8 space-y-2">
                  <p>Di kanan atas halaman Apps Script, klik tombol biru <strong>Deploy (Terapkan)</strong> &gt; <strong>Deployment baru (New deployment)</strong>.</p>
                  <p>Klik ikon gerigi di sebelah kiri, pilih <strong>Aplikasi web (Web app)</strong>.</p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 font-mono text-[11px]">
                    <p><span className="text-slate-400">Deskripsi:</span> e-Kaffa Web API</p>
                    <p><span className="text-slate-400">Jalankan sebagai (Execute as):</span> <strong>Saya (email Anda)</strong></p>
                    <p><span className="text-slate-400">Siapa yang memiliki akses (Who has access):</span> <strong className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">Siapa saja (Anyone)</strong></p>
                  </div>
                  <p className="text-[11px] text-amber-700 italic">
                    *Catatan: Pastikan opsi "Who has access" adalah "Anyone" agar aplikasi di HP Android dan Vercel dapat membaca & mencatat iuran secara instan.
                  </p>
                  <p>Klik <strong>Deploy</strong>, lalu berikan izin Google (Review Permissions &gt; Pilih Akun &gt; Advanced &gt; Go to ... (unsafe) &gt; Allow).</p>
                </div>

                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">4</span>
                  Salin URL Web App & Klik "Inisialisasi Otomatis" di e-Kaffa
                </h3>
                <div className="text-xs text-slate-600 pl-8 space-y-2">
                  <p>Salin <strong>URL Aplikasi Web</strong> yang dihasilkan (berformat <code className="bg-slate-100 px-1 rounded">https://script.google.com/macros/s/.../exec</code>).</p>
                  <p>Kembali ke aplikasi e-Kaffa ini, buka menu <strong>Pengaturan</strong>, masukkan URL tersebut, lalu klik tombol <strong>"Inisialisasi Sheet Otomatis"</strong>.</p>
                  <p className="text-emerald-800 font-medium">Seketika itu juga, 5 sheet dengan header warna hijau rapi akan otomatis tercipta di spreadsheet Anda tanpa ribet!</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERCEL */}
          {activeTab === 'vercel' && (
            <div className="space-y-5">
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900">
                <span className="font-bold block text-blue-950">Vercel.com adalah platform gratis terbaik untuk mem-publish web aplikasi ini.</span>
                Aplikasi Anda akan mendapatkan tautan HTTPS super cepat (contoh: <code>e-kaffa.vercel.app</code>) dan dapat dipasang langsung di HP Android pengurus maupun warga.
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">A</span>
                  Publish Menggunakan GitHub & Vercel (Rekomendasi)
                </h3>
                <div className="text-xs text-slate-600 pl-8 space-y-2">
                  <p>1. Buat repositori baru di akun GitHub Anda (misal: <code>e-kaffa-raudlatul-umam</code>).</p>
                  <p>2. Unggah/Push semua file source code proyek ini ke repositori GitHub tersebut.</p>
                  <p>3. Buka <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-700 underline font-medium">vercel.com</a> dan login menggunakan akun GitHub Anda.</p>
                  <p>4. Klik tombol <strong>Add New...</strong> &gt; <strong>Project</strong>.</p>
                  <p>5. Pilih repositori <code>e-kaffa-raudlatul-umam</code>, lalu klik <strong>Import</strong>.</p>
                  <p>6. Vercel akan otomatis mendeteksi Framework: <strong>Vite</strong>.</p>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-600">
                    <div>Build Command: npm run build</div>
                    <div>Output Directory: dist</div>
                  </div>
                  <p>7. Klik tombol <strong>Deploy</strong>. Tunggu sekitar 1 menit, dan website Anda telah live di internet!</p>
                </div>

                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">B</span>
                  Publish Alternatif Lewat Vercel CLI (Terminal)
                </h3>
                <div className="text-xs text-slate-600 pl-8 space-y-2">
                  <p>Bila Anda terbiasa dengan terminal/command prompt:</p>
                  <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded text-[11px] overflow-x-auto">
{`npm install -g vercel
vercel login
vercel --prod`}
                  </pre>
                  <p>Jawab pertanyaan di terminal dengan menekan tombol <strong>Enter</strong>.</p>
                </div>

                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">C</span>
                  Memasang di HP Android Pengurus & Warga (PWA-Like)
                </h3>
                <div className="text-xs text-slate-600 pl-8 space-y-1.5">
                  <p>Aplikasi e-Kaffa dirancang khusus untuk kenyamanan layar sentuh Android:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Buka tautan Vercel Anda di Google Chrome HP Android.</li>
                    <li>Ketuk ikon titik tiga (<strong>⋮</strong>) di pojok kanan atas browser.</li>
                    <li>Pilih <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home screen) atau <strong>"Instal Aplikasi"</strong>.</li>
                    <li>Aplikasi akan muncul di layar menu HP seperti aplikasi Android reguler, cepat dibuka tanpa perlu mengetik alamat URL lagi!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">File: Code.gs (Salin dan tempel di Apps Script)</span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded text-xs shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin!' : 'Salin Kode'}
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[380px] leading-relaxed select-all">
                {GAS_SCRIPT_CODE}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Aplikasi tetap dapat digunakan 100% normal dengan penyimpanan lokal walau belum dihubungkan.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            Tutup Panduan
          </button>
        </div>

      </div>
    </div>
  );
};
