import { AppSettings, ExpenseRecord, GasApiResponse, IuranRecord, KifayahEvent, Member } from '../types';

/**
 * Normalisasi URL Web App Google Apps Script.
 * Memastikan selalu berakhiran '/exec' agar tidak error 'Failed to fetch'.
 */
export function normalizeGasUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Hapus trailing slash
  url = url.replace(/\/+$/, '');
  
  // Jika URL mengarah ke script.google.com tapi tidak ada /exec atau /dev di belakangnya
  if (url.includes('script.google.com/macros/s/') && !url.endsWith('/exec') && !url.endsWith('/dev')) {
    url = `${url}/exec`;
  }
  return url;
}

/**
 * Helper JSONP untuk melewati pembatasan CORS browser secara 100%
 */
function fetchWithJsonp<T>(url: string, timeoutMs = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = `__ekaffa_gas_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const separator = url.includes('?') ? '&' : '?';
    const scriptUrl = `${url}${separator}callback=${callbackName}`;

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;

    let timeoutId: any;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[callbackName];
    };

    (window as any)[callbackName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Gagal memuat script JSONP. Pastikan opsi "Who has access" disetel ke "Anyone" (Siapa saja).'));
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Koneksi timeout. Pastikan deployment Google Apps Script aktif.'));
    }, timeoutMs);

    document.head.appendChild(script);
  });
}

export class GasService {
  /**
   * Menguji koneksi URL Google Apps Script
   */
  static async testConnection(rawUrl: string): Promise<{ success: boolean; message: string; normalizedUrl: string }> {
    const url = normalizeGasUrl(rawUrl);
    if (!url || !url.startsWith('http')) {
      return {
        success: false,
        message: 'URL Web App tidak valid. Pastikan diawali dengan https://script.google.com/macros/s/.../exec',
        normalizedUrl: url,
      };
    }

    const pingUrl = `${url}${url.includes('?') ? '&' : '?'}action=ping`;

    // 1. Coba fetch standar (tanpa header khusus agar tidak memicu CORS preflight block)
    try {
      const res = await fetch(pingUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (res.ok) {
        const json = await res.json();
        return {
          success: json.success ?? true,
          message: json.message || 'Koneksi ke Google Apps Script berhasil terhubung!',
          normalizedUrl: url,
        };
      }
    } catch (err: any) {
      console.warn('Fetch langsung gagal, mencoba fallback JSONP:', err);
    }

    // 2. Fallback JSONP (melewati CORS)
    try {
      const jsonpResult = await fetchWithJsonp<any>(pingUrl);
      return {
        success: jsonpResult.success ?? true,
        message: jsonpResult.message || 'Koneksi ke Google Apps Script berhasil terhubung (via JSONP)!',
        normalizedUrl: url,
      };
    } catch (jsonpErr: any) {
      return {
        success: false,
        message: `Gagal terhubung. Penyebab umum: 
1. Pada menu Deploy di Google Apps Script, pastikan opsi "Who has access" (Siapa yang memiliki akses) diatur ke "Anyone" (Siapa saja), BUKAN "Only myself".
2. Pastikan Anda sudah menyetujui izin Google (Review Permissions > Allow).
3. URL harus berakhiran /exec. Sistem telah menyesuaikan ke: ${url}`,
        normalizedUrl: url,
      };
    }
  }

  /**
   * Memicu inisialisasi pembuatan Sheet & Kolom Header di Google Spreadsheet
   */
  static async initializeSheets(rawUrl: string): Promise<{ success: boolean; message: string; normalizedUrl: string }> {
    const url = normalizeGasUrl(rawUrl);
    if (!url) {
      return {
        success: false,
        message: 'URL Web App Google Apps Script belum diisi.',
        normalizedUrl: url,
      };
    }

    const initUrl = `${url}${url.includes('?') ? '&' : '?'}action=init`;

    // 1. Coba fetch standar
    try {
      const res = await fetch(initUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (res.ok) {
        const json = await res.json();
        return {
          success: json.success,
          message: json.message || 'Inisialisasi 5 Sheet & Kolom Header Google Spreadsheet Selesai!',
          normalizedUrl: url,
        };
      }
    } catch (err) {
      console.warn('Fetch init langsung gagal, mencoba via JSONP:', err);
    }

    // 2. Fallback JSONP (melewati CORS)
    try {
      const jsonpResult = await fetchWithJsonp<any>(initUrl);
      return {
        success: jsonpResult.success,
        message: jsonpResult.message || 'Inisialisasi 5 Sheet & Kolom Header Google Spreadsheet Selesai!',
        normalizedUrl: url,
      };
    } catch (jsonpErr: any) {
      return {
        success: false,
        message: `Gagal menjalankan inisialisasi. 
Periksa:
1. Pastikan "Who has access" (Siapa yang memiliki akses) diatur ke "Anyone" (Siapa saja).
2. Anda juga dapat mengklik tombol "Jalankan Inisialisasi di Tab Baru" di bawah untuk menjalankannya langsung di browser!`,
        normalizedUrl: url,
      };
    }
  }

  /**
   * Mengambil semua data dari Google Sheet via GAS dengan cache-busting (_t)
   */
  static async fetchAllData(rawUrl: string): Promise<GasApiResponse | null> {
    const url = normalizeGasUrl(rawUrl);
    if (!url || !url.startsWith('http')) return null;

    const cacheBuster = `_t=${Date.now()}`;
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=get_all_data&${cacheBuster}`;

    // 1. Coba fetch standar dengan batas waktu cepat
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(fetchUrl, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      // Lanjut ke fallback JSONP jika fetch diblokir CORS atau timeout
    }

    // 2. Fallback JSONP
    try {
      const jsonpData = await fetchWithJsonp<GasApiResponse>(fetchUrl, 10000);
      return jsonpData;
    } catch {
      return null;
    }
  }

  /**
   * Mengirim data ke GAS menggunakan POST
   */
  static async sendDataToGas(rawUrl: string, action: string, data: any): Promise<boolean> {
    const url = normalizeGasUrl(rawUrl);
    if (!url || !url.startsWith('http')) return false;

    try {
      // Content-Type text/plain prevents CORS preflight OPTIONS block in GAS
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, data }),
      });

      return res.ok;
    } catch (err) {
      console.warn('Gagal kirim POST ke GAS:', err);
      return false;
    }
  }

  static async syncIuran(url: string, item: IuranRecord): Promise<boolean> {
    return this.sendDataToGas(url, 'save_iuran', item);
  }

  static async syncBatchIuran(url: string, items: IuranRecord[]): Promise<boolean> {
    return this.sendDataToGas(url, 'batch_iuran', items);
  }

  static async syncMember(url: string, member: Member): Promise<boolean> {
    return this.sendDataToGas(url, 'save_member', member);
  }

  static async syncKifayah(url: string, kifayah: KifayahEvent): Promise<boolean> {
    return this.sendDataToGas(url, 'save_kifayah', kifayah);
  }

  static async syncExpense(rawUrl: string, expense: ExpenseRecord): Promise<boolean> {
    const url = normalizeGasUrl(rawUrl);
    if (!url || !url.startsWith('http')) return false;

    // 1. Coba POST terlebih dahulu
    try {
      const postSuccess = await this.sendDataToGas(url, 'save_expense', expense);
      if (postSuccess) return true;
    } catch {
      // lanjutkan ke fallback
    }

    // 2. Fallback GET (aman dari CORS block browser / Google Apps Script)
    try {
      const getUrl = `${url}${url.includes('?') ? '&' : '?'}action=save_expense&data=${encodeURIComponent(JSON.stringify(expense))}&_t=${Date.now()}`;
      await fetch(getUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
      });
      return true;
    } catch (err) {
      console.warn('Fallback syncExpense GET gagal:', err);
      return false;
    }
  }

  static async syncSettings(rawUrl: string, settings: Partial<AppSettings>): Promise<boolean> {
    const url = normalizeGasUrl(rawUrl);
    if (!url || !url.startsWith('http')) return false;

    // 1. Coba kirim via POST
    try {
      const postSuccess = await this.sendDataToGas(url, 'update_settings', settings);
      if (postSuccess) return true;
    } catch {
      // lanjutkan ke fallback GET
    }

    // 2. Fallback GET (aman dari kendala CORS pada browser & redirect Google Apps Script)
    try {
      const getUrl = `${url}${url.includes('?') ? '&' : '?'}action=update_settings&data=${encodeURIComponent(JSON.stringify(settings))}&_t=${Date.now()}`;
      await fetch(getUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
      });
      return true;
    } catch (err) {
      console.warn('Fallback syncSettings GET gagal:', err);
      return false;
    }
  }

  /**
   * Helper eksekusi hapus baris di GAS dengan metode ganda (POST & GET fallback)
   */
  private static async executeDelete(rawUrl: string, action: string, id: string): Promise<boolean> {
    const url = normalizeGasUrl(rawUrl);
    if (!url || !url.startsWith('http')) return false;

    // 1. Coba POST terlebih dahulu
    try {
      const postSuccess = await this.sendDataToGas(url, action, { id });
      if (postSuccess) return true;
    } catch {
      // lanjutkan ke fallback
    }

    // 2. Fallback GET (100% lolos tanpa CORS blocker di Google Apps Script)
    try {
      const separator = url.includes('?') ? '&' : '?';
      const getUrl = `${url}${separator}action=${action}&id=${encodeURIComponent(id)}&_t=${Date.now()}`;
      await fetch(getUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
      });
      return true;
    } catch (err) {
      console.warn(`Fallback GET untuk ${action} gagal:`, err);
      return false;
    }
  }

  static async deleteMember(url: string, id: string): Promise<boolean> {
    return this.executeDelete(url, 'delete_member', id);
  }

  static async deleteKifayah(url: string, id: string): Promise<boolean> {
    return this.executeDelete(url, 'delete_kifayah', id);
  }

  static async deleteIuran(url: string, id: string): Promise<boolean> {
    return this.executeDelete(url, 'delete_iuran', id);
  }

  static async deleteExpense(url: string, id: string): Promise<boolean> {
    return this.executeDelete(url, 'delete_expense', id);
  }
}
