import React, { useState } from 'react';
import { AppSettings, IuranRecord, KifayahEvent, Member, UserRole } from '../types';
import { formatRupiah, formatDateID } from '../services/storageService';
import {
  HeartHandshake,
  PlusCircle,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  Share2,
  TrendingUp,
  Receipt,
  X,
  Lock,
  Edit,
  Trash2,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { CurrencyInput } from './CurrencyInput';

interface KifayahManagerProps {
  role: UserRole;
  settings: AppSettings;
  members: Member[];
  kifayahList: KifayahEvent[];
  iuranList: IuranRecord[];
  onSaveKifayah: (kifayah: KifayahEvent) => Promise<void>;
  onDeleteKifayah?: (id: string) => Promise<void> | void;
  onOpenLogin: () => void;
}

export const KifayahManager: React.FC<KifayahManagerProps> = ({
  role,
  settings,
  members,
  kifayahList,
  iuranList,
  onSaveKifayah,
  onDeleteKifayah,
  onOpenLogin,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKifayah, setEditingKifayah] = useState<KifayahEvent | null>(null);
  const [kifayahToDelete, setKifayahToDelete] = useState<KifayahEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deceasedName, setDeceasedName] = useState('');
  const [binBinti, setBinBinti] = useState('');
  const [deathDate, setDeathDate] = useState(new Date().toISOString().split('T')[0]);
  const [heirName, setHeirName] = useState('');
  const [address, setAddress] = useState('');
  const [targetPerMember, setTargetPerMember] = useState(settings.minIuran);
  const [assistanceGiven, setAssistanceGiven] = useState(settings.defaultSantunan);
  const [funeralCost, setFuneralCost] = useState(450000);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMembersCount = members.filter((m) => m.status === 'aktif').length;

  const handleOpenAdd = () => {
    setEditingKifayah(null);
    setDeceasedName('');
    setBinBinti('');
    setDeathDate(new Date().toISOString().split('T')[0]);
    setHeirName('');
    setAddress('');
    setTargetPerMember(settings.minIuran);
    setAssistanceGiven(settings.defaultSantunan);
    setFuneralCost(450000);
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: KifayahEvent) => {
    setEditingKifayah(item);
    setDeceasedName(item.deceasedName);
    setBinBinti(item.binBinti || '');
    setDeathDate(item.deathDate);
    setHeirName(item.heirName);
    setAddress(item.address);
    setTargetPerMember(item.targetPerMember || settings.minIuran);
    setAssistanceGiven(item.assistanceGiven || 0);
    setFuneralCost(item.funeralCost || 0);
    setNotes(item.notes || '');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deceasedName || !heirName) return;

    setIsSubmitting(true);
    const kifayahToSave: KifayahEvent = {
      id: editingKifayah ? editingKifayah.id : `KFY-${Date.now()}`,
      deceasedName,
      binBinti,
      deathDate,
      heirName,
      address,
      targetPerMember: Number(targetPerMember) || settings.minIuran,
      status: editingKifayah ? editingKifayah.status : 'aktif',
      assistanceGiven: Number(assistanceGiven) || 0,
      funeralCost: Number(funeralCost) || 0,
      notes,
      createdAt: editingKifayah ? editingKifayah.createdAt : new Date().toISOString(),
    };

    try {
      await onSaveKifayah(kifayahToSave);
      setShowAddModal(false);
      setEditingKifayah(null);
      // Reset form
      setDeceasedName('');
      setBinBinti('');
      setHeirName('');
      setAddress('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: KifayahEvent) => {
    if (role !== 'admin') return;
    const updated: KifayahEvent = {
      ...item,
      status: item.status === 'aktif' ? 'selesai' : 'aktif',
    };
    await onSaveKifayah(updated);
  };

  const handleShareKifayahReport = (item: KifayahEvent) => {
    const kIuran = iuranList.filter((i) => i.kifayahId === item.id);
    const totalTerkumpul = kIuran.reduce((acc, curr) => acc + curr.amount, 0);
    const pembayarCount = new Set(kIuran.map((i) => i.memberId)).size;

    const text = `*LAPORAN KAS KIFAYAH & SANTUNAN*
*${settings.organizationName}*
---------------------------------------
Almarhum/ah: *${item.deceasedName}* (${item.binBinti})
Tanggal Wafat: ${formatDateID(item.deathDate)}
Ahli Waris: ${item.heirName}
Alamat: ${item.address}

*RINCIAN KEUANGAN KIFAYAH:*
1. Total Iuran Warga Terkumpul: *${formatRupiah(totalTerkumpul)}* (${pembayarCount} warga)
2. Biaya Kain Kafan & Makam: *${formatRupiah(item.funeralCost)}*
3. Santunan Diserahkan ke Keluarga: *${formatRupiah(item.assistanceGiven)}*
---------------------------------------
Status Kifayah: *${item.status === 'aktif' ? 'Masih Dihimpun' : 'Selesai / Ditutup'}*
Bendahara: ${settings.treasurerName} (${settings.treasurerPhone})

_${settings.whatsappFooter}_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-12">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-700" />
            Data Peristiwa Kifayah (Kematian Warga)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catatan orang meninggal, biaya kain kafan, dan penyaluran santunan duka
          </p>
        </div>

        {role === 'admin' ? (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Input Kifayah Baru
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            <Lock className="w-3.5 h-3.5" />
            Login Admin untuk Input
          </button>
        )}
      </div>

      {/* List of Kifayah */}
      <div className="space-y-4">
        {kifayahList.map((item) => {
          const kIuran = iuranList.filter((i) => i.kifayahId === item.id);
          const totalTerkumpul = kIuran.reduce((acc, curr) => acc + curr.amount, 0);
          const paidCount = new Set(kIuran.map((i) => i.memberId)).size;
          const progressPercent = activeMembersCount > 0 ? Math.min(100, Math.round((paidCount / activeMembersCount) * 100)) : 0;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      item.status === 'aktif'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.status === 'aktif' ? 'Pengumpulan Aktif' : 'Telah Selesai'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Tgl Wafat: {formatDateID(item.deathDate)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleShareKifayahReport(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share WA
                  </button>

                  {role === 'admin' && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
                        title="Edit Data Almarhum & Kifayah"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                        Edit Data
                      </button>

                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          item.status === 'aktif'
                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {item.status === 'aktif' ? 'Tutup / Selesaikan' : 'Buka Kembali'}
                      </button>

                      {onDeleteKifayah && (
                        <button
                          onClick={() => setKifayahToDelete(item)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                          title="Hapus Kifayah"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Card Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {item.deceasedName}
                  </h3>
                  <p className="text-xs text-slate-500 italic mb-2">{item.binBinti}</p>
                  
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>Ahli Waris:</strong> {item.heirName}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>Alamat:</strong> {item.address}</span>
                    </p>
                    {item.notes && (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        Catatan: {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Financial Summary for this Kifayah */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Iuran Terkumpul:</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {formatRupiah(totalTerkumpul)} ({paidCount} warga)
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Biaya Kain Kafan & Makam:</span>
                    <span className="font-semibold text-rose-700">
                      {formatRupiah(item.funeralCost)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Santunan Ahli Waris:</span>
                    <span className="font-semibold text-slate-800">
                      {formatRupiah(item.assistanceGiven)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-600">
                      <span>Progres Iuran: {progressPercent}%</span>
                      <span>Target: {formatRupiah(item.targetPerMember)} / warga</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Kifayah */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">
                  {editingKifayah ? 'Edit Data Kifayah / Almarhum' : 'Input Peristiwa Kifayah (Kematian)'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingKifayah(null);
                }}
                className="p-1 rounded-full text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              
              <div>
                <label className="block font-bold mb-1">
                  Nama Almarhum / Almarhumah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={deceasedName}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  placeholder="Contoh: Bpk. H. Sudirman"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Bin / Binti</label>
                  <input
                    type="text"
                    value={binBinti}
                    onChange={(e) => setBinBinti(e.target.value)}
                    placeholder="Contoh: Bin H. Mansyur"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Tanggal Wafat</label>
                  <input
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Nama Ahli Waris (Keluarga) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={heirName}
                  onChange={(e) => setHeirName(e.target.value)}
                  placeholder="Contoh: Ibu Hj. Nurhayati (Istri)"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Alamat Rumah Duka</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Kenanga No. 08, RT 01 / RW 03"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Iuran / Warga</label>
                  <CurrencyInput
                    value={targetPerMember}
                    onChange={(val) => setTargetPerMember(val)}
                    placeholder="10.000"
                    className="w-full py-2 pr-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Biaya Kafan/Makam</label>
                  <CurrencyInput
                    value={funeralCost}
                    onChange={(val) => setFuneralCost(val)}
                    placeholder="200.000"
                    className="w-full py-2 pr-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Santunan Keluarga</label>
                  <CurrencyInput
                    value={assistanceGiven}
                    onChange={(val) => setAssistanceGiven(val)}
                    placeholder="1.000.000"
                    className="w-full py-2 pr-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Catatan Tambahan</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Tempat pemakaman TPU Raudlatul Jannah bada dhuhur..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingKifayah(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs active:scale-95"
                >
                  {isSubmitting ? 'Menyimpan...' : editingKifayah ? 'Simpan Perubahan Data' : 'Simpan Kifayah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Kifayah */}
      <ConfirmModal
        isOpen={Boolean(kifayahToDelete)}
        title="Hapus Peristiwa Kifayah"
        message={`Apakah Anda yakin ingin menghapus catatan peristiwa kematian "${kifayahToDelete?.deceasedName}"? Data ini akan dihapus dari aplikasi dan Google Sheet.`}
        confirmLabel="Ya, Hapus Kifayah"
        isProcessing={isDeleting}
        onConfirm={async () => {
          if (!kifayahToDelete) return;
          setIsDeleting(true);
          try {
            if (onDeleteKifayah) {
              await onDeleteKifayah(kifayahToDelete.id);
            }
            setKifayahToDelete(null);
          } finally {
            setIsDeleting(false);
          }
        }}
        onClose={() => {
          if (!isDeleting) {
            setKifayahToDelete(null);
          }
        }}
      />

    </div>
  );
};
