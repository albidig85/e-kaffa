import React, { useState, useMemo } from 'react';
import {
  AppSettings,
  IuranRecord,
  KifayahEvent,
  Member,
  UserRole,
} from '../types';
import { formatRupiah, formatDateID } from '../services/storageService';
import {
  HandCoins,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  PlusCircle,
  Receipt,
  Share2,
  Trash2,
  Sparkles,
  Users,
  Check,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { CurrencyInput } from './CurrencyInput';

interface IuranManagerProps {
  role: UserRole;
  settings: AppSettings;
  members: Member[];
  kifayahList: KifayahEvent[];
  iuranList: IuranRecord[];
  onSaveIuran: (record: IuranRecord) => Promise<void>;
  onBatchSaveIuran: (records: IuranRecord[]) => Promise<void>;
  onDeleteIuran?: (id: string) => void;
  onOpenReceipt: (record: IuranRecord) => void;
  onOpenLogin: () => void;
}

export const IuranManager: React.FC<IuranManagerProps> = ({
  role,
  settings,
  members,
  kifayahList,
  iuranList,
  onSaveIuran,
  onBatchSaveIuran,
  onDeleteIuran,
  onOpenReceipt,
  onOpenLogin,
}) => {
  const [subTab, setSubTab] = useState<'form' | 'checklist' | 'history'>('form');
  const [iuranToDelete, setIuranToDelete] = useState<IuranRecord | null>(null);

  // Form State
  const activeKifayah = kifayahList.find((k) => k.status === 'aktif') || kifayahList[0];
  const [selectedKifayahId, setSelectedKifayahId] = useState<string>(activeKifayah?.id || '');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');
  const [amount, setAmount] = useState<number>(settings.minIuran);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Checklist State
  const [checklistRt, setChecklistRt] = useState<string>('Semua');
  const [selectedMemberIdsForBatch, setSelectedMemberIdsForBatch] = useState<string[]>([]);

  // History search state
  const [historySearch, setHistorySearch] = useState<string>('');

  // Selected kifayah object
  const currentKifayah = useMemo(() => {
    return kifayahList.find((k) => k.id === selectedKifayahId) || kifayahList[0];
  }, [kifayahList, selectedKifayahId]);

  // Minimum fee logic
  const minRequired = currentKifayah?.targetPerMember || settings.minIuran;

  // Filter members list for single input search
  const filteredMembersForDropdown = useMemo(() => {
    if (!memberSearchQuery.trim()) return members.slice(0, 8);
    const q = memberSearchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.rtRw.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q)
    );
  }, [members, memberSearchQuery]);

  // Unique RT list for Checklist
  const uniqueRtList = useMemo(() => {
    const list = Array.from(new Set(members.map((m) => m.rtRw).filter(Boolean)));
    return ['Semua', ...list];
  }, [members]);

  // Checklist Members Filter
  const filteredChecklistMembers = useMemo(() => {
    let result = members;
    if (checklistRt !== 'Semua') {
      result = result.filter((m) => m.rtRw === checklistRt);
    }
    return result;
  }, [members, checklistRt]);

  // Set of members who already paid for currentKifayah
  const paidMembersMap = useMemo(() => {
    const map = new Map<string, IuranRecord>();
    if (!currentKifayah) return map;
    iuranList
      .filter((i) => i.kifayahId === currentKifayah.id)
      .forEach((i) => {
        map.set(i.memberId, i);
      });
    return map;
  }, [iuranList, currentKifayah]);

  // Quick Amount presets
  const presetAmounts = [
    minRequired,
    20000,
    50000,
    100000,
  ];

  // Submit Single Iuran
  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKifayah || !selectedMemberId) return;

    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) return;

    if (amount < minRequired) {
      alert(`Besaran iuran minimal adalah ${formatRupiah(minRequired)} sesuai ketentuan!`);
      return;
    }

    setIsSubmitting(true);
    const dateNum = paymentDate.replace(/-/g, '').slice(0, 6);
    const randNum = Math.floor(100 + Math.random() * 900);
    const receiptNumber = `KWT-${dateNum}-${randNum}`;

    const newRecord: IuranRecord = {
      id: `IUR-${Date.now()}`,
      kifayahId: currentKifayah.id,
      deceasedName: currentKifayah.deceasedName,
      memberId: member.id,
      memberName: member.name,
      rtRw: member.rtRw,
      amount: amount,
      paymentDate: paymentDate,
      paymentMethod: paymentMethod,
      recordedBy: settings.treasurerName || 'Admin e-Kaffa',
      receiptNumber: receiptNumber,
      notes: notes,
    };

    try {
      await onSaveIuran(newRecord);
      setSuccessToast(`Iuran atas nama ${member.name} berhasil dicatat!`);
      setTimeout(() => setSuccessToast(null), 3000);
      onOpenReceipt(newRecord);
      // Reset
      setSelectedMemberId('');
      setMemberSearchQuery('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-tap pay in Checklist
  const handleQuickPay = async (member: Member) => {
    if (!currentKifayah || role !== 'admin') return;

    const dateStr = new Date().toISOString().split('T')[0];
    const dateNum = dateStr.replace(/-/g, '').slice(0, 6);
    const randNum = Math.floor(100 + Math.random() * 900);
    const receiptNumber = `KWT-${dateNum}-${randNum}`;

    const newRecord: IuranRecord = {
      id: `IUR-${Date.now()}`,
      kifayahId: currentKifayah.id,
      deceasedName: currentKifayah.deceasedName,
      memberId: member.id,
      memberName: member.name,
      rtRw: member.rtRw,
      amount: minRequired,
      paymentDate: dateStr,
      paymentMethod: 'Tunai',
      recordedBy: settings.treasurerName || 'Admin e-Kaffa',
      receiptNumber: receiptNumber,
      notes: 'Checklist Cepat',
    };

    await onSaveIuran(newRecord);
    setSuccessToast(`Iuran ${member.name} (${formatRupiah(minRequired)}) tercatat!`);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Batch Pay selected members in Checklist
  const handleBatchPay = async () => {
    if (!currentKifayah || selectedMemberIdsForBatch.length === 0 || role !== 'admin') return;

    const dateStr = new Date().toISOString().split('T')[0];
    const dateNum = dateStr.replace(/-/g, '').slice(0, 6);

    const batchRecords: IuranRecord[] = selectedMemberIdsForBatch.map((mId, idx) => {
      const member = members.find((m) => m.id === mId)!;
      return {
        id: `IUR-${Date.now()}-${idx}`,
        kifayahId: currentKifayah.id,
        deceasedName: currentKifayah.deceasedName,
        memberId: member.id,
        memberName: member.name,
        rtRw: member.rtRw,
        amount: minRequired,
        paymentDate: dateStr,
        paymentMethod: 'Tunai',
        recordedBy: settings.treasurerName || 'Admin e-Kaffa',
        receiptNumber: `KWT-${dateNum}-${Math.floor(100 + Math.random() * 900)}`,
        notes: 'Setor Kolektif',
      };
    });

    await onBatchSaveIuran(batchRecords);
    setSelectedMemberIdsForBatch([]);
    setSuccessToast(`${batchRecords.length} warga berhasil ditandai lunas!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const toggleSelectMemberForBatch = (mId: string) => {
    setSelectedMemberIdsForBatch((prev) =>
      prev.includes(mId) ? prev.filter((id) => id !== mId) : [...prev, mId]
    );
  };

  // History filtered
  const filteredHistory = useMemo(() => {
    let list = iuranList;
    if (selectedKifayahId) {
      list = list.filter((i) => i.kifayahId === selectedKifayahId);
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      list = list.filter(
        (i) =>
          i.memberName.toLowerCase().includes(q) ||
          i.rtRw.toLowerCase().includes(q) ||
          i.receiptNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [iuranList, selectedKifayahId, historySearch]);

  return (
    <div className="space-y-4 pb-12">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-lg border border-emerald-600 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Select Kifayah Target Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Pilih Peristiwa Kifayah (Almarhum/ah)
          </label>
          <div className="mt-1 flex items-center gap-2">
            <select
              value={selectedKifayahId}
              onChange={(e) => setSelectedKifayahId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {kifayahList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.deceasedName} ({k.status === 'aktif' ? 'Sedang Aktif' : 'Selesai'})
                </option>
              ))}
            </select>
            {currentKifayah?.status === 'aktif' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                Aktif
              </span>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right text-xs">
          <span className="text-slate-500 block text-[11px]">Iuran Minimal:</span>
          <span className="font-extrabold text-emerald-800 text-sm">
            {formatRupiah(minRequired)} / Warga
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
        <button
          onClick={() => setSubTab('form')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'form'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HandCoins className="w-3.5 h-3.5" />
          Input Satuan
        </button>

        <button
          onClick={() => setSubTab('checklist')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'checklist'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Checklist per RT
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'history'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Riwayat ({filteredHistory.length})
        </button>
      </div>

      {/* Admin Guard Notice if Viewer */}
      {role !== 'admin' && subTab !== 'history' && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-950">Anda sedang dalam Mode Pelihat (Warga)</span>
              Hanya Admin/Pengurus yang dapat mencatat iuran baru. Silakan login sebagai Admin untuk input iuran.
            </div>
          </div>
          <button
            onClick={onOpenLogin}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shrink-0 shadow-xs"
          >
            Login Admin
          </button>
        </div>
      )}

      {/* TAB 1: FORM INPUT SATUAN */}
      {subTab === 'form' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <form onSubmit={handleSubmitSingle} className="space-y-4">
            
            {/* Pilih Anggota dengan Quick Search */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Nama Anggota (Kepala Keluarga) <span className="text-rose-500">*</span>
              </label>

              {/* Search bar inside select */}
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Ketik nama atau Dusun untuk mencari warga..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Members Chips / Quick Select List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                {filteredMembersForDropdown.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 text-center col-span-2">
                    Warga tidak ditemukan dengan kata kunci tersebut.
                  </p>
                ) : (
                  filteredMembersForDropdown.map((m) => {
                    const isSelected = selectedMemberId === m.id;
                    const alreadyPaid = paidMembersMap.has(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setSelectedMemberId(m.id)}
                        className={`p-2.5 rounded-xl text-left border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span className="block font-semibold">{m.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {m.rtRw.toLowerCase().includes('dusun') ? m.rtRw : `Dusun ${m.rtRw}`}
                          </span>
                        </div>
                        {alreadyPaid ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            Sudah Bayar
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Belum</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Nominal Iuran */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Jumlah Iuran (Rp) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Minimal: {formatRupiah(minRequired)}
                </span>
              </div>

              {/* Quick Nominal Chips */}
              <div className="flex flex-wrap gap-2 mb-2">
                {presetAmounts.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      amount === preset
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {formatRupiah(preset)}
                  </button>
                ))}
              </div>

              <CurrencyInput
                value={amount}
                onChange={(val) => setAmount(val)}
                placeholder="10.000"
                required
                className="w-full py-2 pr-3 bg-slate-50 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {amount < minRequired && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Jumlah iuran tidak boleh kurang dari minimal {formatRupiah(minRequired)}!
                </p>
              )}
            </div>

            {/* Metode Bayar & Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Tunai')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'Tunai'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    💵 Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Transfer')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'Transfer'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    🏦 Transfer Bank
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Bayar
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Titip lewat Pak RT, lunas iuran + infak sukarela"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || role !== 'admin' || !selectedMemberId || amount < minRequired}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan ke Sistem...' : 'Simpan Iuran & Cetak Kuitansi Digital'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: CHECKLIST PER RT (Keliling / Takziah) */}
      {subTab === 'checklist' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Checklist Iuran Cepat per Dusun</h3>
              <p className="text-xs text-slate-500">
                Mudah digunakan saat pengurus keliling warga atau di lokasi takziah.
              </p>
            </div>

            {/* Filter Dusun */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Filter Dusun:</span>
              <select
                value={checklistRt}
                onChange={(e) => setChecklistRt(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
              >
                {uniqueRtList.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt === 'Semua' ? 'Semua Dusun' : (rt.toLowerCase().includes('dusun') ? rt : `Dusun ${rt}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch Pay Action Header */}
          {role === 'admin' && selectedMemberIdsForBatch.length > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-950">
                {selectedMemberIdsForBatch.length} warga dipilih ({formatRupiah(selectedMemberIdsForBatch.length * minRequired)})
              </span>
              <button
                onClick={handleBatchPay}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95"
              >
                Setor Sekaligus ({selectedMemberIdsForBatch.length})
              </button>
            </div>
          )}

          {/* Members Checklist Table / Card Grid */}
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto border border-slate-100 rounded-xl">
            {filteredChecklistMembers.map((member) => {
              const paidRecord = paidMembersMap.get(member.id);
              const isPaid = Boolean(paidRecord);
              const isChecked = selectedMemberIdsForBatch.includes(member.id);

              return (
                <div
                  key={member.id}
                  className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                    isPaid ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox for batch */}
                    {role === 'admin' && !isPaid && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectMemberForBatch(member.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    )}

                    <div>
                      <span className="font-bold text-slate-900 block">{member.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {(member.rtRw.toLowerCase().includes('dusun') ? member.rtRw : `Dusun ${member.rtRw}`)} • {member.address}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {paidRecord ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Lunas {formatRupiah(paidRecord.amount)}
                        </span>
                        <button
                          onClick={() => onOpenReceipt(paidRecord)}
                          title="Lihat Kuitansi"
                          className="p-1 text-slate-400 hover:text-emerald-700"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </div>
                    ) : role === 'admin' ? (
                      <button
                        onClick={() => handleQuickPay(member)}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 hover:border-emerald-500 rounded-lg text-[11px] font-bold shadow-xs active:scale-95 transition-all"
                      >
                        + Bayar {formatRupiah(minRequired)}
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[11px] font-semibold border border-rose-200">
                        Belum
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT IURAN */}
      {subTab === 'history' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Riwayat Pembayaran Iuran</h3>
              <p className="text-xs text-slate-500">
                Total tercatat: {filteredHistory.length} transaksi (
                {formatRupiah(filteredHistory.reduce((a, b) => a + b.amount, 0))})
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cari nama warga, RT, atau no kuitansi..."
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto border border-slate-100 rounded-xl">
            {filteredHistory.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">
                Belum ada data iuran yang cocok dengan pencarian.
              </p>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.memberName}</span>
                      <span className="text-[10px] font-mono text-slate-400">({item.receiptNumber})</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {item.rtRw} • {formatDateID(item.paymentDate)} • Met: {item.paymentMethod}
                    </span>
                    {item.notes && (
                      <span className="text-[10px] text-slate-400 italic block mt-0.5">
                        Ket: {item.notes}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-800 text-sm">
                      {formatRupiah(item.amount)}
                    </span>
                    <button
                      onClick={() => onOpenReceipt(item)}
                      title="Lihat Kuitansi"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                    {role === 'admin' && onDeleteIuran && (
                      <button
                        onClick={() => setIuranToDelete(item)}
                        title="Hapus Catatan Iuran"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Iuran */}
      <ConfirmModal
        isOpen={Boolean(iuranToDelete)}
        title="Hapus Catatan Iuran"
        message={`Apakah Anda yakin ingin menghapus iuran "${iuranToDelete?.memberName}" sebesar ${formatRupiah(iuranToDelete?.amount || 0)} (No: ${iuranToDelete?.receiptNumber})? Data ini akan dihapus dari aplikasi dan Google Sheet.`}
        confirmLabel="Ya, Hapus Iuran"
        onConfirm={async () => {
          if (!iuranToDelete) return;
          try {
            if (onDeleteIuran) {
              await onDeleteIuran(iuranToDelete.id);
            }
            setIuranToDelete(null);
          } catch (err) {
            console.error('Gagal hapus iuran:', err);
          }
        }}
        onClose={() => setIuranToDelete(null)}
      />

    </div>
  );
};
