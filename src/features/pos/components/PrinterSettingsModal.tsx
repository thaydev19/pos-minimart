"use client";

// ============================================================================
// Printer & Cash Drawer Settings Modal
// Configure LAN IP (Socket 9100), Bluetooth SPP, USB OTG, Paper Width & Kick Test
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
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  HardwareService,
  PrinterSettings,
  DEFAULT_PRINTER_SETTINGS,
} from "../services/hardware.service";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrinterSettingsModal({ isOpen, onClose }: PrinterSettingsModalProps) {
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [btDevices, setBtDevices] = useState<Array<{ name: string; address: string }>>([]);
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [isTestingDrawer, setIsTestingDrawer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(HardwareService.getSettings());
      loadBluetoothDevices();
    }
  }, [isOpen]);

  const loadBluetoothDevices = async () => {
    const devices = await HardwareService.getBondedBluetoothDevices();
    setBtDevices(devices);
  };

  const handleSave = () => {
    triggerHapticFeedback(40);
    HardwareService.saveSettings(settings);
    toast.success("ບັນທຶກການຕັ້ງຄ່າເຄື່ອງພິມສຳເລັດແລ້ວ");
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
    const res = await HardwareService.openCashDrawer(2);
    setIsTestingDrawer(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ຕັ້ງຄ່າເຄື່ອງພິມ & ລິ້ນຊັກເງິນ
              </h2>
              <p className="text-[11px] text-slate-500">
                ESC/POS Thermal Receipt & Cash Drawer
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

        <div className="space-y-4 py-3">
          {/* Connection Type Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              ຮູບແບບການເຊື່ອມຕໍ່ (Connection Type):
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setSettings({ ...settings, connectionType: "lan" });
                }}
                className={`h-12 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                  settings.connectionType === "lan"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Wifi className="h-4 w-4" />
                <span>LAN / Wi-Fi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setSettings({ ...settings, connectionType: "bluetooth" });
                }}
                className={`h-12 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                  settings.connectionType === "bluetooth"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Bluetooth className="h-4 w-4" />
                <span>Bluetooth</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setSettings({ ...settings, connectionType: "usb" });
                }}
                className={`h-12 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                  settings.connectionType === "usb"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Usb className="h-4 w-4" />
                <span>USB OTG</span>
              </button>
            </div>
          </div>

          {/* LAN Config Fields */}
          {settings.connectionType === "lan" && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ທີ່ຢູ່ IP ເຄື່ອງພິມ (Printer IP Address):
                </label>
                <input
                  type="text"
                  value={settings.lanIp}
                  onChange={(e) => setSettings({ ...settings, lanIp: e.target.value })}
                  placeholder="192.168.1.200"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm font-bold text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ພອດເຊື່ອມຕໍ່ (Raw Socket Port):
                </label>
                <input
                  type="number"
                  value={settings.lanPort}
                  onChange={(e) =>
                    setSettings({ ...settings, lanPort: parseInt(e.target.value, 10) || 9100 })
                  }
                  placeholder="9100"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm font-bold text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Bluetooth Device Selection */}
          {settings.connectionType === "bluetooth" && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  ເລືອກເຄື່ອງພິມ Bluetooth ທີ່ຈັບຄູ່ແລ້ວ:
                </label>
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
                <div className="p-3 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                  ຍັງບໍ່ພົບອຸປະກອນ Bluetooth. ກະລຸນາຈັບຄູ່ເຄື່ອງພິມໃນ Setting Bluetooth ຂອງ Android ກ່ອນ.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
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
                      <div>
                        <div className="text-xs">{dev.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {dev.address}
                        </div>
                      </div>
                      {settings.bluetoothMac === dev.address && (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paper Width Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              ຂະໜາດເຈ້ຍພິມ (Paper Width):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, paperWidth: "80mm" })}
                className={`h-11 flex items-center justify-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  settings.paperWidth === "80mm"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                80mm (ມາດຕະຖານ 3 ນິ້ວ)
              </button>

              <button
                type="button"
                onClick={() => setSettings({ ...settings, paperWidth: "58mm" })}
                className={`h-11 flex items-center justify-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  settings.paperWidth === "58mm"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                58mm (ຂະໜາດນ້ອຍ 2 ນິ້ວ)
              </button>
            </div>
          </div>

          {/* Auto Toggles */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <span className="text-xs font-bold text-slate-800">
                ໄຂລິ້ນຊັກເງິນອັດຕະໂນມັດເມື່ອຊຳລະເງິນສົດ (Auto Open Drawer)
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
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={isTestingPrint}
              onClick={handleTestPrint}
              className="h-12 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 text-emerald-600" />
              <span>{isTestingPrint ? "ກຳລັງທົດສອບ..." : "ທົດສອບພິມບິນ"}</span>
            </button>

            <button
              type="button"
              disabled={isTestingDrawer}
              onClick={handleTestDrawer}
              className="h-12 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <Vault className="h-4 w-4 text-amber-600" />
              <span>{isTestingDrawer ? "ກຳລັງເປີດ..." : "ທົດສອບໄຂລິ້ນຊັກ"}</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-12 flex-1 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            ບັນທຶກການຕັ້ງຄ່າ (Save Settings)
          </button>
        </div>
      </div>
    </div>
  );
}
