import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppSettings, KifayahEvent, Member, UserRole } from '../types';
import {
  Users,
  PlusCircle,
  Search,
  CheckCircle,
  Edit,
  X,
  Lock,
  Trash2,
  HeartHandshake,
} from 'lucide-react';

import { ConfirmModal } from './ConfirmModal';
import { getMemberObligationSummary, isMemberObligatedToKifayah } from '../services/storageService';

interface MemberManagerProps {
  role: UserRole;
  settings: AppSettings;
  members: Member[];
  kifayahList: KifayahEvent[];
  onSaveMember: (member: Member) => Promise<void>;
  onDeleteMember?: (id: string) => Promise<void> | void;
  onOpenLogin: () => void;
}

export const MemberManager: React.FC<MemberManagerProps> = ({
  role,
  settings,
  members,
  kifayahList,
  onSaveMember,
  onDeleteMember,
  onOpenLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRt, setFilterRt] = useState('Semua');
  const [filterKifayah, setFilterKifayah] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State (Hanya Nama Lengkap, Dusun, Status, dan Pilihan Kewajiban Kifayah)
  const [name, setName] = useState('');
  const [rtRw, setRtRw] = useState('Dusun Tengah');
  const [status, setStatus] = useState<'aktif' | 'non-aktif' | 'almarhum'>('aktif');
  const [isAllKifayah, setIsAllKifayah] = useState(true);
  const [obligatedKifayahIds, setObligatedKifayahIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref untuk mengarahkan kursor otomatis ke isian Nama Lengkap
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Efek fokus otomatis saat modal Tambah/Edit dibuka
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          if (editingMember) {
            const len = nameInputRef.current.value.length;
            nameInputRef.current.setSelectionRange(len, len);
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showModal, editingMember]);

  // Unique Dusun List
  const uniqueRtList = useMemo(() => {
    const list = Array.from(new Set(members.map((m) => m.rtRw).filter(Boolean)));
    if (!list.includes('Dusun Tengah')) {
      list.unshift('Dusun Tengah');
    }
    return ['Semua', ...list];
  }, [members]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchRt = filterRt === 'Semua' || m.rtRw === filterRt;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !searchQuery.trim() ||
        m.name.toLowerCase().includes(q) ||
        m.rtRw.toLowerCase().includes(q) ||
        (m.obligatedKifayahNames && m.obligatedKifayahNames.some((n) => n.toLowerCase().includes(q)));

      let matchKifayah = true;
      if (filterKifayah !== 'Semua') {
        const targetK = kifayahList.find((k) => k.id === filterKifayah);
        matchKifayah = isMemberObligatedToKifayah(m, targetK);
      }

      return matchRt && matchQuery && matchKifayah;
    });
  }, [members, filterRt, filterKifayah, searchQuery, kifayahList]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setName('');
    setRtRw('Dusun Tengah');
    setStatus('aktif');
    setIsAllKifayah(true);
    setObligatedKifayahIds([]);
    setShowModal(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setName(m.name);
    setRtRw(m.rtRw || 'Dusun Tengah');
    setStatus(m.status);

    const hasSpecificIds =
      m.obligatedKifayahIds &&
      m.obligatedKifayahIds.length > 0 &&
      !m.obligatedKifayahIds.includes('all');

    const hasSpecificNames =
      m.obligatedKifayahNames &&
      m.obligatedKifayahNames.length > 0 &&
      !m.obligatedKifayahNames.includes('Semua Kifayah');

    if (hasSpecificIds) {
      setIsAllKifayah(false);
      setObligatedKifayahIds(m.obligatedKifayahIds!);
    } else if (hasSpecificNames) {
      setIsAllKifayah(false);
      const matchedIds = kifayahList
        .filter((k) =>
          m.obligatedKifayahNames?.some(
            (n) => n.toLowerCase() === k.deceasedName.trim().toLowerCase()
          )
        )
        .map((k) => k.id);
      setObligatedKifayahIds(matchedIds);
    } else {
      setIsAllKifayah(true);
      setObligatedKifayahIds([]);
    }

    setShowModal(true);
  };

  const handleToggleKifayah = (kifayahId: string) => {
    setIsAllKifayah(false);
    setObligatedKifayahIds((prev) => {
      if (prev.includes(kifayahId)) {
        const next = prev.filter((id) => id !== kifayahId);
        if (next.length === 0) {
          setIsAllKifayah(true);
        }
        return next;
      } else {
        return [...prev, kifayahId];
      }
    });
  };

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);

    let finalObligatedIds: string[] = [];
    let finalObligatedNames: string[] = [];

    if (status === 'aktif') {
      if (isAllKifayah || obligatedKifayahIds.length === 0) {
        finalObligatedIds = ['all'];
        finalObligatedNames = ['Semua Kifayah'];
      } else {
        finalObligatedIds = [...obligatedKifayahIds];
        finalObligatedNames = obligatedKifayahIds
          .map((id) => kifayahList.find((k) => k.id === id)?.deceasedName)
          .filter(Boolean) as string[];
      }
    }

    const memberToSave: Member = {
      id: editingMember ? editingMember.id : `MBR-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      rtRw: rtRw.trim() || 'Dusun Tengah',
      status,
      obligatedKifayahIds: finalObligatedIds,
      obligatedKifayahNames: finalObligatedNames,
      joinDate: editingMember ? editingMember.joinDate : new Date().toISOString().split('T')[0],
      phone: editingMember?.phone || '',
      address: editingMember?.address || '',
      kkNumber: editingMember?.kkNumber || '',
    };

    try {
      await onSaveMember(memberToSave);
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shortcut Enter untuk menyimpan data anggota baru secara instan di PC
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLButtonElement) {
      return;
    }

    if (e.key === 'Enter') {
      if (e.target instanceof HTMLTextAreaElement && e.shiftKey) {
        return;
      }
      e.preventDefault();
      if (!name.trim()) {
        nameInputRef.current?.focus();
        return;
      }
      if (!isSubmitting) {
        handleSubmit(e);
      }
    }
  };

  return (
    <div className="space-y-4 pb-12">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            Data Anggota Rukun Kifayah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total terdaftar: <strong>{members.length} Kepala Keluarga</strong> ({members.filter((m) => m.status === 'aktif').length} aktif)
          </p>
        </div>

        {role === 'admin' ? (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Anggota Baru
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

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama anggota, Dusun, atau nama kifayah..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Dusun */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold shrink-0">Dusun:</span>
            <select
              value={filterRt}
              onChange={(e) => setFilterRt(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {uniqueRtList.map((rt) => (
                <option key={rt} value={rt}>
                  {rt === 'Semua' ? 'Semua Dusun' : (rt.toLowerCase().includes('dusun') ? rt : `Dusun ${rt}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kewajiban Kifayah */}
          {kifayahList.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold shrink-0">Wajib Kifayah:</span>
              <select
                value={filterKifayah}
                onChange={(e) => setFilterKifayah(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[200px] truncate"
              >
                <option value="Semua">Semua Kifayah</option>
                {kifayahList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.deceasedName} ({k.status === 'aktif' ? 'Aktif' : 'Selesai'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Member List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredMembers.map((member) => {
          const obligationSummary = getMemberObligationSummary(member, kifayahList);

          return (
            <div
              key={member.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {member.rtRw.toLowerCase().includes('dusun') ? member.rtRw : `Dusun ${member.rtRw}`}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      member.status === 'aktif'
                        ? 'bg-emerald-100 text-emerald-800'
                        : member.status === 'almarhum'
                        ? 'bg-slate-800 text-slate-100 border border-slate-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {member.status === 'almarhum' ? 'Almarhum' : member.status}
                  </span>
                </div>

                {/* Status Keanggotaan & Nama-Nama Kifayah yang Diwajibkan Iurannya */}
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kewajiban Iuran Kifayah:</span>
                  </div>

                  {member.status === 'aktif' ? (
                    <div className="flex flex-wrap gap-1.5">
                      {obligationSummary === 'Semua Kifayah' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 font-bold text-[11px] rounded-lg border border-emerald-200/60">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Semua Kifayah</span>
                        </span>
                      ) : (
                        obligationSummary.split(', ').map((kName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 font-bold text-[11px] rounded-lg border border-amber-300 shadow-2xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Wajib: {kName}</span>
                          </span>
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      {member.status === 'almarhum'
                        ? 'Almarhum (Telah dibebaskan dari iuran)'
                        : 'Non-Aktif (Bebas dari kewajiban iuran)'}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">ID: {member.id}</span>

                {role === 'admin' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Edit Data Anggota"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setMemberToDelete(member)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Hapus Keanggotaan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Member */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">
                  {editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
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
                <label className="block font-bold mb-1">
                  Nama Lengkap (Kepala Keluarga) <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bpk. Ahmad Supriyadi"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Dusun <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={rtRw}
                  onChange={(e) => setRtRw(e.target.value)}
                  placeholder="Dusun Tengah"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Status Keanggotaan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="aktif">Aktif (Wajib Iuran)</option>
                  <option value="non-aktif">Non-Aktif (Pindah / Khusus)</option>
                  <option value="almarhum">Almarhum (Non-Aktif)</option>
                </select>
              </div>

              {/* Status Keanggotaan: Nama-Nama Kifayah yang Diwajibkan Iurannya */}
              {status === 'aktif' && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-emerald-700" />
                      Kewajiban Iuran Kifayah:
                    </label>
                    <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                      {isAllKifayah ? 'Semua Kifayah' : `${obligatedKifayahIds.length} Kifayah Dipilih`}
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800/90 leading-tight">
                    Tentukan kepada kifayah siapa saja anggota ini memiliki kewajiban iuran:
                  </p>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAllKifayah(true);
                        setObligatedKifayahIds([]);
                      }}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold border transition-all ${
                        isAllKifayah
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100/50'
                      }`}
                    >
                      ✓ Wajib Semua Kifayah
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAllKifayah(false);
                        if (obligatedKifayahIds.length === 0 && kifayahList.length > 0) {
                          setObligatedKifayahIds([kifayahList[0].id]);
                        }
                      }}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold border transition-all ${
                        !isAllKifayah
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100/50'
                      }`}
                    >
                      Pilih Kifayah Tertentu
                    </button>
                  </div>

                  {/* Daftar Checklist Kifayah jika memilih tertentu */}
                  {!isAllKifayah && (
                    <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto">
                      {kifayahList.length === 0 ? (
                        <div className="p-3 bg-white rounded-lg border border-emerald-200 text-[11px] text-slate-500 text-center">
                          Belum ada data peristiwa kifayah di aplikasi. Anggota akan otomatis mengikuti kifayah saat peristiwa baru dicatat.
                        </div>
                      ) : (
                        kifayahList.map((k) => {
                          const isChecked = obligatedKifayahIds.includes(k.id);
                          return (
                            <label
                              key={k.id}
                              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleKifayah(k.id)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                                />
                                <span className="truncate text-xs">
                                  Kifayah {k.deceasedName}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  k.status === 'aktif'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {k.status === 'aktif' ? 'Aktif' : 'Selesai'}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono text-slate-700">
                    ↵ Enter
                  </span>
                  <span>untuk simpan instan</span>
                </span>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
                        <span>Simpan Anggota</span>
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

      {/* Modal Konfirmasi Hapus Anggota */}
      <ConfirmModal
        isOpen={Boolean(memberToDelete)}
        title="Hapus Keanggotaan"
        message={`Apakah Anda yakin ingin menghapus keanggotaan "${memberToDelete?.name}" (${memberToDelete?.rtRw})? Data ini akan dihapus dari aplikasi dan Google Sheet.`}
        confirmLabel="Ya, Hapus Anggota"
        isProcessing={isDeleting}
        onConfirm={async () => {
          if (!memberToDelete) return;
          setIsDeleting(true);
          try {
            if (onDeleteMember) {
              await onDeleteMember(memberToDelete.id);
            }
            setMemberToDelete(null);
          } finally {
            setIsDeleting(false);
          }
        }}
        onClose={() => {
          if (!isDeleting) {
            setMemberToDelete(null);
          }
        }}
      />

    </div>
  );
};
