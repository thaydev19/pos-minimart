"use client";

// ============================================================================
// Printer & Cash Drawer Settings Modal (Simplified Customer-Friendly UX)
// Progressive Disclosure: Primary options upfront, technical options tucked away
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  Printer,
  Wifi,
  Bluetooth,
  Usb,
  X,
  Check,
  Vault,
  RotateCw,
  ChevronDown,
  Globe,
  Cable,
} from "lucide-react";
import {
  HardwareService,
  PrinterSettings,
  DEFAULT_PRINTER_SETTINGS,
} from "../services/hardware.service";
import {
  WebPrinterService,
  WebUsbDeviceInfo,
} from "../services/webPrinter.service";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: PrinterSettings) => void;
}

const PRESET_IPS = ["192.168.1.200", "192.168.0.200", "192.168.1.100"];

export function PrinterSettingsModal({
  isOpen,
  onClose,
  onSaved,
}: PrinterSettingsModalProps) {
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [btDevices, setBtDevices] = useState<Array<{ name: string; address: string }>>([]);
  const [winPrinters, setWinPrinters] = useState<Array<{ name: string; isDefault: boolean }>>([]);
  const [webUsbDevices, setWebUsbDevices] = useState<WebUsbDeviceInfo[]>([]);
  const [hasSerialPort, setHasSerialPort] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [isTestingDrawer, setIsTestingDrawer] = useState(false);

  const isTauriEnv =
    typeof window !== "undefined" &&
    Boolean(
      (window as any).__TAURI__ ||
        (window as any).__TAURI_INTERNALS__ ||
        (window as any).__TAURI_METADATA__
    );
  const isCapacitorEnv =
    typeof window !== "undefined" &&
    Boolean((window as any).Capacitor?.isNativePlatform?.());
  const isBrowserEnv = !isTauriEnv && !isCapacitorEnv;

  useEffect(() => {
    if (isOpen) {
      const current = HardwareService.getSettings();
      setSettings(current);
      setShowAdvanced(
        current.connectionType === "serial" ||
          current.connectionType === "browser" ||
          current.drawerPin === 5
      );
      loadBluetoothDevices();
      loadWindowsPrinters();
      loadWebDevices();
    }
  }, [isOpen]);

  const loadBluetoothDevices = async () => {
    const devices = await HardwareService.getBondedBluetoothDevices();
    setBtDevices(devices);
  };

  const loadWindowsPrinters = async () => {
    const printers = await HardwareService.getWindowsPrinters();
    setWinPrinters(printers);
  };

  const loadWebDevices = async () => {
    const usbDevs = await WebPrinterService.getPairedWebUsbDevices();
    setWebUsbDevices(usbDevs);
    const serialOk = await WebPrinterService.hasPairedSerialPort();
    setHasSerialPort(serialOk);
  };

  const handlePairWebUsb = async () => {
    try {
      const dev = await WebPrinterService.pairWebUsbPrinter();
      setSettings({
        ...settings,
        connectionType: "usb",
        webUsbVendorId: dev.vendorId,
        webUsbProductId: dev.productId,
        webUsbName: dev.name,
      });
      await loadWebDevices();
      toast.success(`ເຊື່ອມຕໍ່ແລ້ວ: ${dev.name}`);
    } catch (err: any) {
      if (err?.name !== "NotFoundError") {
        toast.error(err?.message || "ບໍ່ສາມາດເຊື່ອມຕໍ່ USB ໄດ້");
      }
    }
  };

  const handlePairWebSerial = async () => {
    try {
      const res = await WebPrinterService.pairWebSerialPrinter();
      setSettings({
        ...settings,
        connectionType: "serial",
        serialLabel: res.label,
      });
      setHasSerialPort(true);
      toast.success(`ເຊື່ອມຕໍ່ ${res.label} ສຳເລັດ`);
    } catch (err: any) {
      if (err?.name !== "NotFoundError") {
        toast.error(err?.message || "ບໍ່ສາມາດເຊື່ອມຕໍ່ພອດ COM ໄດ້");
      }
    }
  };

  const handleSave = () => {
    triggerHapticFeedback(40);
    HardwareService.saveSettings(settings);
    toast.success("ບັນທຶກການຕັ້ງຄ່າເຄື່ອງພິມສຳເລັດແລ້ວ");
    onSaved?.(settings);
    onClose();
  };

  const handleTestPrint = async () => {
    setIsTestingPrint(true);
    triggerHapticFeedback(30);
    HardwareService.saveSettings(settings);
    const res = await HardwareService.testPrint();
    setIsTestingPrint(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleTestDrawer = async () => {
    setIsTestingDrawer(true);
    triggerHapticFeedback(40);
    HardwareService.saveSettings(settings);
    const res = await HardwareService.openCashDrawer(settings.drawerPin || 2);
    setIsTestingDrawer(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ຕັ້ງຄ່າເຄື່ອງພິມ & ລິ້ນຊັກເງິນ
              </h2>
              <p className="text-[11px] text-slate-500">
                ເລືອກຮູບແບບການເຊື່ອມຕໍ່ ແລະ ທົດສອບກ່ອນໃຊ້ງານ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 py-3.5">
          {/* 1. Simple 3-Option Connection Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              1. ເລືອກວິທີເຊື່ອມຕໍ່ເຄື່ອງພິມ:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setSettings({ ...settings, connectionType: "usb" });
                }}
                className={`h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer active:scale-95 ${
                  settings.connectionType === "usb"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Usb className="h-4 w-4" />
                <span>ສາຍ USB / ໃນເຄື່ອງ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setSettings({ ...settings, connectionType: "lan" });
                }}
                className={`h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer active:scale-95 ${
                  settings.connectionType === "lan"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Wifi className="h-4 w-4" />
                <span>ສາຍແລນ / Wi-Fi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setSettings({ ...settings, connectionType: "bluetooth" });
                }}
                className={`h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer active:scale-95 ${
                  settings.connectionType === "bluetooth"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Bluetooth className="h-4 w-4" />
                <span>Bluetooth</span>
              </button>
            </div>
          </div>

          {/* 2. Dynamic Setup Box */}
          {settings.connectionType === "usb" && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
              {isBrowserEnv ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      ເລືອກເຄື່ອງພິມ USB:
                    </span>
                    <button
                      type="button"
                      onClick={handlePairWebUsb}
                      className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      + ເຊື່ອມຕໍ່ USB
                    </button>
                  </div>

                  {webUsbDevices.length === 0 ? (
                    <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                      ກົດ &quot;+ ເຊື່ອມຕໍ່ USB&quot; ເພື່ອເລືອກເຄື່ອງພິມຂອງທ່ານ
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {webUsbDevices.map((dev) => {
                        const isSelected =
                          settings.webUsbVendorId === dev.vendorId &&
                          settings.webUsbProductId === dev.productId;
                        return (
                          <button
                            key={`${dev.vendorId}-${dev.productId}`}
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                webUsbVendorId: dev.vendorId,
                                webUsbProductId: dev.productId,
                                webUsbName: dev.name,
                              })
                            }
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span className="text-xs truncate">{dev.name}</span>
                            {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      ເລືອກຊື່ເຄື່ອງພິມ:
                    </span>
                    <button
                      type="button"
                      onClick={loadWindowsPrinters}
                      className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      <RotateCw className="h-3 w-3" />
                      <span>ຣີເຟຣຊ</span>
                    </button>
                  </div>

                  {winPrinters.length === 0 ? (
                    <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                      ສຽບສາຍ USB ເຄື່ອງພິມແລ້ວກົດ &quot;ຣີເຟຣຊ&quot; (ຫຼື ໃຊ້ໃນ Android USB OTG ໄດ້ທັນທີ)
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {winPrinters.map((pr) => {
                        const isSelected =
                          settings.windowsPrinterName === pr.name ||
                          (!settings.windowsPrinterName && pr.isDefault);
                        return (
                          <button
                            key={pr.name}
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                windowsPrinterName: pr.name,
                              })
                            }
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs truncate">{pr.name}</span>
                              {pr.isDefault && (
                                <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                  Default
                                </span>
                              )}
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {settings.connectionType === "lan" && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ທີ່ຢູ່ IP ເຄື່ອງພິມ:
                </label>
                <input
                  type="text"
                  value={settings.lanIp}
                  onChange={(e) => setSettings({ ...settings, lanIp: e.target.value })}
                  placeholder="192.168.1.200"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm font-bold text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_IPS.map((ip) => (
                  <button
                    key={ip}
                    type="button"
                    onClick={() => setSettings({ ...settings, lanIp: ip })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                      settings.lanIp === ip
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {settings.connectionType === "bluetooth" && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  ເລືອກເຄື່ອງພິມ Bluetooth:
                </span>
                <button
                  type="button"
                  onClick={loadBluetoothDevices}
                  className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>ຣີເຟຣຊ</span>
                </button>
              </div>

              {btDevices.length === 0 ? (
                <div className="p-2.5 text-center text-[11px] text-slate-500 bg-white rounded-xl border border-slate-200">
                  ກະລຸນາຈັບຄູ່ Bluetooth ໃນ Settings ຂອງເຄື່ອງກ່ອນແລ້ວກົດ ຣີເຟຣຊ
                </div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {btDevices.map((dev) => (
                    <button
                      key={dev.address}
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          bluetoothMac: dev.address,
                          bluetoothName: dev.name,
                        })
                      }
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.bluetoothMac === dev.address
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs truncate">{dev.name}</span>
                      {settings.bluetoothMac === dev.address && (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Paper Width & Auto Drawer */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, paperWidth: "80mm" })}
              className={`h-10 flex items-center justify-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                settings.paperWidth === "80mm"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              ເຈ້ຍ 80mm (ໃຫຍ່)
            </button>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, paperWidth: "58mm" })}
              className={`h-10 flex items-center justify-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                settings.paperWidth === "58mm"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              ເຈ້ຍ 58mm (ນ້ອຍ)
            </button>
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <span className="text-xs font-bold text-slate-800">
              ໄຂລິ້ນຊັກເງິນອັດຕະໂນມັດເມື່ອຮັບເງິນສົດ
            </span>
            <input
              type="checkbox"
              checked={settings.autoOpenDrawer}
              onChange={(e) =>
                setSettings({ ...settings, autoOpenDrawer: e.target.checked })
              }
              className="h-5 w-5 rounded-md accent-emerald-600 cursor-pointer"
            />
          </label>

          {/* 4. Collapsible Advanced Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
              />
              <span>ຕັ້ງຄ່າຂັ້ນສູງ (Advanced)</span>
            </button>

            {showAdvanced && (
              <div className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
                {/* Drawer Pin */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">
                    ຂາສັນຍານລິ້ນຊັກ (Drawer Pin):
                  </span>
                  <div className="flex items-center gap-1">
                    {([2, 5] as const).map((pin) => (
                      <button
                        key={pin}
                        type="button"
                        onClick={() => setSettings({ ...settings, drawerPin: pin })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          (settings.drawerPin || 2) === pin
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        Pin {pin}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LAN Port */}
                {settings.connectionType === "lan" && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700">
                      LAN Port:
                    </span>
                    <input
                      type="number"
                      value={settings.lanPort}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          lanPort: parseInt(e.target.value, 10) || 9100,
                        })
                      }
                      className="h-8 w-24 rounded-lg border border-slate-200 bg-white px-2 text-right font-mono text-xs font-bold"
                    />
                  </div>
                )}

                {/* Browser Fallback Modes */}
                {isBrowserEnv && (
                  <div className="pt-1 border-t border-slate-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-600">
                      ໂໝດເສີມສຳລັບ Browser:
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={handlePairWebSerial}
                        className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-[11px] font-bold cursor-pointer ${
                          settings.connectionType === "serial"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <Cable className="h-3.5 w-3.5" />
                        <span>
                          {hasSerialPort ? "COM (ເຊື່ອມແລ້ວ)" : "ຕັ້ງຄ່າ COM"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSettings({ ...settings, connectionType: "browser" })
                        }
                        className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-[11px] font-bold cursor-pointer ${
                          settings.connectionType === "browser"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Windows Driver</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Quick Test Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={isTestingPrint}
              onClick={handleTestPrint}
              className="h-11 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 text-emerald-600" />
              <span>{isTestingPrint ? "ກຳລັງທົດສອບ..." : "ທົດສອບພິມ"}</span>
            </button>

            <button
              type="button"
              disabled={isTestingDrawer}
              onClick={handleTestDrawer}
              className="h-11 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <Vault className="h-4 w-4 text-amber-600" />
              <span>{isTestingDrawer ? "ກຳລັງເປີດ..." : "ທົດສອບໄຂລິ້ນຊັກ"}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-11 flex-1 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            ບັນທຶກການຕັ້ງຄ່າ
          </button>
        </div>
      </div>
    </div>
  );
}
