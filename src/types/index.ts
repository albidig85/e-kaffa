export type UserRole = 'public' | 'admin';

export interface Member {
  id: string;
  name: string;
  rtRw: string;
  status: 'aktif' | 'non-aktif' | 'almarhum';
  joinDate: string;
  obligatedKifayahIds?: string[]; // ID kifayah yang diwajibkan iurannya
  obligatedKifayahNames?: string[]; // Nama kifayah yang diwajibkan iurannya
  // Kolom opsional (kompatibilitas data lama jika ada)
  phone?: string;
  address?: string;
  kkNumber?: string;
}

export interface KifayahEvent {
  id: string;
  deceasedName: string;
  deceasedMemberId?: string;
  deathDate: string;
  status: 'aktif' | 'selesai'; // Aktif jika masih dalam masa penghimpunan iuran
  notes?: string;
  createdAt: string;
  // Kolom opsional (kompatibilitas data lama jika ada)
  binBinti?: string;
  heirName?: string;
  address?: string;
  targetPerMember?: number;
  assistanceGiven?: number;
  funeralCost?: number;
}

export interface IuranRecord {
  id: string;
  kifayahId: string;
  deceasedName: string;
  memberId: string;
  memberName: string;
  rtRw: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Tunai' | 'Transfer';
  recordedBy: string;
  receiptNumber: string;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  kifayahId?: string;
  date: string;
  category: 'Santunan Keluarga' | 'Kain Kafan & Pemulasaraan' | 'Makam & Penggalian' | 'Ambulans' | 'Konsumsi Takziah' | 'Operasional';
  amount: number;
  recipient: string;
  notes: string;
}

export interface AppSettings {
  appName: string;
  organizationName: string;
  minIuran: number;
  defaultSantunan: number;
  adminUsername: string;
  adminPasswordHash: string; // or plain for simplicity
  treasurerName: string;
  treasurerPhone: string;
  gasUrl: string; // Google Apps Script Web App URL
  whatsappFooter: string;
}

export interface GasApiResponse {
  success: boolean;
  message?: string;
  data?: {
    settings?: Partial<AppSettings>;
    members?: Member[];
    kifayahList?: KifayahEvent[];
    iuranList?: IuranRecord[];
    expensesList?: ExpenseRecord[];
  };
}
