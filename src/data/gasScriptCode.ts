export const GAS_SCRIPT_CODE = `/**
 * ============================================================================
 * e-Kaffa (Kas Kifayah Raudlatul Umam) - Google Apps Script Backend
 * ============================================================================
 * Kode ini bertugas untuk:
 * 1. Otomatis membuat 5 Sheet dengan Header rapi & berwarna:
 *    - PENGATURAN
 *    - ANGGOTA
 *    - KIFAYAH
 *    - IURAN
 *    - PENGELUARAN
 * 2. Mengisi data awal secara otomatis bila masih kosong.
 * 3. Menyediakan API Web (GET & POST) untuk dihubungkan ke aplikasi web e-Kaffa.
 * ============================================================================
 */

// Konfigurasi Nama Sheet
const SHEET_NAMES = {
  SETTINGS: 'PENGATURAN',
  MEMBERS: 'ANGGOTA',
  KIFAYAH: 'KIFAYAH',
  IURAN: 'IURAN',
  EXPENSES: 'PENGELUARAN'
};

/**
 * Endpoint GET: Digunakan untuk mengambil data atau inisialisasi sheet otomatis
 */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : 'get_all_data';
    const callback = e && e.parameter ? e.parameter.callback : null;
    
    if (action === 'init') {
      const initResult = initializeAllSheets();
      return createJsonResponse({
        success: true,
        message: 'Inisialisasi Sheet & Kolom Berhasil!',
        details: initResult
      }, callback);
    }
    
    if (action === 'ping') {
      return createJsonResponse({
        success: true,
        message: 'Koneksi ke Google Sheets e-Kaffa Berhasil!',
        timestamp: new Date().toISOString()
      }, callback);
    }

    // Aksi hapus via GET (fallback jika POST diblokir CORS)
    if (action === 'delete_member') {
      const id = e && e.parameter ? e.parameter.id : null;
      return deleteRowByFirstColumn(SHEET_NAMES.MEMBERS, id, callback);
    }

    if (action === 'delete_kifayah') {
      const id = e && e.parameter ? e.parameter.id : null;
      return deleteRowByFirstColumn(SHEET_NAMES.KIFAYAH, id, callback);
    }

    if (action === 'delete_iuran') {
      const id = e && e.parameter ? e.parameter.id : null;
      return deleteRowByFirstColumn(SHEET_NAMES.IURAN, id, callback);
    }

    if (action === 'delete_expense') {
      const id = e && e.parameter ? e.parameter.id : null;
      return deleteRowByFirstColumn(SHEET_NAMES.EXPENSES, id, callback);
    }

    // Default: Ambil seluruh data
    const allData = getAllDataFromSheets();
    return createJsonResponse({
      success: true,
      data: allData
    }, callback);
  } catch (err) {
    const callback = e && e.parameter ? e.parameter.callback : null;
    return createJsonResponse({
      success: false,
      message: 'Error doGet: ' + err.toString()
    }, callback);
  }
}

/**
 * Endpoint POST: Digunakan untuk menyimpan transaksi, anggota, kifayah, atau pengaturan
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;

    if (action === 'init') {
      initializeAllSheets();
      return createJsonResponse({ success: true, message: 'Sheet berhasil diinisialisasi.' });
    }

    if (action === 'save_iuran') {
      return saveIuranRecord(payload.data);
    }

    if (action === 'batch_iuran') {
      return batchSaveIuran(payload.data);
    }

    if (action === 'save_member') {
      return saveMemberRecord(payload.data);
    }

    if (action === 'save_kifayah') {
      return saveKifayahRecord(payload.data);
    }

    if (action === 'save_expense') {
      return saveExpenseRecord(payload.data);
    }

    if (action === 'delete_member') {
      return deleteRowByFirstColumn(SHEET_NAMES.MEMBERS, payload.data?.id || payload.data);
    }

    if (action === 'delete_kifayah') {
      return deleteRowByFirstColumn(SHEET_NAMES.KIFAYAH, payload.data?.id || payload.data);
    }

    if (action === 'delete_iuran') {
      return deleteRowByFirstColumn(SHEET_NAMES.IURAN, payload.data?.id || payload.data);
    }

    if (action === 'delete_expense') {
      return deleteRowByFirstColumn(SHEET_NAMES.EXPENSES, payload.data?.id || payload.data);
    }

    return createJsonResponse({
      success: false,
      message: 'Aksi tidak dikenali: ' + action
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      message: 'Error doPost: ' + err.toString()
    });
  }
}

/**
 * FUNGSI OTOMATIS: Membuat seluruh Sheet dan Kolom Header dengan format rapi
 */
function initializeAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet PENGATURAN
  setupSheet(ss, SHEET_NAMES.SETTINGS, [
    'KUNCI_SETTING', 'NILAI_SETTING', 'KETERANGAN'
  ], [
    ['NAMA_APLIKASI', 'e-Kaffa', 'Nama aplikasi'],
    ['NAMA_LEMBAGA', 'Rukun Kifayah Raudlatul Umam', 'Nama paguyuban/masjid/RT'],
    ['MINIMAL_IURAN', '10000', 'Besaran iuran minimum per warga (Rp)'],
    ['DEFAULT_SANTUNAN', '1500000', 'Standar santunan duka cita (Rp)'],
    ['ADMIN_USERNAME', 'admin', 'Username login admin'],
    ['ADMIN_PASSWORD', 'admin123', 'Kata sandi login admin'],
    ['NAMA_BENDAHARA', 'H. Ahmad Fauzi', 'Nama bendahara pengurus'],
    ['KONTAK_BENDAHARA', '081234567890', 'Nomor WA bendahara'],
    ['PESAN_FOOTER', 'Jazakumullah khairan katsiran atas sedekah jariyah bapak/ibu.', 'Pesan terima kasih WA']
  ], '#065F46');

  // 2. Sheet ANGGOTA
  setupSheet(ss, SHEET_NAMES.MEMBERS, [
    'ID_Anggota', 'Nama_Lengkap', 'Keterangan_Tambahan', 'Dusun', 'Nomor_WA', 'Alamat', 'Status', 'Tanggal_Daftar'
  ], [
    ['MBR-001', 'Bpk. Ahmad Supriyadi', '', 'Dusun 1', '081234567891', 'Jl. Kenanga No. 12', 'aktif', '2025-01-01'],
    ['MBR-002', 'Bpk. H. Bambang Hartono', '', 'Dusun 1', '081234567892', 'Jl. Kenanga No. 15', 'aktif', '2025-01-01'],
    ['MBR-003', 'Bpk. Dedi Darmawan', '', 'Dusun 2', '081234567893', 'Jl. Melati No. 04', 'aktif', '2025-01-02'],
    ['MBR-004', 'Ibu Hj. Siti Aminah', '', 'Dusun 2', '081234567894', 'Jl. Melati No. 09', 'aktif', '2025-01-02'],
    ['MBR-005', 'Bpk. Joko Purnomo', '', 'Dusun 3', '081234567895', 'Jl. Mawar No. 21', 'aktif', '2025-01-03']
  ], '#065F46');

  // 3. Sheet KIFAYAH
  setupSheet(ss, SHEET_NAMES.KIFAYAH, [
    'ID_Kifayah', 'Nama_Almarhum', 'Bin_Binti', 'Tanggal_Wafat', 'Nama_Ahli_Waris', 'Alamat_Duka', 'Target_Per_Warga', 'Status', 'Santunan_Diserahkan', 'Biaya_Kafan_Makam', 'Catatan', 'Dibuat_Pada'
  ], [
    ['KFY-001', 'Alm. Bpk. H. Sudirman', 'Bin H. Mansyur', '2025-05-10', 'Ibu Nurhayati (Istri)', 'Jl. Kenanga No. 08, Dusun 1', '10000', 'aktif', '1500000', '450000', 'Wafat di RSUD karena sakit usia tua', new Date().toISOString()]
  ], '#065F46');

  // 4. Sheet IURAN
  setupSheet(ss, SHEET_NAMES.IURAN, [
    'ID_Iuran', 'Tanggal_Bayar', 'ID_Kifayah', 'Nama_Almarhum', 'ID_Anggota', 'Nama_Anggota', 'Dusun', 'Jumlah_Iuran', 'Metode_Bayar', 'Pencatat_Admin', 'Nomor_Kuitansi', 'Catatan'
  ], [
    ['IUR-001', '2025-05-10', 'KFY-001', 'Alm. Bpk. H. Sudirman', 'MBR-001', 'Bpk. Ahmad Supriyadi', 'Dusun 1', '20000', 'Tunai', 'H. Ahmad Fauzi', 'KWT-202505-001', 'Iuran wajib + infak'],
    ['IUR-002', '2025-05-10', 'KFY-001', 'Alm. Bpk. H. Sudirman', 'MBR-002', 'Bpk. H. Bambang Hartono', 'Dusun 1', '50000', 'Transfer', 'H. Ahmad Fauzi', 'KWT-202505-002', 'Transfer Bank'],
    ['IUR-003', '2025-05-11', 'KFY-001', 'Alm. Bpk. H. Sudirman', 'MBR-003', 'Bpk. Dedi Darmawan', 'Dusun 2', '10000', 'Tunai', 'H. Ahmad Fauzi', 'KWT-202505-003', 'Lunas']
  ], '#065F46');

  // 5. Sheet PENGELUARAN
  setupSheet(ss, SHEET_NAMES.EXPENSES, [
    'ID_Pengeluaran', 'Tanggal', 'ID_Kifayah', 'Kategori', 'Jumlah', 'Penerima', 'Keterangan'
  ], [
    ['EXP-001', '2025-05-10', 'KFY-001', 'Kain Kafan & Pemulasaraan', '450000', 'Toko Perlengkapan Jenazah Barokah', 'Kain kafan, kapur barus, minyak wangi, sabun'],
    ['EXP-002', '2025-05-11', 'KFY-001', 'Santunan Keluarga', '1500000', 'Ibu Nurhayati (Ahli Waris)', 'Santunan duka cita dari kas rukun kifayah']
  ], '#065F46');

  // Hapus sheet default bawaan (Sheet1 / Lembar1) jika ada dan kosong
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e){}
  }

  return 'Semua sheet e-Kaffa berhasil dibuat dan diformat otomatis.';
}

/**
 * Helper: Menyiapkan sheet, membuat header indah, border, dan isi awal bila kosong
 */
function setupSheet(ss, sheetName, headers, defaultRows, headerColor) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Cek apakah sheet masih kosong
  if (sheet.getLastRow() === 0) {
    // Tulis Header
    sheet.appendRow(headers);

    // Format Header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(headerColor || '#065F46');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    headerRange.setFontFamily('Arial');
    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1);

    // Masukkan data default jika ada
    if (defaultRows && defaultRows.length > 0) {
      for (let i = 0; i < defaultRows.length; i++) {
        sheet.appendRow(defaultRows[i]);
      }
    }

    // Auto-fit kolom
    for (let c = 1; c <= headers.length; c++) {
      sheet.autoResizeColumn(c);
      if (sheet.getColumnWidth(c) < 120) {
        sheet.setColumnWidth(c, 130);
      }
    }

    // Grid border tipis
    const fullRange = sheet.getDataRange();
    fullRange.setBorder(true, true, true, true, true, true, '#D1D5DB', SpreadsheetApp.BorderStyle.SOLID);
  }

  return sheet;
}

/**
 * Mengambil seluruh data dari sheet untuk aplikasi
 */
function getAllDataFromSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Ambil Settings
  const settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  const settings = {};
  if (settingsSheet && settingsSheet.getLastRow() > 1) {
    const sData = settingsSheet.getRange(2, 1, settingsSheet.getLastRow() - 1, 3).getValues();
    sData.forEach(row => {
      const key = String(row[0]).trim();
      const val = row[1];
      if (key === 'MINIMAL_IURAN') settings.minIuran = Number(val) || 10000;
      else if (key === 'DEFAULT_SANTUNAN') settings.defaultSantunan = Number(val) || 1500000;
      else if (key === 'NAMA_APLIKASI') settings.appName = String(val);
      else if (key === 'NAMA_LEMBAGA') settings.organizationName = String(val);
      else if (key === 'ADMIN_USERNAME') settings.adminUsername = String(val);
      else if (key === 'ADMIN_PASSWORD') settings.adminPasswordHash = String(val);
      else if (key === 'NAMA_BENDAHARA') settings.treasurerName = String(val);
      else if (key === 'KONTAK_BENDAHARA') settings.treasurerPhone = String(val);
      else if (key === 'PESAN_FOOTER') settings.whatsappFooter = String(val);
    });
  }

  // 2. Ambil Anggota
  const membersSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  const members = [];
  if (membersSheet && membersSheet.getLastRow() > 1) {
    const mData = membersSheet.getRange(2, 1, membersSheet.getLastRow() - 1, 8).getValues();
    mData.forEach((r, idx) => {
      const idVal = String(r[0] || '').trim();
      const nameVal = String(r[1] || '').trim();
      if (idVal !== '' || nameVal !== '') {
        members.push({
          id: idVal || ('MBR-' + (idx + 1)),
          name: nameVal || idVal,
          kkNumber: String(r[2] || ''),
          rtRw: String(r[3] || 'Dusun 1'),
          phone: String(r[4] || ''),
          address: String(r[5] || ''),
          status: String(r[6] || 'aktif'),
          joinDate: formatDate(r[7]) || new Date().toISOString().split('T')[0]
        });
      }
    });
  }

  // 3. Ambil Kifayah
  const kifayahSheet = ss.getSheetByName(SHEET_NAMES.KIFAYAH);
  const kifayahList = [];
  if (kifayahSheet && kifayahSheet.getLastRow() > 1) {
    const kData = kifayahSheet.getRange(2, 1, kifayahSheet.getLastRow() - 1, 12).getValues();
    mDataLoop: kData.forEach((r, idx) => {
      const idVal = String(r[0] || '').trim();
      const deceasedNameVal = String(r[1] || '').trim();
      if (idVal !== '' || deceasedNameVal !== '') {
        kifayahList.push({
          id: idVal || ('KFY-' + (idx + 1)),
          deceasedName: deceasedNameVal || idVal,
          binBinti: String(r[2] || ''),
          deathDate: formatDate(r[3]) || new Date().toISOString().split('T')[0],
          heirName: String(r[4] || ''),
          address: String(r[5] || ''),
          targetPerMember: Number(r[6]) || 10000,
          status: String(r[7] || 'aktif'),
          assistanceGiven: Number(r[8]) || 0,
          funeralCost: Number(r[9]) || 0,
          notes: String(r[10] || ''),
          createdAt: formatDate(r[11]) || new Date().toISOString()
        });
      }
    });
  }

  // 4. Ambil Iuran
  const iuranSheet = ss.getSheetByName(SHEET_NAMES.IURAN);
  const iuranList = [];
  if (iuranSheet && iuranSheet.getLastRow() > 1) {
    const iData = iuranSheet.getRange(2, 1, iuranSheet.getLastRow() - 1, 12).getValues();
    iData.forEach((r, idx) => {
      const idVal = String(r[0] || '').trim();
      const memberNameVal = String(r[5] || '').trim();
      if (idVal !== '' || memberNameVal !== '') {
        iuranList.push({
          id: idVal || ('IUR-' + (idx + 1)),
          paymentDate: formatDate(r[1]) || new Date().toISOString().split('T')[0],
          kifayahId: String(r[2] || ''),
          deceasedName: String(r[3] || ''),
          memberId: String(r[4] || ''),
          memberName: memberNameVal,
          rtRw: String(r[6] || ''),
          amount: Number(r[7]) || 0,
          paymentMethod: String(r[8] || 'Tunai'),
          recordedBy: String(r[9] || 'Admin'),
          receiptNumber: String(r[10] || ''),
          notes: String(r[11] || '')
        });
      }
    });
  }

  // 5. Ambil Pengeluaran
  const expenseSheet = ss.getSheetByName(SHEET_NAMES.EXPENSES);
  const expensesList = [];
  if (expenseSheet && expenseSheet.getLastRow() > 1) {
    const eData = expenseSheet.getRange(2, 1, expenseSheet.getLastRow() - 1, 7).getValues();
    eData.forEach((r, idx) => {
      const idVal = String(r[0] || '').trim();
      const amountVal = Number(r[4]) || 0;
      if (idVal !== '' || amountVal > 0) {
        expensesList.push({
          id: idVal || ('EXP-' + (idx + 1)),
          date: formatDate(r[1]) || new Date().toISOString().split('T')[0],
          kifayahId: String(r[2] || '-'),
          category: String(r[3] || 'Operasional'),
          amount: amountVal,
          recipient: String(r[5] || ''),
          notes: String(r[6] || '')
        });
      }
    });
  }

  return {
    settings: settings,
    members: members,
    kifayahList: kifayahList,
    iuranList: iuranList,
    expensesList: expensesList
  };
}

/**
 * Menyimpan data 1 iuran
 */
function saveIuranRecord(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.IURAN) || initializeAllSheets() && ss.getSheetByName(SHEET_NAMES.IURAN);
  
  sheet.appendRow([
    item.id,
    item.paymentDate,
    item.kifayahId,
    item.deceasedName,
    item.memberId,
    item.memberName,
    item.rtRw,
    item.amount,
    item.paymentMethod,
    item.recordedBy,
    item.receiptNumber,
    item.notes || ''
  ]);

  return createJsonResponse({ success: true, message: 'Iuran berhasil dicatat ke Google Sheet', id: item.id });
}

/**
 * Menyimpan batch/banyak iuran (checklist massal)
 */
function batchSaveIuran(items) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.IURAN);
  if (!items || !items.length) {
    return createJsonResponse({ success: false, message: 'Tidak ada data untuk disimpan' });
  }

  const rows = items.map(item => [
    item.id,
    item.paymentDate,
    item.kifayahId,
    item.deceasedName,
    item.memberId,
    item.memberName,
    item.rtRw,
    item.amount,
    item.paymentMethod,
    item.recordedBy,
    item.receiptNumber,
    item.notes || ''
  ]);

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  return createJsonResponse({ success: true, message: rows.length + ' iuran berhasil disimpan massal' });
}

/**
 * Menyimpan / memperbarui data Anggota
 */
function saveMemberRecord(m) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(m.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowValues = [
    m.id, m.name, m.kkNumber || '', m.rtRw, m.phone || '', m.address || '', m.status || 'aktif', m.joinDate || new Date().toISOString().split('T')[0]
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, 8).setValues([rowValues]);
    return createJsonResponse({ success: true, message: 'Data anggota diperbarui' });
  } else {
    sheet.appendRow(rowValues);
    return createJsonResponse({ success: true, message: 'Anggota baru berhasil ditambahkan' });
  }
}

/**
 * Menyimpan / memperbarui Kifayah
 */
function saveKifayahRecord(k) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.KIFAYAH);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(k.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowValues = [
    k.id, k.deceasedName, k.binBinti || '', k.deathDate, k.heirName, k.address, k.targetPerMember || 10000, k.status || 'aktif', k.assistanceGiven || 0, k.funeralCost || 0, k.notes || '', k.createdAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, 12).setValues([rowValues]);
    return createJsonResponse({ success: true, message: 'Data kifayah diperbarui' });
  } else {
    sheet.appendRow(rowValues);
    return createJsonResponse({ success: true, message: 'Data kifayah baru disimpan' });
  }
}

/**
 * Menyimpan Pengeluaran Kas
 */
function saveExpenseRecord(exp) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.EXPENSES);
  sheet.appendRow([
    exp.id, exp.date, exp.kifayahId || '-', exp.category, exp.amount, exp.recipient, exp.notes || ''
  ]);
  return createJsonResponse({ success: true, message: 'Pengeluaran kas berhasil dicatat' });
}

/**
 * Memperbarui Pengaturan
 */
function updateSettingsRecord(s) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  const data = sheet.getDataRange().getValues();

  function updateKey(key, value) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        return;
      }
    }
    sheet.appendRow([key, value, 'Custom setting']);
  }

  if (s.minIuran !== undefined) updateKey('MINIMAL_IURAN', s.minIuran);
  if (s.defaultSantunan !== undefined) updateKey('DEFAULT_SANTUNAN', s.defaultSantunan);
  if (s.appName !== undefined) updateKey('NAMA_APLIKASI', s.appName);
  if (s.organizationName !== undefined) updateKey('NAMA_LEMBAGA', s.organizationName);
  if (s.adminUsername !== undefined) updateKey('ADMIN_USERNAME', s.adminUsername);
  if (s.adminPasswordHash !== undefined) updateKey('ADMIN_PASSWORD', s.adminPasswordHash);
  if (s.treasurerName !== undefined) updateKey('NAMA_BENDAHARA', s.treasurerName);
  if (s.treasurerPhone !== undefined) updateKey('KONTAK_BENDAHARA', s.treasurerPhone);
  if (s.whatsappFooter !== undefined) updateKey('PESAN_FOOTER', s.whatsappFooter);

  return createJsonResponse({ success: true, message: 'Pengaturan di Google Sheet berhasil diperbarui' });
}

/**
 * Menghapus 1 baris data di Google Sheet berdasarkan ID di Kolom Pertama
 */
function deleteRowByFirstColumn(sheetName, idValue, callback) {
  if (!idValue) return createJsonResponse({ success: false, message: 'ID tidak diberikan' }, callback);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ success: false, message: 'Sheet tidak ditemukan: ' + sheetName }, callback);
  
  const target = String(idValue).trim();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const col0 = String(data[i][0] || '').trim();
    const col1 = String(data[i][1] || '').trim();
    if (col0 === target || (col1 && col1 === target)) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true, message: 'Baris ' + target + ' berhasil dihapus dari sheet ' + sheetName }, callback);
    }
  }
  return createJsonResponse({ success: true, message: 'Baris ' + target + ' tidak ditemukan atau sudah terhapus di sheet ' + sheetName }, callback);
}

/**
 * Format tanggal sederhana YYYY-MM-DD
 */
function formatDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }
  return String(d).split('T')[0];
}

/**
 * Response JSON aman dengan header CORS & dukungan JSONP
 */
function createJsonResponse(data, callback) {
  const jsonString = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + jsonString + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}
`;
