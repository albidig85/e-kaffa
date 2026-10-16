import React, { useState } from 'react';
import {
  AppSettings,
  ExpenseRecord,
  IuranRecord,
  KifayahEvent,
  Member,
  UserRole,
} from '../types';
import { formatRupiah, formatDateID } from '../services/storageService';
import {
  FileText,
  TrendingDown,
  TrendingUp,
  Share2,
  Copy,
  Check,
  PlusCircle,
  Wallet,
  Lock,
} from 'lucide-react';
import { ExpenseModal } from './ExpenseModal';

interface ReportsManagerProps {
  role: UserRole;
  settings: AppSettings;
  members: Member[];
  kifayahList: KifayahEvent[];
  iuranList: IuranRecord[];
  expenses: ExpenseRecord[];
  onSaveExpense: (expense: ExpenseRecord) => Promise<void>;
  onOpenLogin: () => void;
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  role,
  settings,
  members,
  kifayahList,
  iuranList,
  expenses,
  onSaveExpense,
  onOpenLogin,
}) => {
  const [selectedKifayahId, setSelectedKifayahId] = useState<string>(
    kifayahList[0]?.id || ''
  );
  const [copiedWa, setCopiedWa] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const currentKifayah = kifayahList.find((k) => k.id === selectedKifayahId) || kifayahList[0];

  // Calculations
  const totalIuranAll = iuranList.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenseAll = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSaldoAll = totalIuranAll - totalExpenseAll;

  // Selected Kifayah stats
  const kIuranList = currentKifayah
    ? iuranList.filter((i) => i.kifayahId === currentKifayah.id)
    : [];
  const kTotalIuran = kIuranList.reduce((acc, curr) => acc + curr.amount, 0);

  const kExpensesList = currentKifayah
    ? expenses.filter((e) => e.kifayahId === currentKifayah.id)
    : [];
  const kTotalExpenses = kExpensesList.reduce((acc, curr) => acc + curr.amount, 0);

  // Build WhatsApp report text
  const generateWhatsAppRekap = () => {
    if (!currentKifayah) return '';

    const listLines = kIuranList.map((item, idx) => {
      return `${idx + 1}. ${item.memberName} (${item.rtRw}) - ${formatRupiah(item.amount)}`;
    }).join('\n');

    return `*LAPORAN REKAPITULASI IURAN KIFAYAH*
*${settings.organizationName}*
=======================================
Bismillahirrohmanirrohim,
Laporan iuran warga atas wafatnya:
Almarhum/ah: *${currentKifayah.deceasedName}*${currentKifayah.binBinti ? ` (${currentKifayah.binBinti})` : ''}
Tanggal Wafat: ${formatDateID(currentKifayah.deathDate)}${currentKifayah.heirName ? `\nAhli Waris: ${currentKifayah.heirName}` : ''}${currentKifayah.notes ? `\nCatatan: ${currentKifayah.notes}` : ''}

*DAFTAR WARGA YANG SUDAH MENYETOR:*
${listLines || '-(Belum ada catatan setoran)-'}

---------------------------------------
*RINGKASAN KEUANGAN:*
• Total Warga Masuk: *${kIuranList.length} orang*
• Total Iuran Terkumpul: *${formatRupiah(kTotalIuran)}*${currentKifayah.funeralCost ? `\n• Biaya Perlengkapan/Makam: *${formatRupiah(currentKifayah.funeralCost)}*` : ''}${currentKifayah.assistanceGiven ? `\n• Santunan ke Ahli Waris: *${formatRupiah(currentKifayah.assistanceGiven)}*` : ''}
=======================================
Bendahara: ${settings.treasurerName} (${settings.treasurerPhone})
_${settings.whatsappFooter}_`;
  };

  const handleCopyWa = async () => {
    const text = generateWhatsAppRekap();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2500);
    } catch {
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2500);
    }
  };

  const handleDirectShareWa = () => {
    const text = generateWhatsAppRekap();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            Laporan Keuangan & Pengeluaran Kas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan transparansi kas masuk, santunan diserahkan, dan biaya pemulasaraan
          </p>
        </div>

        <div className="flex gap-2">
          {role === 'admin' ? (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Catat Kas Keluar
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              <Lock className="w-3.5 h-3.5" />
              Login Admin
            </button>
          )}
        </div>
      </div>

      {/* Global Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <TrendingUp className="w-4 h-4" />
            Total Iuran Masuk (Semua)
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {formatRupiah(totalIuranAll)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{iuranList.length} kali pembayaran</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <TrendingDown className="w-4 h-4" />
            Total Pengeluaran Kas
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {formatRupiah(totalExpenseAll)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{expenses.length} pengeluaran santunan & kafan</p>
        </div>

        <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
            <Wallet className="w-4 h-4" />
            Sisa Saldo Kas Bersih
          </div>
          <div className="text-xl font-extrabold text-white mt-1">
            {formatRupiah(totalSaldoAll)}
          </div>
          <p className="text-[11px] text-emerald-200 mt-0.5">Saldo siap pakai di kas rukun</p>
        </div>
      </div>

      {/* WhatsApp Rekapitulasi Generator */}
      {currentKifayah && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block">
                Generator Pesan WhatsApp RT/RW
              </span>
              <h3 className="font-bold text-slate-900 text-sm mt-1">
                Rekap Iuran Kifayah: {currentKifayah.deceasedName}
              </h3>
            </div>

            {/* Select Kifayah */}
            <select
              value={selectedKifayahId}
              onChange={(e) => setSelectedKifayahId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
            >
              {kifayahList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.deceasedName}
                </option>
              ))}
            </select>
          </div>

          {/* Textarea preview */}
          <div className="relative">
            <textarea
              readOnly
              rows={8}
              value={generateWhatsAppRekap()}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 leading-relaxed select-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleDirectShareWa}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Buka di WhatsApp
            </button>

            <button
              onClick={handleCopyWa}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-all active:scale-95"
            >
              {copiedWa ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiedWa ? 'Teks Tersalin ke Clipboard!' : 'Salin Teks Rekap'}
            </button>
          </div>
        </div>
      )}

      {/* Expenses History List */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Daftar Pengeluaran Kas (Santunan & Pemakaman)</h3>
        
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto border border-slate-100 rounded-xl">
          {expenses.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-400">Belum ada pengeluaran kas dicatat.</p>
          ) : (
            expenses.map((exp) => (
              <div key={exp.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{exp.category}</span>
                    <span className="text-[10px] text-slate-400">({formatDateID(exp.date)})</span>
                  </div>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Penerima: <strong>{exp.recipient}</strong>
                  </span>
                  {exp.notes && (
                    <span className="text-[10px] text-slate-400 italic block">
                      Ket: {exp.notes}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-rose-700 text-sm block">
                    - {formatRupiah(exp.amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Catat Pengeluaran */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        kifayahList={kifayahList}
        onSaveExpense={onSaveExpense}
      />

    </div>
  );
};
