import React from 'react';
import { IuranRecord, AppSettings } from '../types';
import { formatRupiah, formatDateID } from '../services/storageService';
import { X, Printer, Share2, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  receipt: IuranRecord | null;
  settings: AppSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, settings, onClose }) => {
  if (!receipt) return null;

  const handleShareWhatsApp = () => {
    const text = `*BUKTI PEMBAYARAN IURAN KIFAYAH*
*${settings.organizationName}*
---------------------------------------
No. Kuitansi: *${receipt.receiptNumber}*
Tanggal: ${formatDateID(receipt.paymentDate)}

Telah terima dari:
Nama: *${receipt.memberName}* (${receipt.rtRw})
Guna Pembayaran: Iuran Kifayah atas wafatnya *${receipt.deceasedName}*
Jumlah: *${formatRupiah(receipt.amount)}*
Metode: ${receipt.paymentMethod}
Pencatat: ${receipt.recordedBy}

_${settings.whatsappFooter}_
---------------------------------------
_Tercatat otomatis pada sistem ${settings.appName}_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-800 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="font-semibold text-sm tracking-wide">Kuitansi Pembayaran Digital</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 bg-amber-50/20 text-slate-800 text-sm">
          {/* Institution Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="text-lg font-bold text-emerald-900 tracking-tight">{settings.appName}</h2>
            <p className="text-xs font-semibold text-emerald-700 uppercase">{settings.organizationName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Layanan Iuran Kematian & Kas Rukun Kifayah Warga</p>
          </div>

          {/* Receipt Info */}
          <div className="flex justify-between items-center text-xs text-slate-500 py-3 border-b border-slate-100">
            <div>
              <span>No: </span>
              <span className="font-mono font-semibold text-slate-700">{receipt.receiptNumber}</span>
            </div>
            <div>
              <span>Tgl: </span>
              <span className="font-medium text-slate-700">{formatDateID(receipt.paymentDate)}</span>
            </div>
          </div>

          {/* Core Details */}
          <div className="py-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500">Nama Anggota:</span>
              <span className="font-semibold text-slate-800 text-right">{receipt.memberName}</span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500">Wilayah / RT:</span>
              <span className="font-medium text-slate-700 text-right">{receipt.rtRw}</span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500">Kifayah Almarhum/ah:</span>
              <span className="font-semibold text-emerald-900 text-right">{receipt.deceasedName}</span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500">Metode Bayar:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                {receipt.paymentMethod}
              </span>
            </div>

            {receipt.notes && (
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Catatan:</span>
                <span className="text-slate-600 italic text-right">{receipt.notes}</span>
              </div>
            )}
          </div>

          {/* Total Amount Box */}
          <div className="my-2 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/80 text-center">
            <span className="text-xs text-emerald-700 font-medium block">JUMLAH IURAN</span>
            <span className="text-2xl font-extrabold text-emerald-900 tracking-tight">
              {formatRupiah(receipt.amount)}
            </span>
          </div>

          {/* Stamp & Signature Section */}
          <div className="pt-3 flex items-center justify-between">
            <div className="border-2 border-emerald-600 rounded-lg p-1.5 transform -rotate-3 text-center opacity-85">
              <span className="block text-[10px] font-extrabold text-emerald-700 tracking-wider">LUNAS</span>
              <span className="block text-[8px] text-emerald-600 uppercase font-semibold">Kas Raudlatul Umam</span>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-400 block text-[10px]">Penerima / Bendahara</span>
              <span className="font-semibold text-slate-700 mt-2 block">{receipt.recordedBy || settings.treasurerName}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-slate-200 text-center">
            <p className="text-[10px] text-slate-400 italic">
              {settings.whatsappFooter}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" />
            Kirim WhatsApp
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 shadow-xs transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
        </div>

      </div>
    </div>
  );
};
