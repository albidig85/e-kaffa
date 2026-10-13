import { AppSettings, ExpenseRecord, IuranRecord, KifayahEvent, Member } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'ekaffa_settings',
  MEMBERS: 'ekaffa_members',
  KIFAYAH: 'ekaffa_kifayah',
  IURAN: 'ekaffa_iuran',
  EXPENSES: 'ekaffa_expenses',
  AUTH: 'ekaffa_auth_role',
};

const ENV_GAS_URL = (import.meta.env.VITE_GAS_URL || '').trim();

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'e-Kaffa',
  organizationName: 'Kas Kifayah Raudlatul Umam',
  minIuran: 10000,
  defaultSantunan: 1500000,
  adminUsername: 'admin',
  adminPasswordHash: 'admin123',
  treasurerName: 'H. Ahmad Fauzi (Bendahara)',
  treasurerPhone: '081234567890',
  gasUrl: ENV_GAS_URL,
  whatsappFooter: 'Semoga menjadi amal jariyah dan meringankan keluarga duka. Aamiin ya Rabbal Alamin.',
};

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'MBR-001',
    name: 'Bpk. H. Ahmad Fauzi',
    kkNumber: '',
    rtRw: 'Dusun 1',
    phone: '081234567890',
    address: 'Jl. Raudlatul Umam No. 01',
    status: 'aktif',
    joinDate: '2024-01-01',
  },
  {
    id: 'MBR-002',
    name: 'Bpk. Ahmad Supriyadi',
    kkNumber: '',
    rtRw: 'Dusun 1',
    phone: '081234567891',
    address: 'Jl. Kenanga No. 12',
    status: 'aktif',
    joinDate: '2024-01-01',
  },
  {
    id: 'MBR-003',
    name: 'Bpk. H. Bambang Hartono',
    kkNumber: '',
    rtRw: 'Dusun 1',
    phone: '081234567892',
    address: 'Jl. Kenanga No. 15',
    status: 'aktif',
    joinDate: '2024-01-02',
  },
  {
    id: 'MBR-004',
    name: 'Bpk. Dedi Darmawan',
    kkNumber: '',
    rtRw: 'Dusun 2',
    phone: '081234567893',
    address: 'Jl. Melati No. 04',
    status: 'aktif',
    joinDate: '2024-01-05',
  },
  {
    id: 'MBR-005',
    name: 'Ibu Hj. Siti Aminah',
    kkNumber: '',
    rtRw: 'Dusun 2',
    phone: '081234567894',
    address: 'Jl. Melati No. 09',
    status: 'aktif',
    joinDate: '2024-01-05',
  },
  {
    id: 'MBR-006',
    name: 'Bpk. Joko Purnomo',
    kkNumber: '',
    rtRw: 'Dusun 2',
    phone: '081234567895',
    address: 'Jl. Melati No. 18',
    status: 'aktif',
    joinDate: '2024-01-10',
  },
  {
    id: 'MBR-007',
    name: 'Bpk. Ruslan Effendi',
    kkNumber: '',
    rtRw: 'Dusun 3',
    phone: '081234567896',
    address: 'Jl. Mawar No. 07',
    status: 'aktif',
    joinDate: '2024-01-12',
  },
  {
    id: 'MBR-008',
    name: 'Bpk. Gunawan Wibisono',
    kkNumber: '',
    rtRw: 'Dusun 3',
    phone: '081234567897',
    address: 'Jl. Mawar No. 23',
    status: 'aktif',
    joinDate: '2024-01-15',
  },
  {
    id: 'MBR-009',
    name: 'Bpk. Ust. Muhammad Ridwan',
    kkNumber: '',
    rtRw: 'Dusun 4',
    phone: '081234567898',
    address: 'Jl. Anggrek No. 03',
    status: 'aktif',
    joinDate: '2024-01-18',
  },
  {
    id: 'MBR-010',
    name: 'Bpk. Hendra Wijaya',
    kkNumber: '',
    rtRw: 'Dusun 4',
    phone: '081234567899',
    address: 'Jl. Anggrek No. 14',
    status: 'aktif',
    joinDate: '2024-01-20',
  },
];

export const INITIAL_KIFAYAH: KifayahEvent[] = [
  {
    id: 'KFY-001',
    deceasedName: 'Alm. Bpk. H. Sudirman',
    binBinti: 'Bin H. Mansyur',
    deathDate: '2025-05-10',
    heirName: 'Ibu Hj. Nurhayati (Istri)',
    address: 'Jl. Kenanga No. 08, RT 01 / RW 03',
    targetPerMember: 10000,
    status: 'aktif',
    assistanceGiven: 1500000,
    funeralCost: 450000,
    notes: 'Meninggal di rumah duka setelah sakit usia lanjut. Pemakaman di TPU Raudlatul Jannah.',
    createdAt: '2025-05-10T08:30:00Z',
  },
  {
    id: 'KFY-002',
    deceasedName: 'Almh. Ibu Hj. Maryam',
    binBinti: 'Binti H. Zarkasyi',
    deathDate: '2025-03-14',
    heirName: 'Bpk. Syarif Hidayat (Anak)',
    address: 'Jl. Melati No. 11, RT 02 / RW 03',
    targetPerMember: 10000,
    status: 'selesai',
    assistanceGiven: 1500000,
    funeralCost: 500000,
    notes: 'Penghimpunan iuran telah ditutup dan santunan tuntas diserahterimakan.',
    createdAt: '2025-03-14T11:00:00Z',
  },
];

export const INITIAL_IURAN: IuranRecord[] = [
  {
    id: 'IUR-001',
    kifayahId: 'KFY-001',
    deceasedName: 'Alm. Bpk. H. Sudirman',
    memberId: 'MBR-001',
    memberName: 'Bpk. H. Ahmad Fauzi',
    rtRw: 'RT 01 / RW 03',
    amount: 50000,
    paymentDate: '2025-05-10',
    paymentMethod: 'Tunai',
    recordedBy: 'Admin e-Kaffa',
    receiptNumber: 'KWT-202505-001',
    notes: 'Iuran wajib + infak kas',
  },
  {
    id: 'IUR-002',
    kifayahId: 'KFY-001',
    deceasedName: 'Alm. Bpk. H. Sudirman',
    memberId: 'MBR-002',
    memberName: 'Bpk. Ahmad Supriyadi',
    rtRw: 'RT 01 / RW 03',
    amount: 20000,
    paymentDate: '2025-05-10',
    paymentMethod: 'Tunai',
    recordedBy: 'Admin e-Kaffa',
    receiptNumber: 'KWT-202505-002',
    notes: 'Titip di pos ronda',
  },
  {
    id: 'IUR-003',
    kifayahId: 'KFY-001',
    deceasedName: 'Alm. Bpk. H. Sudirman',
    memberId: 'MBR-003',
    memberName: 'Bpk. H. Bambang Hartono',
    rtRw: 'RT 01 / RW 03',
    amount: 100000,
    paymentDate: '2025-05-10',
    paymentMethod: 'Transfer',
    recordedBy: 'Admin e-Kaffa',
    receiptNumber: 'KWT-202505-003',
    notes: 'Transfer via BCA',
  },
  {
    id: 'IUR-004',
    kifayahId: 'KFY-001',
    deceasedName: 'Alm. Bpk. H. Sudirman',
    memberId: 'MBR-004',
    memberName: 'Bpk. Dedi Darmawan',
    rtRw: 'RT 02 / RW 03',
    amount: 10000,
    paymentDate: '2025-05-11',
    paymentMethod: 'Tunai',
    recordedBy: 'Admin e-Kaffa',
    receiptNumber: 'KWT-202505-004',
    notes: 'Iuran standar',
  },
  {
    id: 'IUR-005',
    kifayahId: 'KFY-001',
    deceasedName: 'Alm. Bpk. H. Sudirman',
    memberId: 'MBR-005',
    memberName: 'Ibu Hj. Siti Aminah',
    rtRw: 'RT 02 / RW 03',
    amount: 20000,
    paymentDate: '2025-05-11',
    paymentMethod: 'Tunai',
    recordedBy: 'Admin e-Kaffa',
    receiptNumber: 'KWT-202505-005',
    notes: '',
  },
  {
    id: 'IUR-006',
    kifayahId: 'KFY-002',
    deceasedName: 'Almh. Ibu Hj. Maryam',
    memberId: 'MBR-001',
    memberName: 'Bpk. H. Ahmad Fauzi',
    rtRw: 'RT 01 / RW 03',
    amount: 20000,
    paymentDate: '2025-03-14',
    paymentMethod: 'Tunai',
    recordedBy: 'Admin e-Kaffa',
    receiptNumber: 'KWT-202503-001',
    notes: '',
  },
  {
    id: 'IUR-007',
    kifayahId: 'KFY-002',
    deceasedName: 'Almh. Ibu Hj. Maryam',
    memberId: 'MBR-002',
    memberName: 'Bpk. Ahmad Supriyadi',
    rtRw: 'RT 01 / RW 03',
    amount: 20000,
    paymentDate: '2025-03-14',
    paymentMethod: 'Tunai',
    recordedBy: 'Admin e-Kaffa',
    receiptNumber: 'KWT-202503-002',
    notes: '',
  },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'EXP-001',
    kifayahId: 'KFY-001',
    date: '2025-05-10',
    category: 'Kain Kafan & Pemulasaraan',
    amount: 450000,
    recipient: 'Toko Perlengkapan Jenazah Barokah',
    notes: 'Kain kafan mori prima, kapur barus, minyak wangi cendana, perlengkapan mandi jenazah',
  },
  {
    id: 'EXP-002',
    kifayahId: 'KFY-001',
    date: '2025-05-11',
    category: 'Santunan Keluarga',
    amount: 1500000,
    recipient: 'Ibu Hj. Nurhayati (Ahli Waris)',
    notes: 'Santunan duka cita rukun kifayah diserahkan oleh Bendahara dan Ketua RW',
  },
  {
    id: 'EXP-003',
    kifayahId: 'KFY-002',
    date: '2025-03-14',
    category: 'Kain Kafan & Pemulasaraan',
    amount: 500000,
    recipient: 'Koperasi Masjid Raudlatul Umam',
    notes: 'Paket kain kafan lengkap + pemandian',
  },
  {
    id: 'EXP-004',
    kifayahId: 'KFY-002',
    date: '2025-03-15',
    category: 'Santunan Keluarga',
    amount: 1500000,
    recipient: 'Bpk. Syarif Hidayat (Keluarga Almh. Ibu Hj. Maryam)',
    notes: 'Santunan uang duka diserahkan tunai',
  },
];

// Helper functions for Local Storage
export const getStoredSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = raw ? JSON.parse(raw) : {};
    const effectiveGasUrl =
      parsed.gasUrl && typeof parsed.gasUrl === 'string' && parsed.gasUrl.trim().length > 0
        ? parsed.gasUrl.trim()
        : ENV_GAS_URL;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      gasUrl: effectiveGasUrl,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: AppSettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getStoredMembers = (): Member[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MEMBERS;
  }
};

export const saveStoredMembers = (members: Member[]): void => {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
};

export const getStoredKifayah = (): KifayahEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KIFAYAH);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.KIFAYAH, JSON.stringify(INITIAL_KIFAYAH));
      return INITIAL_KIFAYAH;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_KIFAYAH;
  }
};

export const saveStoredKifayah = (kifayah: KifayahEvent[]): void => {
  localStorage.setItem(STORAGE_KEYS.KIFAYAH, JSON.stringify(kifayah));
};

export const getStoredIuran = (): IuranRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.IURAN);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.IURAN, JSON.stringify(INITIAL_IURAN));
      return INITIAL_IURAN;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_IURAN;
  }
};

export const saveStoredIuran = (iuran: IuranRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.IURAN, JSON.stringify(iuran));
};

export const getStoredExpenses = (): ExpenseRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXPENSES;
  }
};

export const saveStoredExpenses = (expenses: ExpenseRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
};

// Format currency Rupiah
export const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

// Format Date ID
export const formatDateID = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};
