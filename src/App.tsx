/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppSettings,
  ExpenseRecord,
  IuranRecord,
  KifayahEvent,
  Member,
  UserRole,
} from './types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredMembers,
  saveStoredMembers,
  getStoredKifayah,
  saveStoredKifayah,
  getStoredIuran,
  saveStoredIuran,
  getStoredExpenses,
  saveStoredExpenses,
} from './services/storageService';
import { GasService } from './services/gasService';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { IuranManager } from './components/IuranManager';
import { KifayahManager } from './components/KifayahManager';
import { MemberManager } from './components/MemberManager';
import { ReportsManager } from './components/ReportsManager';
import { SettingsModal } from './components/SettingsModal';
import { GasGuideModal } from './components/GasGuideModal';
import { LoginModal } from './components/LoginModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ExpenseModal } from './components/ExpenseModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SyncLoadingModal } from './components/SyncLoadingModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const ADMIN_SESSION_DURATION = 60 * 60 * 1000; // 60 menit

const checkAdminSession = (): boolean => {
  try {
    const rawExpiry = localStorage.getItem('ekaffa_admin_session_expires_at');
    if (!rawExpiry) return false;
    const expiry = Number(rawExpiry);
    if (!isNaN(expiry) && Date.now() < expiry) {
      return true;
    }
    localStorage.removeItem('ekaffa_admin_session_expires_at');
    return false;
  } catch {
    return false;
  }
};

export default function App() {
  // Global States with 60-minute session restore
  const [role, setRole] = useState<UserRole>(() => {
    return checkAdminSession() ? 'admin' : 'public';
  });

  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [members, setMembers] = useState<Member[]>(getStoredMembers);
  const [kifayahList, setKifayahList] = useState<KifayahEvent[]>(getStoredKifayah);
  const [iuranList, setIuranList] = useState<IuranRecord[]>(getStoredIuran);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(getStoredExpenses);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncModal, setSyncModal] = useState<{ isOpen: boolean; title?: string; message?: string }>({
    isOpen: false,
  });
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<IuranRecord | null>(null);

  const showToastNotification = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.text === text ? null : curr));
    }, 4000);
  };

  // Auto session timeout check for Admin (setiap 10 detik)
  useEffect(() => {
    if (role !== 'admin') return;

    const interval = setInterval(() => {
      if (!checkAdminSession()) {
        setRole('public');
        setActiveTab('dashboard');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [role]);

  // Pastikan jika warga (public), hanya bisa di halaman dashboard
  useEffect(() => {
    if (role !== 'admin' && activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  }, [role, activeTab]);

  // Otomatis tangkap parameter ?gasUrl= jika link dibuka di smartphone atau browser baru
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramGas = urlParams.get('gasUrl');
      if (paramGas && paramGas.trim().includes('script.google.com')) {
        let cleanGas = paramGas.trim();
        if (!cleanGas.endsWith('/exec') && !cleanGas.endsWith('/dev')) {
          cleanGas = cleanGas.replace(/\/+$/, '') + '/exec';
        }
        setSettings((prev) => {
          const updated = { ...prev, gasUrl: cleanGas };
          saveStoredSettings(updated);
          return updated;
        });
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        showToastNotification('✓ Database Google Sheet berhasil terhubung otomatis!');
      }
    } catch {
      // ignore
    }
  }, []);

  const TAB_LABELS: Record<TabType, string> = {
    dashboard: 'Dashboard',
    members: 'Data Anggota',
    iuran: 'Input Iuran',
    kifayah: 'Data Kifayah',
    reports: 'Laporan Kas',
  };

  /**
   * Tarik data terbaru dari Google Sheets dengan opsi loading modal dialog (Silahkan Tunggu...).
   */
  const fetchAndApplyRemoteData = useCallback(async (options?: {
    showModal?: boolean;
    title?: string;
    message?: string;
    showToast?: boolean;
  }) => {
    if (!settings.gasUrl) {
      if (options?.showToast) {
        showToastNotification('URL Google Sheet belum diatur di menu Pengaturan.', true);
      }
      return;
    }

    if (options?.showModal) {
      setSyncModal({
        isOpen: true,
        title: options.title || 'Silahkan Tunggu...',
        message: options.message || 'Mengambil data dari Google Sheet...',
      });
    }
    setIsSyncing(true);

    try {
      const remoteData = await GasService.fetchAllData(settings.gasUrl);
      if (!remoteData || !remoteData.success || !remoteData.data) {
        if (options?.showToast) {
          showToastNotification('Gagal mengambil data dari Google Sheet. Periksa koneksi/URL GAS.', true);
        }
        return;
      }

      const d = remoteData.data;
      if (d.settings) {
        const remoteSettings = d.settings;
        setSettings((prev) => {
          const merged = { ...prev, ...remoteSettings };
          if (!remoteSettings.adminPasswordHash && prev.adminPasswordHash) {
            merged.adminPasswordHash = prev.adminPasswordHash;
          }
          if (!remoteSettings.adminUsername && prev.adminUsername) {
            merged.adminUsername = prev.adminUsername;
          }
          saveStoredSettings(merged);
          return merged;
        });
      }

      // Selama data dari Google Sheet berupa Array (meski kosong atau berkurang),
      // kita terapkan agar sinkron dengan baris yang dihapus di Google Sheet
      if (Array.isArray(d.members)) {
        setMembers(d.members);
        saveStoredMembers(d.members);
      }
      if (Array.isArray(d.kifayahList)) {
        setKifayahList(d.kifayahList);
        saveStoredKifayah(d.kifayahList);
      }
      if (Array.isArray(d.iuranList)) {
        setIuranList(d.iuranList);
        saveStoredIuran(d.iuranList);
      }
      if (Array.isArray(d.expensesList)) {
        setExpenses(d.expensesList);
        saveStoredExpenses(d.expensesList);
      }

      if (options?.showToast) {
        showToastNotification('✓ Data berhasil disinkronkan langsung dari Google Sheet!');
      }
    } catch (err: any) {
      if (options?.showToast) {
        showToastNotification('Error sinkronisasi: ' + (err?.message || 'Koneksi gagal'), true);
      }
    } finally {
      setIsSyncing(false);
      if (options?.showModal) {
        setSyncModal({ isOpen: false });
      }
    }
  }, [settings.gasUrl]);

  // Saat pertama kali aplikasi dibuka: ambil data dari Google Sheet dengan tampilan loading spinner
  useEffect(() => {
    if (settings.gasUrl) {
      fetchAndApplyRemoteData({
        showModal: true,
        title: 'Silahkan Tunggu...',
        message: 'Mengambil data dari Google Sheet...',
      });
    }
  }, [settings.gasUrl, fetchAndApplyRemoteData]);

  // Fungsi navigasi menu: melakukan pengambilan data seketika saat menu dipilih dengan tanda loading spinner
  const handleTabChange = async (targetTab: TabType) => {
    if (settings.gasUrl) {
      await fetchAndApplyRemoteData({
        showModal: true,
        title: 'Silahkan Tunggu...',
        message: `Mengambil data ${TAB_LABELS[targetTab]} dari Google Sheet...`,
      });
    }
    setActiveTab(targetTab);
  };

  const handleRefreshData = () => {
    fetchAndApplyRemoteData({
      showModal: true,
      title: 'Silahkan Tunggu...',
      message: 'Menyinkronkan seluruh data dari Google Sheet...',
      showToast: true,
    });
  };

  // Role changes with 60-minute session timestamp
  const handleSelectRole = (newRole: UserRole) => {
    if (newRole === 'admin') {
      const expiresAt = Date.now() + ADMIN_SESSION_DURATION;
      localStorage.setItem('ekaffa_admin_session_expires_at', String(expiresAt));
      setRole('admin');
      showToastNotification('Login admin berhasil. Sesi aktif 60 menit.');
    } else {
      localStorage.removeItem('ekaffa_admin_session_expires_at');
      setRole('public');
      setActiveTab('dashboard');
    }
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('ekaffa_admin_session_expires_at');
    setRole('public');
    setActiveTab('dashboard');
    showToastNotification('Sesi admin telah ditutup.');
  };

  // CRUD Handlers with LocalStorage + Google Sheet Sync (dengan indikator loading)
  const handleSaveIuran = async (record: IuranRecord) => {
    const updated = [record, ...iuranList];
    setIuranList(updated);
    saveStoredIuran(updated);

    if (settings.gasUrl) {
      setSyncModal({
        isOpen: true,
        title: 'Silahkan Tunggu...',
        message: `Menyimpan catatan iuran "${record.memberName}" ke Google Sheet...`,
      });
      try {
        await GasService.syncIuran(settings.gasUrl, record);
      } catch (err) {
        console.warn('Gagal sinkron iuran ke GAS:', err);
      } finally {
        setSyncModal({ isOpen: false });
      }
    }
    showToastNotification(`✓ Iuran ${record.memberName} berhasil disimpan`);
  };

  const handleBatchSaveIuran = async (records: IuranRecord[]) => {
    const updated = [...records, ...iuranList];
    setIuranList(updated);
    saveStoredIuran(updated);

    if (settings.gasUrl) {
      setSyncModal({
        isOpen: true,
        title: 'Silahkan Tunggu...',
        message: `Menyimpan ${records.length} iuran warga ke Google Sheet...`,
      });
      try {
        await GasService.syncBatchIuran(settings.gasUrl, records);
      } catch (err) {
        console.warn('Gagal sinkron batch iuran ke GAS:', err);
      } finally {
        setSyncModal({ isOpen: false });
      }
    }
    showToastNotification(`✓ ${records.length} iuran warga berhasil disimpan`);
  };

  const handleDeleteIuran = async (id: string) => {
    const deletedItem = iuranList.find((i) => i.id === id);
    const updated = iuranList.filter((i) => i.id !== id);
    setIuranList(updated);
    saveStoredIuran(updated);

    if (settings.gasUrl) {
      setSyncModal({
        isOpen: true,
        title: 'Silahkan Tunggu...',
        message: 'Menghapus catatan iuran dari Google Sheet...',
      });
      try {
        await GasService.deleteIuran(settings.gasUrl, id);
      } catch (err) {
        console.warn('Gagal hapus iuran di GAS:', err);
      } finally {
        setSyncModal({ isOpen: false });
      }
    }
    showToastNotification(`✓ Catatan iuran ${deletedItem ? `"${deletedItem.memberName}"` : ''} berhasil dihapus`);
  };

  const handleSaveMember = async (member: Member) => {
    const existingIndex = members.findIndex((m) => m.id === member.id);
    let updated: Member[];
    if (existingIndex >= 0) {
      updated = [...members];
      updated[existingIndex] = member;
    } else {
      updated = [member, ...members];
    }
    setMembers(updated);
    saveStoredMembers(updated);

    if (settings.gasUrl) {
      setSyncModal({
        isOpen: true,
        title: 'Silahkan Tunggu...',
        message: `Menyimpan data anggota "${member.name}" ke Google Sheet...`,
      });
      try {
        await GasService.syncMember(settings.gasUrl, member);
      } catch (err) {
        console.warn('Gagal simpan anggota ke GAS:', err);
      } finally {
        setSyncModal({ isOpen: false });
      }
    }
    showToastNotification(
      existingIndex >= 0
        ? `✓ Perubahan data anggota "${member.name}" berhasil disimpan`
        : `✓ Anggota baru "${member.name}" berhasil didaftarkan`
    );
  };

  const handleDeleteMember = async (id: string) => {
    const deletedItem = members.find((m) => m.id === id);
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    saveStoredMembers(updated);

    if (settings.gasUrl) {
      setSyncModal({
        isOpen: true,
        title: 'Silahkan Tunggu...',
        message: `Menghapus data "${deletedItem?.name || 'anggota'}" dari Google Sheet...`,
      });
      try {
        await GasService.deleteMember(settings.gasUrl, id);
      } catch (err) {
        console.warn('Gagal hapus anggota di GAS:', err);
      } finally {
        setSyncModal({ isOpen: false });
      }
    }
    showToastNotification(`✓ Data keanggotaan ${deletedItem ? `"${deletedItem.name}"` : ''} berhasil dihapus`);
  };

  const handleSaveKifayah = async (kifayah: KifayahEvent, deceasedMemberId?: string) => {
    const existingIndex = kifayahList.findIndex((k) => k.id === kifayah.id);
    let updated: KifayahEvent[];
    if (existingIndex >= 0) {
      updated = [...kifayahList];
      updated[existingIndex] = kifayah;
    } else {
      updated = [kifayah, ...kifayahList];
    }
    setKifayahList(updated);
    saveStoredKifayah(updated);

    if (settings.gasUrl) {
      setSyncModal({
        isOpen: true,
        title: 'Silahkan Tunggu...',
        message: `Menyimpan peristiwa kematian "${kifayah.deceasedName}" ke Google Sheet...`,
      });
      try {
        await GasService.syncKifayah(settings.gasUrl, kifayah);
      } catch (err) {
        console.warn('Gagal simpan kifayah ke GAS:', err);
      } finally {
        setSyncModal({ isOpen: false });
      }
    }

    // Ketika data almarhum diambil dari data anggota, otomatis nonaktifkan pada data anggota dan tandai sebagai Almarhum
    const targetMemberId =
      deceasedMemberId ||
      kifayah.deceasedMemberId ||
      members.find((m) => m.name.toLowerCase() === kifayah.deceasedName.trim().toLowerCase())?.id;

    if (targetMemberId) {
      const memberIndex = members.findIndex((m) => m.id === targetMemberId);
      if (memberIndex >= 0) {
        const targetMember = members[memberIndex];
        if (targetMember.status !== 'almarhum') {
          const updatedMember: Member = {
            ...targetMember,
            status: 'almarhum',
          };
          const updatedMembers = [...members];
          updatedMembers[memberIndex] = updatedMember;
          setMembers(updatedMembers);
          saveStoredMembers(updatedMembers);
          if (settings.gasUrl) {
            GasService.syncMember(settings.gasUrl, updatedMember);
          }
          showToastNotification(`✓ Status keanggotaan "${targetMember.name}" otomatis disetel Nonaktif (Almarhum)`);
        }
      }
    }

    showToastNotification(
      existingIndex >= 0
        ? `✓ Perubahan data kifayah "${kifayah.deceasedName}" berhasil disimpan`
        : `✓ Peristiwa kematian "${kifayah.deceasedName}" berhasil dicatat`
    );
  };

  const handleDeleteKifayah = async (id: string) => {
    const deletedItem = kifayahList.find((k) => k.id === id);
    const updated = kifayahList.filter((k) => k.id !== id);
    setKifayahList(updated);
    saveStoredKifayah(updated);

    if (settings.gasUrl) {
      setSyncModal({
        isOpen: true,
        title: 'Silahkan Tunggu...',
        message: `Menghapus data kifayah "${deletedItem?.deceasedName || ''}" dari Google Sheet...`,
      });
      try {
        await GasService.deleteKifayah(settings.gasUrl, id);
      } catch (err) {
        console.warn('Gagal hapus kifayah di GAS:', err);
      } finally {
        setSyncModal({ isOpen: false });
      }
    }
    showToastNotification(`✓ Data kifayah ${deletedItem ? `"${deletedItem.deceasedName}"` : ''} berhasil dihapus`);
  };

  const handleSaveExpense = async (expense: ExpenseRecord) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
    saveStoredExpenses(updated);

    if (settings.gasUrl) {
      setSyncModal({
        isOpen: true,
        title: 'Silahkan Tunggu...',
        message: 'Menyimpan catatan pengeluaran ke Google Sheet...',
      });
      try {
        await GasService.syncExpense(settings.gasUrl, expense);
      } catch (err) {
        console.warn('Gagal simpan expense ke GAS:', err);
      } finally {
        setSyncModal({ isOpen: false });
      }
    }
    showToastNotification(`✓ Pengeluaran kas sebesar Rp ${expense.amount.toLocaleString('id-ID')} berhasil dicatat`);
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);

    if (newSettings.gasUrl) {
      setSyncModal({
        isOpen: true,
        title: 'Silahkan Tunggu...',
        message: 'Menyimpan pengaturan aplikasi ke Google Sheet...',
      });
      setIsSyncing(true);
      try {
        const ok = await GasService.syncSettings(newSettings.gasUrl, newSettings);
        if (ok) {
          showToastNotification('✓ Pengaturan & sandi admin berhasil disimpan ke Google Sheet');
        } else {
          showToastNotification('✓ Pengaturan disimpan lokal (sinkronisasi Google Sheet tertunda)');
        }
      } catch (err) {
        showToastNotification('✓ Pengaturan disimpan lokal di aplikasi');
      } finally {
        setIsSyncing(false);
        setSyncModal({ isOpen: false });
      }
    } else {
      showToastNotification('✓ Pengaturan aplikasi & akun berhasil disimpan');
    }
  };

  const activeKifayahCount = kifayahList.filter((k) => k.status === 'aktif').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Header */}
      <Header
        role={role}
        settings={settings}
        isSyncing={isSyncing}
        onRefreshData={handleRefreshData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Main Container */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 ${role === 'admin' ? 'pb-24' : 'pb-8'}`}>
        
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <Dashboard
            role={role}
            settings={settings}
            members={members}
            kifayahList={kifayahList}
            iuranList={iuranList}
            expenses={expenses}
            isSyncing={isSyncing}
            onRefreshData={handleRefreshData}
            onNavigate={handleTabChange}
            onOpenReceipt={(rec) => setActiveReceipt(rec)}
            onOpenNewKifayah={() => handleTabChange('kifayah')}
            onOpenExpense={() => setIsExpenseModalOpen(true)}
          />
        )}

        {/* Tab 2: Anggota */}
        {activeTab === 'members' && (
          <MemberManager
            role={role}
            settings={settings}
            members={members}
            kifayahList={kifayahList}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {/* Tab 3: Input Iuran */}
        {activeTab === 'iuran' && (
          <IuranManager
            role={role}
            settings={settings}
            members={members}
            kifayahList={kifayahList}
            iuranList={iuranList}
            onSaveIuran={handleSaveIuran}
            onBatchSaveIuran={handleBatchSaveIuran}
            onDeleteIuran={handleDeleteIuran}
            onOpenReceipt={(rec) => setActiveReceipt(rec)}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {/* Tab 4: Data Kifayah */}
        {activeTab === 'kifayah' && (
          <KifayahManager
            role={role}
            settings={settings}
            members={members}
            kifayahList={kifayahList}
            iuranList={iuranList}
            onSaveKifayah={handleSaveKifayah}
            onDeleteKifayah={handleDeleteKifayah}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {/* Tab 5: Laporan */}
        {activeTab === 'reports' && (
          <ReportsManager
            role={role}
            settings={settings}
            members={members}
            kifayahList={kifayahList}
            iuranList={iuranList}
            expenses={expenses}
            onSaveExpense={handleSaveExpense}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

      </main>

      {/* Mobile Bottom Navigation Bar: Khusus Admin/Pengurus (Disembunyikan dari Warga) */}
      {role === 'admin' && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          activeKifayahCount={activeKifayahCount}
        />
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => setIsSettingsOpen(false)}
        onOpenGuide={() => {
          setIsSettingsOpen(false);
          setIsGuideOpen(true);
        }}
      />

      <GasGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        currentRole={role}
        settings={settings}
        onSelectRole={handleSelectRole}
        onClose={() => setIsLoginOpen(false)}
      />

      <ReceiptModal
        receipt={activeReceipt}
        settings={settings}
        onClose={() => setActiveReceipt(null)}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        kifayahList={kifayahList}
        onSaveExpense={handleSaveExpense}
      />

      {/* Indikator Status Offline */}
      <OfflineIndicator />

      {/* Floating PWA Install Banner untuk Browser Smartphone */}
      <PWAInstallBanner appName={settings.appName} />

      {/* Dialog Loading Spinner "Silahkan Tunggu..." (Sinkronisasi On-Demand Google Sheet) */}
      <SyncLoadingModal
        isOpen={syncModal.isOpen}
        title={syncModal.title}
        message={syncModal.message}
        appName={settings.appName}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${
              toastMessage.isError
                ? 'bg-rose-950/95 text-rose-100 border-rose-500 shadow-rose-950/30'
                : 'bg-emerald-950/95 text-emerald-100 border-emerald-500 shadow-emerald-950/30'
            }`}
          >
            {toastMessage.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="leading-snug">{toastMessage.text}</span>
          </div>
        </div>
      )}

    </div>
  );
}
