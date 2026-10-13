import React, { useState, useMemo } from 'react';
import { AppSettings, Member, UserRole } from '../types';
import {
  Users,
  PlusCircle,
  Search,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Edit,
  X,
  MessageCircle,
  Lock,
  Trash2,
} from 'lucide-react';

import { ConfirmModal } from './ConfirmModal';

interface MemberManagerProps {
  role: UserRole;
  settings: AppSettings;
  members: Member[];
  onSaveMember: (member: Member) => Promise<void>;
  onDeleteMember?: (id: string) => Promise<void> | void;
  onOpenLogin: () => void;
}

export const MemberManager: React.FC<MemberManagerProps> = ({
  role,
  settings,
  members,
  onSaveMember,
  onDeleteMember,
  onOpenLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRt, setFilterRt] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [rtRw, setRtRw] = useState('Dusun 1');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'aktif' | 'non-aktif'>('aktif');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unique Dusun List
  const uniqueRtList = useMemo(() => {
    const list = Array.from(new Set(members.map((m) => m.rtRw).filter(Boolean)));
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
        m.address.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.rtRw.toLowerCase().includes(q);
      return matchRt && matchQuery;
    });
  }, [members, filterRt, searchQuery]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setName('');
    setRtRw('Dusun 1');
    setPhone('');
    setAddress('');
    setStatus('aktif');
    setShowModal(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setName(m.name);
    setRtRw(m.rtRw || 'Dusun 1');
    setPhone(m.phone || '');
    setAddress(m.address);
    setStatus(m.status);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const memberToSave: Member = {
      id: editingMember ? editingMember.id : `MBR-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      kkNumber: editingMember ? (editingMember.kkNumber || '') : '',
      rtRw: rtRw.trim() || 'Dusun 1',
      phone: phone.trim(),
      address: address.trim(),
      status,
      joinDate: editingMember ? editingMember.joinDate : new Date().toISOString().split('T')[0],
    };

    try {
      await onSaveMember(memberToSave);
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppChat = (phoneNum: string, memberName: string) => {
    if (!phoneNum) return;
    const cleanPhone = phoneNum.replace(/[^0-9]/g, '');
    const formatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const msg = `Assalamu'alaikum Bpk/Ibu *${memberName}*, kami dari pengurus ${settings.organizationName}...`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama anggota, alamat, Dusun, no telpon/WA..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Member List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredMembers.map((member) => (
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
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {member.status}
                </span>
              </div>

              <div className="mt-2.5 text-slate-600 space-y-1">
                <p className="flex items-center gap-1.5 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.address || 'Alamat belum diisi'}</span>
                </p>

                {member.phone && (
                  <p className="flex items-center gap-1.5 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{member.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">ID: {member.id}</span>

              <div className="flex items-center gap-1.5">
                {member.phone && (
                  <button
                    onClick={() => handleWhatsAppChat(member.phone, member.name)}
                    className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    title="Kirim Pesan WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}

                {role === 'admin' && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
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

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold mb-1">
                  Nama Lengkap (Kepala Keluarga) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bpk. Ahmad Supriyadi"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    Dusun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rtRw}
                    onChange={(e) => setRtRw(e.target.value)}
                    placeholder="Contoh: Dusun 1 / Krajan"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Alamat Rumah</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Kenanga No. 12"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Status Keanggotaan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                >
                  <option value="aktif">Aktif (Wajib Iuran)</option>
                  <option value="non-aktif">Non-Aktif (Pindah / Khusus)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
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
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs active:scale-95"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Anggota'}
                </button>
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
