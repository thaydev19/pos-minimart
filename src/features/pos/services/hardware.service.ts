// ============================================================================
// POS Hardware Service: Thermal Receipt Printers (LAN/BT/USB) & Cash Drawers
// Cross-Platform: Android Capacitor Native + Windows Tauri + Web
// ============================================================================

import { registerPlugin } from "@capacitor/core";
import { ThermalPrinterAdapter, ReceiptData } from "@/utils/printer.adapter";
import { triggerHapticFeedback } from "@/utils/haptics";
import { WebPrinterService } from "./webPrinter.service";

export interface PrinterSettings {
  connectionType: "lan" | "bluetooth" | "usb" | "serial" | "browser";
  lanIp: string;
  lanPort: number;
  bluetoothMac?: string;
  bluetoothName?: string;
  windowsPrinterName?: string;
  webUsbVendorId?: number;
  webUsbProductId?: number;
  webUsbName?: string;
  serialBaudRate?: number;
  serialLabel?: string;
  paperWidth: "58mm" | "80mm";
  autoOpenDrawer: boolean;
  autoPrintReceipt: boolean;
  printMode?: "auto" | "ask" | "manual";
  drawerPin?: 2 | 5;
}

const STORAGE_KEY = "pos_hardware_printer_config";

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  connectionType: "usb",
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

  private static isTauriRuntime(): boolean {
    if (typeof window === "undefined") return false;
    const w = window as any;
    return Boolean(w.__TAURI__ || w.__TAURI_INTERNALS__ || w.__TAURI_METADATA__);
  }

  private static async invokeTauri<T = unknown>(
    cmd: string,
    args?: Record<string, unknown>
  ): Promise<T> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke<T>(cmd, args);
    } catch (importErr) {
      const w = window as any;
      const globalInvoke = w.__TAURI__?.core?.invoke || w.__TAURI__?.invoke;
      if (typeof globalInvoke === "function") {
        return await globalInvoke(cmd, args);
      }
      throw importErr;
    }
  }

  /**
   * Lists installed Windows printers (only on Windows Tauri desktop)
   */
  public static async getWindowsPrinters(): Promise<
    Array<{ name: string; isDefault: boolean }>
  > {
    if (!this.isTauriRuntime()) return [];
    try {
      const printers = await this.invokeTauri<
        Array<{ name: string; isDefault: boolean }>
      >("list_windows_printers");
      return Array.isArray(printers) ? printers : [];
    } catch (err) {
      console.warn("[HardwareService] Error listing Windows printers:", err);
      return [];
    }
  }

  /**
   * Picks the best Windows thermal printer from installed spooler list (e.g. Deli 581PW)
   */
  public static findPreferredWindowsPrinter(
    printers: Array<{ name: string; isDefault: boolean }>
  ): { name: string; isDefault: boolean } | null {
    if (!printers.length) return null;

    const priorityPatterns = [
      /581\s*pw/i,
      /deli/i,
      /pos[\s-_]*58/i,
      /xp[\s-_]*58/i,
      /58\s*mm/i,
      /pos[\s-_]*80/i,
      /xp[\s-_]*80/i,
      /xprinter/i,
      /thermal/i,
      /receipt/i,
      /rongta/i,
      /epson.*tm/i,
    ];

    for (const pattern of priorityPatterns) {
      const match = printers.find((p) => pattern.test(p.name));
      if (match) return match;
    }

    return printers.find((p) => p.isDefault) || printers[0];
  }

  /**
   * Infers 58mm or 80mm paper width from printer model name when unambiguous
   */
  public static inferPaperWidthFromPrinterName(
    printerName?: string
  ): "58mm" | "80mm" | null {
    if (!printerName) return null;
    if (/581\s*pw|pos[\s-_]*58|xp[\s-_]*58|58\s*mm|\b58\b/i.test(printerName)) {
      return "58mm";
    }
    if (/pos[\s-_]*80|xp[\s-_]*80|80\s*mm|\b80\b/i.test(printerName)) {
      return "80mm";
    }
    return null;
  }

  /**
   * Ensures Tauri runtime resolves a preferred USB Windows printer (such as 581PW)
   * even before opening the Settings page.
   */
  private static async resolveTauriPrinterSettings(
    settings: PrinterSettings
  ): Promise<PrinterSettings> {
    if (
      !this.isTauriRuntime() ||
      settings.connectionType !== "usb" ||
      settings.windowsPrinterName
    ) {
      return settings;
    }

    const printers = await this.getWindowsPrinters();
    const preferred = this.findPreferredWindowsPrinter(printers);
    if (!preferred) return settings;

    const inferredWidth = this.inferPaperWidthFromPrinterName(preferred.name);
    const updated: PrinterSettings = {
      ...settings,
      windowsPrinterName: preferred.name,
      ...(inferredWidth ? { paperWidth: inferredWidth } : {}),
    };
    this.saveSettings(updated);
    return updated;
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

    // 2. Windows Tauri Desktop Driver (LAN Socket 9100 or Windows USB Spooler)
    if (this.isTauriRuntime()) {
      try {
        const resolved = await this.resolveTauriPrinterSettings(settings);
        const kickBytes = [0x1b, 0x70, effectivePin === 5 ? 0x01 : 0x00, 0x19, 0xfa];
        await this.invokeTauri("print_raw_escpos", {
          data: kickBytes,
          connectionType: resolved.connectionType,
          ip: resolved.lanIp,
          port: resolved.lanPort,
          printerName: resolved.windowsPrinterName || "",
        });
        return { success: true, message: "ໄຂລິ້ນຊັກເງິນສຳເລັດ (Windows)" };
      } catch (err: any) {
        console.warn("[HardwareService] Tauri open drawer error:", err);
        const detail = typeof err === "string" ? err : err?.message || "Unknown error";
        return { success: false, message: `ເປີດລິ້ນຊັກບໍ່ສຳເລັດ: ${detail}` };
      }
    }

    // 3. Web Browser (WebUSB / Web Serial / Driver Print)
    const kickBytes = new Uint8Array([
      0x1b,
      0x70,
      effectivePin === 5 ? 0x01 : 0x00,
      0x19,
      0xfa,
    ]);

    if (settings.connectionType === "usb") {
      try {
        await WebPrinterService.sendViaWebUsb(
          kickBytes,
          settings.webUsbVendorId,
          settings.webUsbProductId
        );
        return { success: true, message: "ໄຂລິ້ນຊັກເງິນສຳເລັດ (WebUSB)" };
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || "ບໍ່ສາມາດໄຂລິ້ນຊັກຜ່ານ WebUSB ໄດ້",
        };
      }
    }

    if (settings.connectionType === "serial") {
      try {
        await WebPrinterService.sendViaWebSerial(
          kickBytes,
          settings.serialBaudRate || 9600
        );
        return { success: true, message: "ໄຂລິ້ນຊັກເງິນສຳເລັດ (Serial/COM)" };
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || "ບໍ່ສາມາດໄຂລິ້ນຊັກຜ່ານ Serial/COM ໄດ້",
        };
      }
    }

    if (settings.connectionType === "browser") {
      return {
        success: true,
        message:
          "ໂໝດ Browser Print: ກະລຸນາເປີດ 'Open Cash Drawer on Print' ໃນ Windows Printer Driver (ລິ້ນຊັກຈະໄຂອັດຕະໂນມັດເມື່ອພິມບິນ)",
      };
    }

    return {
      success: false,
      message:
        "ບຣາວເຊີເວັບບໍ່ສາມາດສົ່ງຄຳສັ່ງ LAN 9100 ໂດຍກົງໄດ້ — ກະລຸນາເລືອກ USB (WebUSB), Serial/COM, ຫຼື Browser Print",
    };
  }

  /**
   * Prints receipt using ESC/POS Raster Monochrome Bitmap (100% Crisp Lao / Vietnamese Fonts)
   */
  public static async printReceipt(
    data: ReceiptData,
    options?: { skipDrawerKick?: boolean }
  ): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();

    // Automatically trigger cash drawer kick if enabled (unless caller already triggered it)
    if (
      !options?.skipDrawerKick &&
      settings.autoOpenDrawer &&
      (data.paymentMethod === "cash" || data.paymentMethod === "mixed")
    ) {
      this.openCashDrawer(settings.drawerPin || 2).catch(() => {});
    }

    // 1. Render receipt to HTML5 Canvas (matching configured 58mm / 80mm paper width)
    const canvas = await ThermalPrinterAdapter.renderReceiptToCanvas(
      data,
      settings.paperWidth
    );
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

    // 3. Windows Tauri Desktop Driver (LAN Socket 9100 or Windows USB Spooler)
    if (this.isTauriRuntime()) {
      try {
        const resolved = await this.resolveTauriPrinterSettings(settings);
        await this.invokeTauri("print_raw_escpos", {
          data: Array.from(rasterBytes),
          connectionType: resolved.connectionType,
          ip: resolved.lanIp,
          port: resolved.lanPort,
          printerName: resolved.windowsPrinterName || "",
        });
        return { success: true, message: "ພິມບິນສຳເລັດ (Windows)" };
      } catch (err: any) {
        console.warn("[HardwareService] Tauri printer error:", err);
        const detail = typeof err === "string" ? err : err?.message || "Unknown error";
        return { success: false, message: `ພິມບິນບໍ່ສຳເລັດ: ${detail}` };
      }
    }

    // 4. Web Browser: WebUSB / Web Serial / Hidden-Iframe Browser Print
    if (settings.connectionType === "usb" && WebPrinterService.isWebUsbSupported()) {
      try {
        await WebPrinterService.sendViaWebUsb(
          rasterBytes,
          settings.webUsbVendorId,
          settings.webUsbProductId
        );
        return { success: true, message: "ພິມບິນສຳເລັດ (WebUSB)" };
      } catch (err: any) {
        console.warn("[HardwareService] WebUSB print failed:", err);
        return {
          success: false,
          message: err?.message || "ພິມບິນຜ່ານ WebUSB ບໍ່ສຳເລັດ",
        };
      }
    }

    if (settings.connectionType === "serial" && WebPrinterService.isWebSerialSupported()) {
      try {
        await WebPrinterService.sendViaWebSerial(
          rasterBytes,
          settings.serialBaudRate || 9600
        );
        return { success: true, message: "ພິມບິນສຳເລັດ (Serial/COM)" };
      } catch (err: any) {
        console.warn("[HardwareService] Web Serial print failed:", err);
        return {
          success: false,
          message: err?.message || "ພິມບິນຜ່ານ Serial/COM ບໍ່ສຳເລັດ",
        };
      }
    }

    const fallbackSuccess = await ThermalPrinterAdapter.printReceipt(
      data,
      settings.paperWidth
    );
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
      storeBranch: "ປາກຊອງ, ຈຳປາສັກ",
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
