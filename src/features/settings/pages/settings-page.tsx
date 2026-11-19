"use client";

// ============================================================================
// Settings & Staff Management Page (ຕັ້ງຄ່າ & ພະນັກງານ)
// Optimized 100% for Touchscreen (Touch-First UI) & Real Hardware Control
// ESC/POS Thermal Printers, RJ11 Cash Drawers, VAT, BCEL OnePay & Staff PIN
// Zero Emojis - Lucide Icons Exclusively
// ============================================================================

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  Printer,
  Users,
  Shield,
  Save,
  Wifi,
  Bluetooth,
  Usb,
  DollarSign,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Settings,
  Send,
  Lock,
  X,
  CreditCard,
  Building,
  Phone,
  Receipt,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { DEFAULT_STORE } from "@/features/pos/constants/pos.constants";
import {
  HardwareService,
  PrinterSettings,
  DEFAULT_PRINTER_SETTINGS,
} from "@/features/pos/services/hardware.service";
import { triggerHapticFeedback } from "@/utils/haptics";

interface StaffAccount {
  id: string;
  name: string;
  username: string;
  role: "owner" | "store_manager" | "cashier";
  roleLabelLo: string;
  pin: string;
  isActive: boolean;
}

const DEFAULT_STAFF: StaffAccount[] = [
  {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01",
    name: "ຜູ້ຈັດການໃຫຍ່ (Admin)",
    username: "admin@laochaleun.la",
    role: "owner",
    roleLabelLo: "ເຈົ້າຂອງຮ້ານ / Admin",
    pin: "123456",
    isActive: true,
  },
  {
    id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33",
    name: "ສົມພອນ (Somphone)",
    username: "manager@laochaleun.la",
    role: "store_manager",
    roleLabelLo: "ຜູ້ຈັດການຮ້ານ (Manager)",
    pin: "123456",
    isActive: true,
  },
  {
    id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
    name: "ສຸລິວັນ (Sourivanh)",
    username: "cashier@laochaleun.la",
    role: "cashier",
    roleLabelLo: "ພະນັກງານຂາຍ (Cashier)",
    pin: "123456",
    isActive: true,
  },
];

const PRESET_IPS = ["192.168.1.200", "192.168.0.200", "192.168.1.100"];

export function SettingsPage() {
  // --- Hardware state ---
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [testingPrint, setTestingPrint] = useState(false);
  const [testingDrawer, setTestingDrawer] = useState(false);
  const [scanningDevices, setScanningDevices] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Array<{ name: string; address: string }>>([]);

  // --- Store profile state ---
  const [storeName, setStoreName] = useState(DEFAULT_STORE.name_lo);
  const [storeBranch, setStoreBranch] = useState(DEFAULT_STORE.branch);
  const [storePhone, setStorePhone] = useState(DEFAULT_STORE.phone);

  // --- VAT & Lao QR state ---
  const [vatRate, setVatRate] = useState<number>(7);
  const [qrAccountNo, setQrAccountNo] = useState("010-12-00-01234567-001");
  const [qrAccountName, setQrAccountName] = useState("QUICKONE POS");
  const [qrBankName, setQrBankName] = useState("BCEL OnePay / LAPNet");

  // --- Staff & PIN state ---
  const [staffList, setStaffList] = useState<StaffAccount[]>(DEFAULT_STAFF);
  const [editingStaffPin, setEditingStaffPin] = useState<StaffAccount | null>(null);
  const [newPinValue, setNewPinValue] = useState("");

  // --- Status Toast feedback ---
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Load initial settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hw = HardwareService.getSettings();
      setPrinterSettings(hw);

      // Load custom VAT & QR from localStorage if saved
      try {
        const storedVat = localStorage.getItem("pos_vat_rate");
        if (storedVat !== null) setVatRate(Number(storedVat));

        const storedQrAcc = localStorage.getItem("pos_qr_account_no");
        if (storedQrAcc) setQrAccountNo(storedQrAcc);

        const storedQrName = localStorage.getItem("pos_qr_account_name");
        if (storedQrName) setQrAccountName(storedQrName);

        const storedStaff = localStorage.getItem("pos_staff_accounts");
        if (storedStaff) setStaffList(JSON.parse(storedStaff));
      } catch (err) {
        console.warn("Error reading stored settings:", err);
      }
    }
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSaveAll = () => {
    triggerHapticFeedback(50);
    HardwareService.saveSettings(printerSettings);

    try {
      localStorage.setItem("pos_vat_rate", String(vatRate));
      localStorage.setItem("pos_qr_account_no", qrAccountNo);
      localStorage.setItem("pos_qr_account_name", qrAccountName);
      localStorage.setItem("pos_staff_accounts", JSON.stringify(staffList));
    } catch {}

    setIsSaved(true);
    showToast("ບັນທຶກການຕັ້ງຄ່າທັງໝົດສຳເລັດຮຽບຮ້ອຍ", "success");
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Test Thermal Receipt Print
  const handleTestPrint = async () => {
    triggerHapticFeedback(50);
    setTestingPrint(true);
    try {
      const res = await HardwareService.testPrint();
      if (res.success) {
        showToast(res.message || "ພິມບິນທົດສອບສຳເລັດ", "success");
      } else {
        showToast(res.message || "ບໍ່ສາມາດພິມບິນທົດສອບໄດ້", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "ເກີດຂໍ້ຜິດພາດໃນການພິມບິນ", "error");
    } finally {
      setTestingPrint(false);
    }
  };

  // Test Open Cash Drawer
  const handleTestCashDrawer = async () => {
    triggerHapticFeedback(60);
    setTestingDrawer(true);
    try {
      const res = await HardwareService.openCashDrawer(printerSettings.drawerPin || 2);
      if (res.success) {
        showToast(res.message || "ສົ່ງສັນຍານໄຂລິ້ນຊັກເງິນສຳເລັດ", "success");
      } else {
        showToast(res.message || "ບໍ່ສາມາດໄຂລິ້ນຊັກເງິນໄດ້", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "ເກີດຂໍ້ຜິດພາດໃນການໄຂລິ້ນຊັກເງິນ", "error");
    } finally {
      setTestingDrawer(false);
    }
  };

  // Scan Bluetooth Devices
  const handleScanDevices = async () => {
    triggerHapticFeedback(40);
    setScanningDevices(true);
    try {
      const devices = await HardwareService.getBondedBluetoothDevices();
      setDiscoveredDevices(devices);
      if (devices.length > 0) {
        showToast(`ພົບອຸປະກອນ ${devices.length} ລາຍການ`, "success");
      } else {
        showToast("ບໍ່ພົບອຸປະກອນ Bluetooth ທີ່ຈັບຄູ່ໄວ້ (ກະລຸນາຈັບຄູ່ໃນ Android Settings)", "error");
      }
    } catch {
      showToast("ບໍ່ສາມາດຄົ້ນຫາອຸປະກອນໄດ້", "error");
    } finally {
      setScanningDevices(false);
    }
  };

  // Handle Staff PIN Change
  const handleSavePin = () => {
    if (!editingStaffPin) return;
    if (newPinValue.length !== 6 || !/^\d{6}$/.test(newPinValue)) {
      showToast("ລະຫັດ PIN ຕ້ອງເປັນຕົວເລກ 6 ຫຼັກເທົ່ານັ້ນ", "error");
      return;
    }

    const updated = staffList.map((s) =>
      s.id === editingStaffPin.id ? { ...s, pin: newPinValue } : s
    );
    setStaffList(updated);
    try {
      localStorage.setItem("pos_staff_accounts", JSON.stringify(updated));
    } catch {}

    showToast(`ປ່ຽນລະຫັດ PIN ຂອງ ${editingStaffPin.name} ສຳເລັດ`, "success");
    setEditingStaffPin(null);
    setNewPinValue("");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 select-none touch-manipulation">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-bold transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-rose-600 text-white border-rose-500"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              ຕັ້ງຄ່າລະບົບ (System Settings)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ກຳນົດຄ່າເຄື່ອງພິມຄວາມຮ້ອນ, ລິ້ນຊັກເງິນ, ອັດຕາອາກອນ (VAT) ແລະ ບັນຊີ LAO QR
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className={`min-h-[48px] h-12 px-6 rounded-xl font-bold text-sm text-white shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
            isSaved ? "bg-emerald-700" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {isSaved ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />}
          <span>{isSaved ? "ບັນທຶກແລ້ວ" : "ບັນທຶກການຕັ້ງຄ່າ"}</span>
        </button>
      </div>

      {/* SECTION 1: Hardware Setup (Printers & Cash Drawer) */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                ເຄື່ອງພິມໃບບິນ & ລິ້ນຊັກເງິນ (Thermal Printer & Cash Drawer)
              </h3>
              <p className="text-xs text-slate-500">ຮອງຮັບເຄື່ອງພິມ ESC/POS ຂະໜາດ 80mm / 58mm ແລະ ສາຍ RJ11</p>
            </div>
          </div>
        </div>

        {/* 1.1 Connection Type Selection (3 Large Cards >= 56px) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            ຮູບແບບການເຊື່ອມຕໍ່ (Connection Type)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* LAN / Wi-Fi Card */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                setPrinterSettings({ ...printerSettings, connectionType: "lan" });
              }}
              className={`min-h-[56px] p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition-all active:scale-95 cursor-pointer ${
                printerSettings.connectionType === "lan"
                  ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs"
                  : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  printerSettings.connectionType === "lan"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold leading-tight">LAN / Wi-Fi</p>
                <p className="text-xs text-slate-500">ຜ່ານເຄືອຂ່າຍ IP / Port</p>
              </div>
            </button>

            {/* Bluetooth Card */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                setPrinterSettings({ ...printerSettings, connectionType: "bluetooth" });
              }}
              className={`min-h-[56px] p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition-all active:scale-95 cursor-pointer ${
                printerSettings.connectionType === "bluetooth"
                  ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs"
                  : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  printerSettings.connectionType === "bluetooth"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <Bluetooth className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold leading-tight">Bluetooth</p>
                <p className="text-xs text-slate-500">ເຊື່ອມຕໍ່ໄຮ້ສາຍ Bluetooth</p>
              </div>
            </button>

            {/* USB OTG Card */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                setPrinterSettings({ ...printerSettings, connectionType: "usb" });
              }}
              className={`min-h-[56px] p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition-all active:scale-95 cursor-pointer ${
                printerSettings.connectionType === "usb"
                  ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs"
                  : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                  printerSettings.connectionType === "usb"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <Usb className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold leading-tight">USB OTG</p>
                <p className="text-xs text-slate-500">ສຽບສາຍກົງ USB / OTG</p>
              </div>
            </button>
          </div>
        </div>

        {/* 1.2 Dynamic Parameters based on Connection Type */}
        {printerSettings.connectionType === "lan" && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ທີ່ຢູ່ IP ເຄື່ອງພິມ (Printer IP Address)
                </label>
                <input
                  type="text"
                  value={printerSettings.lanIp}
                  onChange={(e) => setPrinterSettings({ ...printerSettings, lanIp: e.target.value })}
                  placeholder="192.168.1.200"
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ພອດ (Port - ມາດຕະຖານ 9100)
                </label>
                <input
                  type="number"
                  value={printerSettings.lanPort}
                  onChange={(e) =>
                    setPrinterSettings({ ...printerSettings, lanPort: parseInt(e.target.value) || 9100 })
                  }
                  placeholder="9100"
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-mono font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Quick IP Presets */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1.5">ເລືອກ IP ດ່ວນ:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_IPS.map((ip) => (
                  <button
                    key={ip}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(20);
                      setPrinterSettings({ ...printerSettings, lanIp: ip });
                    }}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer ${
                      printerSettings.lanIp === ip
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(printerSettings.connectionType === "bluetooth" || printerSettings.connectionType === "usb") && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">
                  {printerSettings.connectionType === "bluetooth"
                    ? "ອຸປະກອນ Bluetooth ທີ່ຈັບຄູ່ແລ້ວ"
                    : "ອຸປະກອນ USB ທີ່ເຊື່ອມຕໍ່"}
                </p>
                <p className="text-xs text-slate-500">ກົດປຸ່ມຄົ້ນຫາເພື່ອອ່ານລາຍຊື່ອຸປະກອນຈາກລະບົບ</p>
              </div>

              <button
                type="button"
                onClick={handleScanDevices}
                disabled={scanningDevices}
                className="min-h-[44px] h-11 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-2xs active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${scanningDevices ? "animate-spin text-emerald-600" : ""}`} />
                <span>{scanningDevices ? "ກຳລັງຄົ້ນຫາ..." : "ຄົ້ນຫາອຸປະກອນ (Scan)"}</span>
              </button>
            </div>

            {discoveredDevices.length > 0 ? (
              <div className="space-y-2">
                {discoveredDevices.map((dev) => {
                  const isSelected = printerSettings.bluetoothMac === dev.address;
                  return (
                    <div
                      key={dev.address}
                      onClick={() => {
                        triggerHapticFeedback(30);
                        setPrinterSettings({
                          ...printerSettings,
                          bluetoothMac: dev.address,
                          bluetoothName: dev.name,
                        });
                      }}
                      className={`min-h-[48px] p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/60"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bluetooth className={`h-5 w-5 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{dev.name || "Bluetooth Printer"}</p>
                          <p className="text-[11px] font-mono text-slate-500">{dev.address}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isSelected ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isSelected ? "ເຊື່ອມຕໍ່ແລ້ວ (Connected)" : "ເລືອກອຸປະກອນນີ້"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center rounded-lg bg-white border border-dashed border-slate-200 text-xs text-slate-500">
                ຍັງບໍ່ໄດ້ເຊື່ອມຕໍ່ອຸປະກອນ Bluetooth/USB. ກົດ &ldquo;ຄົ້ນຫາອຸປະກອນ (Scan)&rdquo; ເພື່ອກວດສອບ.
              </div>
            )}
          </div>
        )}

        {/* 1.3 Paper Width & Print Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Paper Width Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ຂະໜາດເຈ້ຍໃບບິນ (Paper Width)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setPrinterSettings({ ...printerSettings, paperWidth: "80mm" });
                }}
                className={`min-h-[48px] h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                  printerSettings.paperWidth === "80mm"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black"
                    : "border-slate-200 bg-slate-50/50 text-slate-700"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>80mm (ມາດຕະຖານ)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setPrinterSettings({ ...printerSettings, paperWidth: "58mm" });
                }}
                className={`min-h-[48px] h-12 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                  printerSettings.paperWidth === "58mm"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black"
                    : "border-slate-200 bg-slate-50/50 text-slate-700"
                }`}
              >
                <Receipt className="h-4 w-4 text-emerald-600" />
                <span>58mm (ຂະໜາດນ້ອຍ)</span>
              </button>
            </div>
          </div>

          {/* Print Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ຮູບແບບການພິມໃບບິນ (Print Mode)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["auto", "ask", "manual"] as const).map((mode) => {
                const isSelected = (printerSettings.printMode || "auto") === mode;
                const labels: Record<string, string> = {
                  auto: "ພິມທັນທີ",
                  ask: "ຖາມກ່ອນ",
                  manual: "ດ້ວຍຕົນເອງ",
                };
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(20);
                      setPrinterSettings({ ...printerSettings, printMode: mode });
                    }}
                    className={`min-h-[48px] h-12 rounded-xl border-2 flex items-center justify-center font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black"
                        : "border-slate-200 bg-slate-50/50 text-slate-700"
                    }`}
                  >
                    <span>{labels[mode]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1.4 Cash Drawer RJ11 Configuration */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">
                ໄຂລິ້ນຊັກເງິນອັດຕະໂນມັດເມື່ອຊຳລະເງິນສົດ (Auto kick on cash)
              </p>
              <p className="text-xs text-slate-500">
                ສົ່ງສັນຍານ xung ESC/POS ຜ່ານສາຍ RJ11 ເມື່ອບັນທຶກຮັບເງິນສົດ
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                setPrinterSettings({
                  ...printerSettings,
                  autoOpenDrawer: !printerSettings.autoOpenDrawer,
                });
              }}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${
                printerSettings.autoOpenDrawer ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                  printerSettings.autoOpenDrawer ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-700">ຊ່ອງສັນຍານ RJ11 Pin (Drawer Pin):</label>
              <p className="text-[11px] text-slate-500">ເລືອກ Pin 2 ສຳລັບເຄື່ອງພິມທົ່ວໄປ (0x00) ຫຼື Pin 5 (0x01)</p>
            </div>

            <div className="flex gap-2">
              {[2, 5].map((pin) => (
                <button
                  key={pin}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(20);
                    setPrinterSettings({ ...printerSettings, drawerPin: pin as 2 | 5 });
                  }}
                  className={`min-h-[40px] px-4 rounded-lg border font-mono font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                    (printerSettings.drawerPin || 2) === pin
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Pin {pin}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1.5 Direct Hardware Testing Buttons (min-h-[48px]) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Test Receipt Print */}
          <button
            type="button"
            onClick={handleTestPrint}
            disabled={testingPrint}
            className="min-h-[48px] h-12 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            {testingPrint ? (
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
            ) : (
              <Send className="h-4 w-4 text-emerald-700" />
            )}
            <span>{testingPrint ? "ກຳລັງສົ່ງຄຳສັ່ງພິມ..." : "ທົດສອບພິມໃບບິນ (Test Print)"}</span>
          </button>

          {/* Test Cash Drawer Kick */}
          <button
            type="button"
            onClick={handleTestCashDrawer}
            disabled={testingDrawer}
            className="min-h-[48px] h-12 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            {testingDrawer ? (
              <RefreshCw className="h-4 w-4 animate-spin text-amber-700" />
            ) : (
              <CreditCard className="h-4 w-4 text-amber-700" />
            )}
            <span>{testingDrawer ? "ກຳລັງສົ່ງສັນຍານ..." : "ທົດສອບເປີດລິ້ນຊັກເງິນ (Test Open Drawer)"}</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Store Profile, VAT & Lao QR Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Profile Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">ຂໍ້ມູນຮ້ານຄ້າ (Store Profile)</h3>
              <p className="text-xs text-slate-500">ສະແດງເທິງຫົວໃບບິນຂາຍ ແລະ ລະບົບລາຍງານ</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ຊື່ຮ້ານ (ພາສາລາວ)</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 px-3.5 font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ສາຂາ & ທີ່ຕັ້ງ</label>
              <input
                type="text"
                value={storeBranch}
                onChange={(e) => setStoreBranch(e.target.value)}
                className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 px-3.5 font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ເບີໂທລະສັບຕິດຕໍ່</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 px-3.5 font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ສະກຸນເງິນຫຼັກ</label>
                <input
                  type="text"
                  value="ກີບລາວ (LAK ₭)"
                  disabled
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-200 px-3.5 bg-slate-50 font-bold text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* VAT & Lao QR Payment Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                ອາກອນ VAT & BCEL OnePay / LAPNet
              </h3>
              <p className="text-xs text-slate-500">ອັດຕາອາກອນ ແລະ ບັນຊີຮັບເງິນ QR Code</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* VAT Rate Selectable Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                ອັດຕາອາກອນມູນຄ່າເພີ່ມ (VAT Rate)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rate: 0, label: "0% (ຍົກເວັ້ນ)" },
                  { rate: 7, label: "7% (ມາດຕະຖານ 2024)" },
                  { rate: 10, label: "10%" },
                ].map((item) => (
                  <button
                    key={item.rate}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(20);
                      setVatRate(item.rate);
                    }}
                    className={`min-h-[48px] h-12 rounded-xl border-2 font-bold text-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                      vatRate === item.rate
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-2xs"
                        : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BCEL OnePay / LAPNet Config */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ເລກບັນຊີ BCEL OnePay / LAPNet
                </label>
                <input
                  type="text"
                  value={qrAccountNo}
                  onChange={(e) => setQrAccountNo(e.target.value)}
                  placeholder="010-12-00-01234567-001"
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 px-3.5 font-mono font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ຊື່ເຈົ້າຂອງບັນຊີ (Account Name)
                </label>
                <input
                  type="text"
                  value={qrAccountName}
                  onChange={(e) => setQrAccountName(e.target.value)}
                  placeholder="QUICKONE POS"
                  className="min-h-[48px] h-12 w-full rounded-xl border border-slate-300 px-3.5 font-bold uppercase text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Dedicated Staff & Permissions Navigation Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-slate-50 border border-emerald-200/90 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ຈັດການພະນັກງານ & ສິດການໃຊ້ງານ (Staff & Permissions)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ເພີ່ມບັນຊີພະນັກງານ, ກຳນົດສິດ (Owner, Manager, Cashier), ປ່ຽນລະຫັດ PIN 6 ຫຼັກ ແລະ ຈັດການສະຖານະການເຂົ້າໃຊ້ງານ
            </p>
          </div>
        </div>
        <Link
          href="/staff"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          <span>ເປີດໜ້າຈັດການພະນັກງານ</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
