"use client";

// ============================================================================
// Settings Page (ຕັ້ງຄ່າລະບົບ) - Clean, Essential-Only Layout
// Store Profile, VAT & QR Payment, and Single-Click Printer Settings Shortcut
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  Store,
  Printer,
  Save,
  QrCode,
  Settings,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { DEFAULT_STORE } from "@/features/pos/constants/pos.constants";
import {
  HardwareService,
  PrinterSettings,
  DEFAULT_PRINTER_SETTINGS,
} from "@/features/pos/services/hardware.service";
import { PrinterSettingsModal } from "@/features/pos/components/PrinterSettingsModal";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

export function SettingsPage() {
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(
    DEFAULT_PRINTER_SETTINGS
  );
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);

  // Store profile
  const [storeName, setStoreName] = useState(DEFAULT_STORE.name_lo);
  const [storeBranch, setStoreBranch] = useState(DEFAULT_STORE.branch);
  const [storePhone, setStorePhone] = useState(DEFAULT_STORE.phone);

  // VAT & Lao QR
  const [vatRate, setVatRate] = useState<number>(7);
  const [qrAccountNo, setQrAccountNo] = useState("010-12-00-01234567-001");
  const [qrAccountName, setQrAccountName] = useState("QUICKONE POS");

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPrinterSettings(HardwareService.getSettings());
      try {
        const storedStoreName = localStorage.getItem("pos_store_name");
        if (storedStoreName) setStoreName(storedStoreName);

        const storedBranch = localStorage.getItem("pos_store_branch");
        if (storedBranch) setStoreBranch(storedBranch);

        const storedPhone = localStorage.getItem("pos_store_phone");
        if (storedPhone) setStorePhone(storedPhone);

        const storedVat = localStorage.getItem("pos_vat_rate");
        if (storedVat !== null) setVatRate(Number(storedVat));

        const storedQrAcc = localStorage.getItem("pos_qr_account_no");
        if (storedQrAcc) setQrAccountNo(storedQrAcc);

        const storedQrName = localStorage.getItem("pos_qr_account_name");
        if (storedQrName) setQrAccountName(storedQrName);
      } catch (err) {
        console.warn("Error reading stored settings:", err);
      }
    }
  }, []);

  const handleSaveAll = () => {
    triggerHapticFeedback(50);
    try {
      localStorage.setItem("pos_store_name", storeName);
      localStorage.setItem("pos_store_branch", storeBranch);
      localStorage.setItem("pos_store_phone", storePhone);
      localStorage.setItem("pos_vat_rate", String(vatRate));
      localStorage.setItem("pos_qr_account_no", qrAccountNo);
      localStorage.setItem("pos_qr_account_name", qrAccountName);
    } catch {}

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    toast.success("ບັນທຶກການຕັ້ງຄ່າສຳເລັດແລ້ວ");
  };

  const getPrinterSummary = () => {
    const typeLabel =
      printerSettings.connectionType === "lan"
        ? `LAN (${printerSettings.lanIp})`
        : printerSettings.connectionType === "bluetooth"
        ? `Bluetooth (${printerSettings.bluetoothName || "ຍັງບໍ່ໄດ້ເລືອກ"})`
        : printerSettings.connectionType === "serial"
        ? `COM (${printerSettings.serialLabel || "Serial"})`
        : printerSettings.connectionType === "browser"
        ? "Windows Driver / Browser"
        : `USB (${printerSettings.windowsPrinterName || printerSettings.webUsbName || "ຄ່າເລີ່ມຕົ້ນ"})`;

    return `${typeLabel} • ເຈ້ຍ ${printerSettings.paperWidth} • ${
      printerSettings.autoOpenDrawer ? "ໄຂລິ້ນຊັກອັດຕະໂນມັດ" : "ປິດການໄຂລິ້ນຊັກ"
    }`;
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              ຕັ້ງຄ່າລະບົບ (Settings)
            </h1>
            <p className="text-xs text-slate-500">
              ຂໍ້ມູນຮ້ານຄ້າ, ອາກອນ VAT, ບັນຊີ QR ແລະ ເຄື່ອງພິມບິນ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          {isSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{isSaved ? "ບັນທຶກແລ້ວ!" : "ບັນທຶກການຕັ້ງຄ່າ"}</span>
        </button>
      </div>

      {/* Main Essential Settings: Store Profile & VAT/QR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Store Profile Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">ຂໍ້ມູນຮ້ານຄ້າ (Store Profile)</h3>
              <p className="text-[11px] text-slate-500">ສະແດງເທິງຫົວໃບບິນຂາຍ</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ຊື່ຮ້ານ
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ສາຂາ & ທີ່ຕັ້ງ
              </label>
              <input
                type="text"
                value={storeBranch}
                onChange={(e) => setStoreBranch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ເບີໂທລະສັບຕິດຕໍ່
              </label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
          </div>
        </div>

        {/* VAT & Lao QR Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                ອາກອນ VAT & ບັນຊີ QR Code
              </h3>
              <p className="text-[11px] text-slate-500">ອັດຕາອາກອນ ແລະ ບັນຊີ BCEL OnePay / LAPNet</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                ອັດຕາອາກອນ (VAT Rate)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rate: 0, label: "0% (ຍົກເວັ້ນ)" },
                  { rate: 7, label: "7%" },
                  { rate: 10, label: "10%" },
                ].map((item) => (
                  <button
                    key={item.rate}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(20);
                      setVatRate(item.rate);
                    }}
                    className={`h-10 rounded-xl border font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                      vatRate === item.rate
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                        : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ເລກບັນຊີຮັບເງິນ QR
              </label>
              <input
                type="text"
                value={qrAccountNo}
                onChange={(e) => setQrAccountNo(e.target.value)}
                placeholder="010-12-00-01234567-001"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                ຊື່ເຈົ້າຂອງບັນຊີ
              </label>
              <input
                type="text"
                value={qrAccountName}
                onChange={(e) => setQrAccountName(e.target.value)}
                placeholder="QUICKONE POS"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold uppercase text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compact Printer & Cash Drawer Summary Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Printer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              ເຄື່ອງພິມໃບບິນ & ລິ້ນຊັກເງິນ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{getPrinterSummary()}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPrinterModalOpen(true)}
          className="h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Sliders className="h-3.5 w-3.5 text-emerald-600" />
          <span>ຕັ້ງຄ່າເຄື່ອງພິມ</span>
        </button>
      </div>

      <PrinterSettingsModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        onSaved={(updated) => setPrinterSettings(updated)}
      />
    </div>
  );
}
