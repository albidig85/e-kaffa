import React, { useState } from 'react';
import { AppSettings, IuranRecord, KifayahEvent, Member, UserRole } from '../types';
import { formatRupiah, formatDateID } from '../services/storageService';
import {
  HeartHandshake,
  PlusCircle,
  Calendar,
  User,
  MapPin,
  Share2,
  X,
  Edit,
  Trash2,
  Lock,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface KifayahManagerProps {
  role: UserRole;
  settings: AppSettings;
  members: Member[];
  kifayahList: KifayahEvent[];
  iuranList: IuranRecord[];
  onSaveKifayah: (kifayah: KifayahEvent, deceasedMemberId?: string) => Promise<void>;
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

  // Form State (Hanya Nama Almarhum, Tanggal Wafat, dan Catatan Tambahan)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isManualName, setIsManualName] = useState(false);
  const [deceasedName, setDeceasedName] = useState('');
  const [deathDate, setDeathDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMembersCount = members.filter((m) => m.status === 'aktif').length;

  const handleOpenAdd = () => {
    setEditingKifayah(null);
    setSelectedMemberId('');
    setIsManualName(false);
    setDeceasedName('');
    setDeathDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: KifayahEvent) => {
    setEditingKifayah(item);
    const matched = members.find(
      (m) =>
        (item.deceasedMemberId && m.id === item.deceasedMemberId) ||
        m.name.toLowerCase() === item.deceasedName.trim().toLowerCase()
    );
    if (matched) {
      setSelectedMemberId(matched.id);
      setIsManualName(false);
    } else {
      setSelectedMemberId('');
      setIsManualName(true);
    }
    setDeceasedName(item.deceasedName);
    setDeathDate(item.deathDate);
    setNotes(item.notes || '');
    setShowAddModal(true);
  };

  const handleSelectMember = (memberId: string) => {
    if (memberId === 'manual') {
      setIsManualName(true);
      setSelectedMemberId('');
      setDeceasedName('');
      return;
    }
    setSelectedMemberId(memberId);
    setIsManualName(false);
    const m = members.find((item) => item.id === memberId);
    if (m) {
      setDeceasedName(m.name);
    } else {
      setDeceasedName('');
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!deceasedName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const kifayahToSave: KifayahEvent = {
      id: editingKifayah ? editingKifayah.id : `KFY-${Date.now()}`,
      deceasedName: deceasedName.trim(),
      deceasedMemberId: selectedMemberId || undefined,
      deathDate,
      notes: notes.trim(),
      status: editingKifayah ? editingKifayah.status : 'aktif',
      createdAt: editingKifayah ? editingKifayah.createdAt : new Date().toISOString(),
      // Nilai bawaan untuk kompatibilitas data
      targetPerMember: editingKifayah?.targetPerMember || settings.minIuran,
      binBinti: editingKifayah?.binBinti || '',
      heirName: editingKifayah?.heirName || '',
      address: editingKifayah?.address || '',
      assistanceGiven: editingKifayah?.assistanceGiven || 0,
      funeralCost: editingKifayah?.funeralCost || 0,
    };

    try {
      await onSaveKifayah(kifayahToSave, selectedMemberId || undefined);
      setShowAddModal(false);
      setEditingKifayah(null);
      // Reset form
      setSelectedMemberId('');
      setDeceasedName('');
      setDeathDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shortcut Enter untuk Simpan Kifayah instan di PC
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLButtonElement) {
      return;
    }

    if (e.key === 'Enter') {
      if (e.target instanceof HTMLTextAreaElement && e.shiftKey) {
        return;
      }
      e.preventDefault();
      if (!deceasedName.trim()) {
        return;
      }
      if (!isSubmitting) {
        handleSubmit(e);
      }
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

    const lines = [
      `*LAPORAN PERISTIWA KIFAYAH*`,
      `*${settings.organizationName}*`,
      `---------------------------------------`,
      `Almarhum/ah: *${item.deceasedName}*${item.binBinti ? ` (${item.binBinti})` : ''}`,
      `Tanggal Wafat: ${formatDateID(item.deathDate)}`,
      item.heirName ? `Ahli Waris: ${item.heirName}` : '',
      item.address ? `Alamat: ${item.address}` : '',
      item.notes ? `Catatan: ${item.notes}` : '',
      `---------------------------------------`,
      `*STATUS PENGUMPULAN IURAN:*`,
      `Total Iuran Warga Masuk: *${formatRupiah(totalTerkumpul)}* (${pembayarCount} warga)`,
      `Status Kifayah: *${item.status === 'aktif' ? 'Pengumpulan Masih Berjalan' : 'Selesai / Ditutup'}*`,
      `---------------------------------------`,
      `Bendahara: ${settings.treasurerName} (${settings.treasurerPhone})`,
      ``,
      `_${settings.whatsappFooter}_`,
    ].filter(Boolean);

    const text = lines.join('\n');
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
                  {item.binBinti && (
                    <p className="text-xs text-slate-500 italic mb-1">{item.binBinti}</p>
                  )}
                  
                  <div className="text-xs text-slate-600 space-y-1.5 mt-2">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><strong>Tanggal Wafat:</strong> {formatDateID(item.deathDate)}</span>
                    </p>
                    {item.heirName && (
                      <p className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span><strong>Ahli Waris:</strong> {item.heirName}</span>
                      </p>
                    )}
                    {item.address && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span><strong>Alamat:</strong> {item.address}</span>
                      </p>
                    )}
                    {item.notes && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 text-[11px] mt-2">
                        <span className="font-bold text-slate-700">Catatan:</span> {item.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary for this Kifayah */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 font-medium">Iuran Warga Terkumpul:</span>
                    <span className="font-extrabold text-emerald-800 text-sm">
                      {formatRupiah(totalTerkumpul)} ({paidCount} warga)
                    </span>
                  </div>

                  {item.funeralCost !== undefined && item.funeralCost > 0 && (
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500">Biaya Kain Kafan & Makam:</span>
                      <span className="font-semibold text-rose-700">
                        {formatRupiah(item.funeralCost)}
                      </span>
                    </div>
                  )}

                  {item.assistanceGiven !== undefined && item.assistanceGiven > 0 && (
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500">Santunan Ahli Waris:</span>
                      <span className="font-semibold text-slate-800">
                        {formatRupiah(item.assistanceGiven)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-600">
                      <span>Progres Iuran: {progressPercent}%</span>
                      <span>Target: {formatRupiah(item.targetPerMember || settings.minIuran)} / warga</span>
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

            <form
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold">
                    Nama Almarhum / Almarhumah <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isManualName;
                      setIsManualName(next);
                      if (next) {
                        setSelectedMemberId('');
                      }
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline"
                  >
                    {isManualName ? '← Pilih dari Daftar Anggota' : '+ Ketik Manual (Bukan Anggota)'}
                  </button>
                </div>

                {!isManualName ? (
                  <select
                    value={selectedMemberId}
                    onChange={(e) => handleSelectMember(e.target.value)}
                    required={!isManualName}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Anggota Almarhum / Almarhumah --</option>
                    {members
                      .filter((m) => m.status !== 'almarhum')
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.rtRw || 'Dusun Tengah'} {m.status === 'non-aktif' ? '[Non-Aktif]' : ''}
                        </option>
                      ))}
                    {members.filter((m) => m.status === 'almarhum').length > 0 && (
                      <optgroup label="Sudah Pernah Ditandai Almarhum">
                        {members
                          .filter((m) => m.status === 'almarhum')
                          .map((m) => (
                            <option key={m.id} value={m.id} disabled>
                              {m.name} — {m.rtRw} [Sudah Almarhum]
                            </option>
                          ))}
                      </optgroup>
                    )}
                    <option value="manual">+ Ketik Manual (Bukan Anggota Terdaftar)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={deceasedName}
                    onChange={(e) => setDeceasedName(e.target.value)}
                    placeholder="Contoh: Bpk. H. Sudirman"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}

                {selectedMemberId && (
                  <div className="mt-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                    <span className="font-bold shrink-0">ℹ️ Perhatian:</span>
                    <span>
                      Anggota <strong>{deceasedName}</strong> akan otomatis <strong>dinonaktifkan</strong> dari iuran dan ditandai sebagai <strong>Almarhum</strong> pada data anggota.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Tanggal Wafat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pemakaman di TPU Raudlatul Umam bada Ashar, info keluarga, dll..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono text-slate-700">
                    ↵ Enter
                  </span>
                  <span>untuk Simpan Kifayah instan</span>
                </span>
                <div className="flex items-center justify-end gap-2">
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
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      'Menyimpan...'
                    ) : (
                      <>
                        <span>{editingKifayah ? 'Simpan Perubahan Data' : 'Simpan Kifayah'}</span>
                        <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-emerald-800 text-emerald-200 rounded font-mono">
                          ↵ Enter
                        </span>
                      </>
                    )}
                  </button>
                </div>
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
