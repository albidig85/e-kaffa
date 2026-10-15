import React, { useState, useEffect, useRef } from 'react';
import { ExpenseRecord, KifayahEvent } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { X, TrendingDown, Save } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  kifayahList: KifayahEvent[];
  onSaveExpense: (expense: ExpenseRecord) => Promise<void>;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  kifayahList,
  onSaveExpense,
}) => {
  const [selectedKifayahId, setSelectedKifayahId] = useState('');
  const [category, setCategory] = useState<ExpenseRecord['category']>('Santunan Keluarga');
  const [amount, setAmount] = useState<number>(0);
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Default to active kifayah if available
      const activeK = kifayahList.find((k) => k.status === 'aktif') || kifayahList[0];
      setSelectedKifayahId(activeK ? activeK.id : '');
      setDate(new Date().toISOString().split('T')[0]);
      setAmount(0);
      setRecipient('');
      setNotes('');
      setCategory('Santunan Keluarga');

      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, kifayahList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || amount <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    const newExp: ExpenseRecord = {
      id: `EXP-${Date.now()}`,
      kifayahId: selectedKifayahId || undefined,
      date: date || new Date().toISOString().split('T')[0],
      category: category,
      amount: amount,
      recipient: recipient.trim(),
      notes: notes.trim(),
    };

    try {
      await onSaveExpense(newExp);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (recipient.trim() && amount > 0 && !isSubmitting) {
        handleSubmit(e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-800 rounded-lg">
              <TrendingDown className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Catat Pengeluaran Kas</h3>
              <p className="text-[11px] text-rose-200">Otomatis masuk ke Sheet PENGELUARAN di Google Sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-rose-200 hover:text-white hover:bg-rose-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700"
        >
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Peristiwa Kifayah (Terkait)
            </label>
            <select
              value={selectedKifayahId}
              onChange={(e) => setSelectedKifayahId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">(Pengeluaran Umum / Operasional Kas)</option>
              {kifayahList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.deceasedName} {k.deathDate ? `(${k.deathDate})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Kategori Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Santunan Keluarga">Santunan Keluarga Duka</option>
              <option value="Kain Kafan & Pemulasaraan">Kain Kafan & Pemulasaraan</option>
              <option value="Makam & Penggalian">Makam & Penggalian</option>
              <option value="Ambulans">Ambulans</option>
              <option value="Konsumsi Takziah">Konsumsi Takziah</option>
              <option value="Operasional">Operasional Rukun Kifayah</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Jumlah Pengeluaran (Rp) <span className="text-rose-500">*</span>
            </label>
            <CurrencyInput
              ref={amountInputRef}
              value={amount}
              onChange={(val) => setAmount(val)}
              placeholder="Contoh: 1.500.000"
              required
              className="w-full py-2 pr-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Penerima Uang / Toko <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Contoh: Ahli Waris / Toko Perlengkapan Barokah"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Tanggal Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Keterangan / Rincian
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Santunan diserahkan tunai ke ahli waris / Pembelian kain kafan mori prima..."
              rows={2}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Tekan Enter untuk Simpan Cepat
            </span>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || amount <= 0 || !recipient.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
