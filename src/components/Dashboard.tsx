import React, { useState } from 'react';
import {
  AppSettings,
  ExpenseRecord,
  IuranRecord,
  KifayahEvent,
  Member,
  UserRole,
} from '../types';
import { formatRupiah, formatDateID, isMemberObligatedToKifayah } from '../services/storageService';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  HeartHandshake,
  ArrowRight,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface DashboardProps {
  role: UserRole;
  settings: AppSettings;
  members: Member[];
  kifayahList: KifayahEvent[];
  iuranList: IuranRecord[];
  expenses: ExpenseRecord[];
  isSyncing?: boolean;
  onRefreshData?: () => void;
  onNavigate: (tab: any) => void;
  onOpenReceipt: (record: IuranRecord) => void;
  onOpenNewKifayah: () => void;
  onOpenExpense: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  role,
  settings,
  members,
  kifayahList,
  iuranList,
  expenses,
  isSyncing = false,
  onRefreshData,
  onNavigate,
  onOpenReceipt,
  onOpenNewKifayah,
  onOpenExpense,
}) => {
  const [searchMemberStatus, setSearchMemberStatus] = useState('');

  // Perhitungan Keuangan
  const totalIuranMasuk = iuranList.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPengeluaran = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const saldoKas = totalIuranMasuk - totalPengeluaran;

  // Kifayah Aktif (peristiwa kematian yang masih dalam pengumpulan iuran)
  const activeKifayah = kifayahList.find((k) => k.status === 'aktif') || kifayahList[0];

  // Warga aktif yang memiliki kewajiban iuran untuk kifayah ini
  const activeMembersCount = activeKifayah
    ? members.filter((m) => isMemberObligatedToKifayah(m, activeKifayah)).length
    : members.filter((m) => m.status === 'aktif').length;

  // Statistik untuk kifayah aktif tersebut
  const activeKifayahIuran = activeKifayah
    ? iuranList.filter((i) => i.kifayahId === activeKifayah.id)
    : [];
  const activeKifayahTotalTerkumpul = activeKifayahIuran.reduce(
    (acc, curr) => acc + curr.amount,
    0
  );
  const paidMemberIds = new Set(activeKifayahIuran.map((i) => i.memberId));
  const paidCount = paidMemberIds.size;
  const targetPerWarga = activeKifayah ? activeKifayah.targetPerMember || settings.minIuran : settings.minIuran;
  const targetTotal = activeMembersCount * targetPerWarga;
  const progressPercent = activeMembersCount > 0 ? Math.min(100, Math.round((paidCount / activeMembersCount) * 100)) : 0;

  // Filter cek status warga untuk transparansi umum
  const searchResults = searchMemberStatus.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(searchMemberStatus.toLowerCase()) ||
          m.rtRw.toLowerCase().includes(searchMemberStatus.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-5 pb-8">
      
      {/* Saldo Kas Banner (Islamic Emerald & Gold) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 shadow-xl border border-emerald-700/50">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 w-32 h-32 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-emerald-300" />
              <span>Saldo Kas Rukun Kifayah</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {formatRupiah(saldoKas)}
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 mt-1">
              {settings.organizationName} • Transparan & Amanah
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto">
            {role === 'admin' ? (
              <>
                <button
                  onClick={() => onNavigate('iuran')}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  Catat Iuran
                </button>
                <button
                  onClick={onOpenExpense}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-950/70 hover:bg-emerald-950/95 text-white border border-emerald-600/60 font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                >
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span>Catat Pengeluaran</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  const el = document.getElementById('cek-status-warga');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  el?.querySelector('input')?.focus();
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all active:scale-95"
              >
                <Search className="w-4 h-4" />
                Cek Pembayaran Iuran
              </button>
            )}
          </div>
        </div>

        {/* Financial Mini Badges */}
        <div className="mt-5 pt-4 border-t border-emerald-700/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px]">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Total Iuran Masuk
            </div>
            <div className="font-bold text-white text-sm sm:text-base mt-0.5">
              {formatRupiah(totalIuranMasuk)}
            </div>
          </div>

          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60">
            <div className="flex items-center gap-1.5 text-rose-300 text-[11px]">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              Total Pengeluaran
            </div>
            <div className="font-bold text-white text-sm sm:text-base mt-0.5">
              {formatRupiah(totalPengeluaran)}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60">
            <div className="flex items-center gap-1.5 text-teal-300 text-[11px]">
              <Users className="w-3.5 h-3.5 text-teal-400" />
              Warga Terdaftar
            </div>
            <div className="font-bold text-white text-sm sm:text-base mt-0.5">
              {activeMembersCount} Kepala Keluarga
            </div>
          </div>
        </div>
      </div>

      {/* Active Kifayah Card */}
      {activeKifayah ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                activeKifayah.status === 'aktif'
                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeKifayah.status === 'aktif' ? 'Kifayah Sedang Berjalan' : 'Kifayah Selesai'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Wafat: {formatDateID(activeKifayah.deathDate)}
              </span>
            </div>
          </div>

          {/* Details of Deceased */}
          <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Almarhum / Almarhumah</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {activeKifayah.deceasedName}
              </h3>
              {activeKifayah.binBinti ? (
                <p className="text-xs text-slate-500 italic">{activeKifayah.binBinti}</p>
              ) : null}
              
              <div className="mt-2 text-xs text-slate-600 space-y-1">
                {activeKifayah.notes ? (
                  <p className="text-slate-600"><strong>Catatan:</strong> {activeKifayah.notes}</p>
                ) : null}
                {activeKifayah.heirName ? (
                  <p><strong>Ahli Waris:</strong> {activeKifayah.heirName}</p>
                ) : null}
                {activeKifayah.address ? (
                  <p><strong>Rumah Duka:</strong> {activeKifayah.address}</p>
                ) : null}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Iuran Min. Wajib per Warga:</span>
                <span className="font-bold text-emerald-800">{formatRupiah(targetPerWarga)}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Total Iuran Terkumpul:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatRupiah(activeKifayahTotalTerkumpul)}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between items-center text-[11px] mb-1 font-medium text-slate-600">
                  <span>Partisipasi Warga: {paidCount} / {activeMembersCount} ({progressPercent}%)</span>
                  <span className="text-emerald-700 font-bold">{activeMembersCount - paidCount} Belum Bayar</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                {role === 'admin' ? (
                  <button
                    onClick={() => onNavigate('iuran')}
                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all text-center"
                  >
                    Catat Iuran Kifayah Ini
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const el = document.getElementById('cek-status-warga');
                      el?.scrollIntoView({ behavior: 'smooth' });
                      el?.querySelector('input')?.focus();
                    }}
                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all text-center"
                  >
                    Cek Status Iuran Warga
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Alhamdulillah, Tidak Ada Kifayah Aktif</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Semua warga dalam keadaan sehat walafiat. Kas rukun kifayah standby untuk melayani bila sewaktu-waktu dibutuhkan.
          </p>
          {role === 'admin' && (
            <button
              onClick={onOpenNewKifayah}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Input Peristiwa Kifayah Baru
            </button>
          )}
        </div>
      )}

      {/* Quick Search Tool for Members / Transparency Check */}
      <div id="cek-status-warga" className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 scroll-mt-20">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Cek Cepat Status Iuran Warga
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Warga dapat mengecek apakah nama kepala keluarga sudah tercatat lunas pada kifayah aktif ({activeKifayah?.deceasedName || 'Terkini'}).
        </p>

        <div className="relative">
          <input
            type="text"
            value={searchMemberStatus}
            onChange={(e) => setSearchMemberStatus(e.target.value)}
            placeholder="Ketik nama warga atau RT (contoh: Ahmad, RT 01)..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Results */}
        {searchMemberStatus.trim().length > 0 && (
          <div className="mt-3 divide-y divide-slate-100 max-h-60 overflow-y-auto border border-slate-100 rounded-xl">
            {searchResults.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                Nama warga tidak ditemukan dalam daftar anggota.
              </div>
            ) : (
              searchResults.map((m) => {
                const isPaid = paidMemberIds.has(m.id);
                const paymentRecord = activeKifayahIuran.find((i) => i.memberId === m.id);

                return (
                  <div key={m.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div>
                      <span className="font-semibold text-slate-900 block">{m.name}</span>
                      <span className="text-[11px] text-slate-500">{m.rtRw} • {m.phone || 'No WA -'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPaid ? (
                        <>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Lunas ({formatRupiah(paymentRecord?.amount || targetPerWarga)})
                          </span>
                          {paymentRecord && (
                            <button
                              onClick={() => onOpenReceipt(paymentRecord)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-700"
                              title="Lihat Kuitansi"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : m.status === 'almarhum' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-white shadow-xs">
                          Almarhum
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <Clock className="w-3.5 h-3.5" />
                          Belum Bayar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 5 Transaksi Terkini */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">5 Pembayaran Iuran Terkini</h3>
            <p className="text-xs text-slate-500">Transparansi setoran iuran warga</p>
          </div>
          {role === 'admin' && (
            <button
              onClick={() => onNavigate('iuran')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {iuranList.slice(0, 5).map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">{item.memberName}</span>
                  <span className="text-[11px] text-slate-500">
                    {item.rtRw} • {formatDateID(item.paymentDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="font-bold text-emerald-800 block">{formatRupiah(item.amount)}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{item.paymentMethod}</span>
                </div>
                <button
                  onClick={() => onOpenReceipt(item)}
                  title="Lihat Kuitansi"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Widget Pasang Aplikasi PWA di HP */}
      <PWAInstallButton variant="full" appName={settings.appName} />

    </div>
  );
};
