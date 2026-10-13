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
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
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

  /**
   * Tarik data terbaru dari Google Sheets.
   * Menimpa data lokal secara utuh sehingga jika data dihapus manual di Google Sheet,
   * data di aplikasi juga langsung terhapus.
   */
  const fetchAndApplyRemoteData = useCallback(async (showToast = false) => {
    if (!settings.gasUrl) {
      if (showToast) {
        showToastNotification('URL Google Sheet belum diatur di menu Pengaturan.', true);
      }
      return;
    }

    setIsSyncing(true);
    try {
      const remoteData = await GasService.fetchAllData(settings.gasUrl);
      if (!remoteData || !remoteData.success || !remoteData.data) {
        if (showToast) {
          showToastNotification('Gagal mengambil data dari Google Sheet. Periksa koneksi/URL GAS.', true);
        }
        return;
      }

      const d = remoteData.data;
      if (d.settings) {
        setSettings((prev) => {
          const merged = { ...prev, ...d.settings };
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

      if (showToast) {
        showToastNotification('✓ Data berhasil disinkronkan langsung dari Google Sheet!');
      }
    } catch (err: any) {
      if (showToast) {
        showToastNotification('Error sinkronisasi: ' + (err?.message || 'Koneksi gagal'), true);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [settings.gasUrl]);

  // Sync saat pertama kali dibuka atau URL GAS berubah
  useEffect(() => {
    if (settings.gasUrl) {
      fetchAndApplyRemoteData(false);
    }
  }, [settings.gasUrl, fetchAndApplyRemoteData]);

  // Auto-sync saat pengguna kembali ke tab browser (misal setelah mengedit/menghapus manual di Google Sheet)
  useEffect(() => {
    if (!settings.gasUrl) return;

    const handleWindowFocus = () => {
      fetchAndApplyRemoteData(false);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [settings.gasUrl, fetchAndApplyRemoteData]);

  const handleRefreshData = () => {
    fetchAndApplyRemoteData(true);
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

  // CRUD Handlers with LocalStorage + GAS background sync
  const handleSaveIuran = async (record: IuranRecord) => {
    const updated = [record, ...iuranList];
    setIuranList(updated);
    saveStoredIuran(updated);
    showToastNotification(`✓ Iuran ${record.memberName} berhasil disimpan`);

    if (settings.gasUrl) {
      GasService.syncIuran(settings.gasUrl, record);
    }
  };

  const handleBatchSaveIuran = async (records: IuranRecord[]) => {
    const updated = [...records, ...iuranList];
    setIuranList(updated);
    saveStoredIuran(updated);
    showToastNotification(`✓ ${records.length} iuran warga berhasil disimpan massal`);

    if (settings.gasUrl) {
      GasService.syncBatchIuran(settings.gasUrl, records);
    }
  };

  const handleDeleteIuran = async (id: string) => {
    const deletedItem = iuranList.find((i) => i.id === id);
    const updated = iuranList.filter((i) => i.id !== id);
    setIuranList(updated);
    saveStoredIuran(updated);
    showToastNotification(`✓ Catatan iuran ${deletedItem ? `"${deletedItem.memberName}"` : ''} berhasil dihapus dari aplikasi & Google Sheet`);

    if (settings.gasUrl) {
      await GasService.deleteIuran(settings.gasUrl, id);
    }
  };

  const handleSaveMember = async (member: Member) => {
    const existingIndex = members.findIndex((m) => m.id === member.id);
    let updated: Member[];
    if (existingIndex >= 0) {
      updated = [...members];
      updated[existingIndex] = member;
      showToastNotification(`✓ Perubahan data anggota "${member.name}" berhasil disimpan`);
    } else {
      updated = [member, ...members];
      showToastNotification(`✓ Anggota baru "${member.name}" berhasil didaftarkan`);
    }
    setMembers(updated);
    saveStoredMembers(updated);

    if (settings.gasUrl) {
      GasService.syncMember(settings.gasUrl, member);
    }
  };

  const handleDeleteMember = async (id: string) => {
    const deletedItem = members.find((m) => m.id === id);
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    saveStoredMembers(updated);
    showToastNotification(`✓ Data keanggotaan ${deletedItem ? `"${deletedItem.name}"` : ''} berhasil dihapus dari aplikasi & Google Sheet`);

    if (settings.gasUrl) {
      await GasService.deleteMember(settings.gasUrl, id);
    }
  };

  const handleSaveKifayah = async (kifayah: KifayahEvent) => {
    const existingIndex = kifayahList.findIndex((k) => k.id === kifayah.id);
    let updated: KifayahEvent[];
    if (existingIndex >= 0) {
      updated = [...kifayahList];
      updated[existingIndex] = kifayah;
      showToastNotification(`✓ Perubahan data kifayah "${kifayah.deceasedName}" berhasil disimpan`);
    } else {
      updated = [kifayah, ...kifayahList];
      showToastNotification(`✓ Peristiwa kematian "${kifayah.deceasedName}" berhasil dicatat`);
    }
    setKifayahList(updated);
    saveStoredKifayah(updated);

    if (settings.gasUrl) {
      GasService.syncKifayah(settings.gasUrl, kifayah);
    }
  };

  const handleDeleteKifayah = async (id: string) => {
    const deletedItem = kifayahList.find((k) => k.id === id);
    const updated = kifayahList.filter((k) => k.id !== id);
    setKifayahList(updated);
    saveStoredKifayah(updated);
    showToastNotification(`✓ Data kifayah ${deletedItem ? `"${deletedItem.deceasedName}"` : ''} berhasil dihapus dari aplikasi & Google Sheet`);

    if (settings.gasUrl) {
      await GasService.deleteKifayah(settings.gasUrl, id);
    }
  };

  const handleSaveExpense = async (expense: ExpenseRecord) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
    saveStoredExpenses(updated);
    showToastNotification(`✓ Pengeluaran kas sebesar Rp ${expense.amount.toLocaleString('id-ID')} berhasil dicatat`);

    if (settings.gasUrl) {
      GasService.syncExpense(settings.gasUrl, expense);
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    showToastNotification('✓ Pengaturan aplikasi & akun berhasil disimpan');

    if (newSettings.gasUrl) {
      GasService.syncSettings(newSettings.gasUrl, newSettings);
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
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenReceipt={(rec) => setActiveReceipt(rec)}
            onOpenNewKifayah={() => setActiveTab('kifayah')}
          />
        )}

        {/* Tab 2: Anggota */}
        {activeTab === 'members' && (
          <MemberManager
            role={role}
            settings={settings}
            members={members}
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
          onChangeTab={(t) => setActiveTab(t)}
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
