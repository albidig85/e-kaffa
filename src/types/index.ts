export type UserRole = 'public' | 'admin';

export interface Member {
  id: string;
  name: string;
  kkNumber?: string;
  rtRw: string;
  phone: string;
  address: string;
  status: 'aktif' | 'non-aktif';
  joinDate: string;
}

export interface KifayahEvent {
  id: string;
  deceasedName: string;
  binBinti: string;
  deathDate: string;
  heirName: string; // Nama Ahli Waris
  address: string;
  targetPerMember: number; // Minimal iuran per warga saat kifayah ini
  status: 'aktif' | 'selesai'; // Aktif jika masih dalam masa penghimpunan iuran
  assistanceGiven: number; // Santunan yang diserahkan ke keluarga
  funeralCost: number; // Biaya kain kafan, makam, pemandian
  notes?: string;
  createdAt: string;
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
