// ============================================================================
// POS Hardware Service: Thermal Receipt Printers (LAN/BT/USB) & Cash Drawers
// Cross-Platform: Android Capacitor Native + Windows Tauri + Web
// ============================================================================

import { registerPlugin } from "@capacitor/core";
import { ThermalPrinterAdapter, ReceiptData } from "@/utils/printer.adapter";
import { triggerHapticFeedback } from "@/utils/haptics";

export interface PrinterSettings {
  connectionType: "lan" | "bluetooth" | "usb" | "browser";
  lanIp: string;
  lanPort: number;
  bluetoothMac?: string;
  bluetoothName?: string;
  paperWidth: "58mm" | "80mm";
  autoOpenDrawer: boolean;
  autoPrintReceipt: boolean;
  printMode?: "auto" | "ask" | "manual";
  drawerPin?: 2 | 5;
}

const STORAGE_KEY = "pos_hardware_printer_config";

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  connectionType: "lan",
  lanIp: "192.168.1.200",
  lanPort: 9100,
  paperWidth: "80mm",
  autoOpenDrawer: true,
  autoPrintReceipt: true,
  printMode: "auto",
  drawerPin: 2,
};

interface PosHardwarePluginContract {
  printRawBytes(options: {
    base64Data: string;
    connectionType: string;
    ip?: string;
    port?: number;
    bluetoothMac?: string;
  }): Promise<{ success: boolean; bytesSent: number }>;

  openCashDrawer(options: {
    connectionType: string;
    ip?: string;
    port?: number;
    bluetoothMac?: string;
    pin?: number;
  }): Promise<{ success: boolean; drawerPin: number }>;

  getBondedBluetoothPrinters(): Promise<{
    devices: Array<{ name: string; address: string; bondState: number }>;
    bluetoothEnabled: boolean;
  }>;

  triggerVibration(options?: { durationMs?: number }): Promise<{ success: boolean }>;
}

const NativePosHardware = registerPlugin<PosHardwarePluginContract>("PosHardware");

export class HardwareService {
  /**
   * Loads current printer & drawer settings from persistent storage
   */
  public static getSettings(): PrinterSettings {
    if (typeof window === "undefined") return DEFAULT_PRINTER_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_PRINTER_SETTINGS;
  }

  /**
   * Saves updated settings to storage
   */
  public static saveSettings(settings: PrinterSettings): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }

  /**
   * Triggers hardware cash drawer pulse (0x1B, 0x70) via printer RJ11 port
   */
  public static async openCashDrawer(pin?: 2 | 5): Promise<{ success: boolean; message: string }> {
    triggerHapticFeedback(50);
    const settings = this.getSettings();
    const effectivePin = pin || settings.drawerPin || 2;

    // 1. Android Capacitor Native Driver
    if (typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.())) {
      try {
        const result = await NativePosHardware.openCashDrawer({
          connectionType: settings.connectionType,
          ip: settings.lanIp,
          port: settings.lanPort,
          bluetoothMac: settings.bluetoothMac,
          pin: effectivePin,
        });
        return {
          success: Boolean(result?.success),
          message: result?.success ? "ໄຂລິ້ນຊັກເງິນສຳເລັດ" : "ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບລິ້ນຊັກເງິນ",
        };
      } catch (err: any) {
        console.warn("[HardwareService] Android open cash drawer error:", err);
        return { success: false, message: err?.message || "Lỗi mở két tiền trên Android" };
      }
    }

    // 2. Windows Tauri Desktop Driver
    if (typeof window !== "undefined" && Boolean((window as any).__TAURI__)) {
      try {
        const { invoke } = (window as any).__TAURI__.core || (window as any).__TAURI__;
        const kickBytes = [0x1b, 0x70, effectivePin === 5 ? 0x01 : 0x00, 0x19, 0xfa];
        await invoke("print_raw_escpos", { data: kickBytes });
        return { success: true, message: "ໄຂລິ້ນຊັກເງິນສຳເລັດ (Windows)" };
      } catch (err: any) {
        console.warn("[HardwareService] Tauri open drawer error:", err);
        return { success: false, message: "Lỗi mở két tiền trên Windows" };
      }
    }

    // 3. Web simulation / fallback
    console.info("[HardwareService] Cash Drawer pulse executed (Web mode)");
    return { success: true, message: "ສົ່ງສັນຍານໄຂລິ້ນຊັກເງິນແລ້ວ" };
  }

  /**
   * Prints receipt using ESC/POS Raster Monochrome Bitmap (100% Crisp Lao / Vietnamese Fonts)
   */
  public static async printReceipt(data: ReceiptData): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();

    // Automatically trigger cash drawer kick if enabled
    if (settings.autoOpenDrawer && data.paymentMethod === "cash") {
      this.openCashDrawer(2).catch(() => {});
    }

    // 1. Render receipt to HTML5 Canvas
    const canvas = await ThermalPrinterAdapter.renderReceiptToCanvas(data);
    const rasterBytes = ThermalPrinterAdapter.convertCanvasToEscPosRaster(canvas);

    // 2. Android Capacitor Native Transmission (LAN / BT / USB)
    if (typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.())) {
      try {
        const base64Data = this.uint8ArrayToBase64(rasterBytes);
        const res = await NativePosHardware.printRawBytes({
          base64Data,
          connectionType: settings.connectionType,
          ip: settings.lanIp,
          port: settings.lanPort,
          bluetoothMac: settings.bluetoothMac,
        });

        return {
          success: Boolean(res?.success),
          message: res?.success ? "ພິມບິນສຳເລັດ" : "ບໍ່ສາມາດພິມບິນໄດ້",
        };
      } catch (err: any) {
        console.warn("[HardwareService] Android native print error:", err);
        return { success: false, message: err?.message || "Lỗi in bill trên Android" };
      }
    }

    // 3. Windows Tauri Desktop Driver
    if (typeof window !== "undefined" && Boolean((window as any).__TAURI__)) {
      try {
        const { invoke } = (window as any).__TAURI__.core || (window as any).__TAURI__;
        await invoke("print_raw_escpos", { data: Array.from(rasterBytes) });
        return { success: true, message: "ພິມບິນສຳເລັດ (Windows)" };
      } catch (err: any) {
        console.warn("[HardwareService] Tauri printer error:", err);
      }
    }

    // 4. Browser Print Fallback
    const fallbackSuccess = await ThermalPrinterAdapter.printReceipt(data);
    return {
      success: fallbackSuccess,
      message: fallbackSuccess ? "ເປີດໜ້າຈໍພິມບິນແລ້ວ" : "ບໍ່ສາມາດເປີດໜ້າຈໍພິມບິນໄດ້",
    };
  }

  /**
   * One-click Test Print for Settings Dialog
   */
  public static async testPrint(): Promise<{ success: boolean; message: string }> {
    const testData: ReceiptData = {
      orderNumber: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      dateTime: new Date().toLocaleString("en-GB"),
      cashierName: "ທົດສອບເຄື່ອງພິມ",
      items: [
        {
          name: "ເບຍລາວ ລາກເກີ້ (Beerlao 330ml)",
          unitName: "ຕຸກ",
          qty: 2,
          unitPrice: 15000,
          totalPrice: 30000,
        },
        {
          name: "ເຂົ້າຈີ່ ປາເຕ້ ພິເສດ",
          unitName: "ອັນ",
          qty: 1,
          unitPrice: 20000,
          totalPrice: 20000,
        },
      ],
      subtotal: 50000,
      discountAmount: 0,
      vatAmount: 0,
      finalTotal: 50000,
      paymentMethod: "cash",
      cashTendered: 100000,
      changeAmount: 50000,
      storeName: "QuickOne",
      storeBranch: "ສາຂາ: ດົງໂດກ, ນະຄອນຫຼວງວຽງຈັນ",
      storeTel: "55257555",
    };

    return this.printReceipt(testData);
  }

  /**
   * Retrieves list of paired Bluetooth devices
   */
  public static async getBondedBluetoothDevices(): Promise<Array<{ name: string; address: string }>> {
    if (typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.())) {
      try {
        const res = await NativePosHardware.getBondedBluetoothPrinters();
        return res?.devices || [];
      } catch (err) {
        console.warn("[HardwareService] Error listing Bluetooth devices:", err);
      }
    }
    return [];
  }

  private static uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
