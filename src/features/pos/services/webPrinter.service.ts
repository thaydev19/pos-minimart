// ============================================================================
// WebPrinterService: Direct ESC/POS Printing & Cash Drawer Kick in Chrome/Edge
// Supports WebUSB (navigator.usb) & Web Serial / COM Port (navigator.serial)
// Requires HTTPS or localhost (Standard Browser Security Context)
// ============================================================================

export interface WebUsbDeviceInfo {
  vendorId: number;
  productId: number;
  name: string;
}

export class WebPrinterService {
  public static isWebUsbSupported(): boolean {
    return typeof navigator !== "undefined" && Boolean((navigator as any).usb);
  }

  public static isWebSerialSupported(): boolean {
    return typeof navigator !== "undefined" && Boolean((navigator as any).serial);
  }

  /**
   * Prompts user to select and authorize a USB thermal printer via WebUSB
   */
  public static async pairWebUsbPrinter(): Promise<WebUsbDeviceInfo> {
    if (!this.isWebUsbSupported()) {
      throw new Error(
        "ບຣາວເຊີນີ້ບໍ່ຮອງຮັບ WebUSB (ກະລຸນາໃຊ້ Chrome ຫຼື Edge ຜ່ານ HTTPS/localhost)"
      );
    }

    const usb = (navigator as any).usb;
    // Request device (empty filters lets user see all USB printers/devices)
    const device = await usb.requestDevice({ filters: [] });
    return {
      vendorId: device.vendorId,
      productId: device.productId,
      name:
        device.productName ||
        device.manufacturerName ||
        `USB Printer (${device.vendorId.toString(16)}:${device.productId.toString(16)})`,
    };
  }

  /**
   * Lists previously authorized WebUSB devices
   */
  public static async getPairedWebUsbDevices(): Promise<WebUsbDeviceInfo[]> {
    if (!this.isWebUsbSupported()) return [];
    try {
      const devices: any[] = await (navigator as any).usb.getDevices();
      return devices.map((d) => ({
        vendorId: d.vendorId,
        productId: d.productId,
        name:
          d.productName ||
          d.manufacturerName ||
          `USB Printer (${d.vendorId.toString(16)}:${d.productId.toString(16)})`,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Sends raw ESC/POS bytes directly to a paired WebUSB printer
   */
  public static async sendViaWebUsb(
    bytes: Uint8Array,
    vendorId?: number,
    productId?: number
  ): Promise<void> {
    if (!this.isWebUsbSupported()) {
      throw new Error("WebUSB is not supported in this browser");
    }

    const usb = (navigator as any).usb;
    const devices: any[] = await usb.getDevices();
    if (!devices || devices.length === 0) {
      throw new Error(
        "ຍັງບໍ່ໄດ້ເຊື່ອມຕໍ່ເຄື່ອງພິມ WebUSB. ກະລຸນາກົດປຸ່ມ 'ເລືອກເຄື່ອງພິມ USB' ກ່ອນ."
      );
    }

    const device =
      vendorId !== undefined && productId !== undefined
        ? devices.find((d) => d.vendorId === vendorId && d.productId === productId) ||
          devices[0]
        : devices[0];

    if (!device.opened) {
      await device.open();
    }

    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // Find Printer interface (class 7) or first interface with an OUT bulk endpoint
    let targetInterfaceNum: number | null = null;
    let targetEndpointNum: number | null = null;

    const interfaces = device.configuration?.interfaces || [];
    for (const iface of interfaces) {
      for (const alt of iface.alternates || []) {
        const outEp = (alt.endpoints || []).find(
          (ep: any) => ep.direction === "out"
        );
        if (outEp) {
          if (alt.interfaceClass === 7 || targetInterfaceNum === null) {
            targetInterfaceNum = iface.interfaceNumber;
            targetEndpointNum = outEp.endpointNumber;
            if (alt.interfaceClass === 7) break;
          }
        }
      }
      if (targetInterfaceNum !== null && targetEndpointNum !== null) {
        const ifaceObj = interfaces.find(
          (i: any) => i.interfaceNumber === targetInterfaceNum
        );
        const isPrinterClass = ifaceObj?.alternates?.some(
          (a: any) => a.interfaceClass === 7
        );
        if (isPrinterClass) break;
      }
    }

    if (targetInterfaceNum === null || targetEndpointNum === null) {
      throw new Error("ບໍ່ພົບຊ່ອງສົ່ງຂໍ້ມູນ (OUT Endpoint) ຂອງເຄື່ອງພິມ USB");
    }

    await device.claimInterface(targetInterfaceNum);

    try {
      // Send in 64KB chunks for high reliability
      const chunkSize = 16384;
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        const chunk = bytes.slice(offset, offset + chunkSize);
        await device.transferOut(targetEndpointNum, chunk);
      }
    } finally {
      await device.releaseInterface(targetInterfaceNum).catch(() => {});
    }
  }

  /**
   * Prompts user to select and authorize a Serial / COM Port printer via Web Serial
   */
  public static async pairWebSerialPrinter(): Promise<{
    label: string;
    usbVendorId?: number;
    usbProductId?: number;
  }> {
    if (!this.isWebSerialSupported()) {
      throw new Error(
        "ບຣາວເຊີນີ້ບໍ່ຮອງຮັບ Web Serial (ກະລຸນາໃຊ້ Chrome ຫຼື Edge ຜ່ານ HTTPS/localhost)"
      );
    }

    const port = await (navigator as any).serial.requestPort();
    const info = port.getInfo?.() || {};
    const label = info.usbVendorId
      ? `COM Port (${info.usbVendorId.toString(16)}:${(info.usbProductId || 0).toString(16)})`
      : "Serial / COM Printer";
    return {
      label,
      usbVendorId: info.usbVendorId,
      usbProductId: info.usbProductId,
    };
  }

  /**
   * Checks if at least one Web Serial port is already authorized
   */
  public static async hasPairedSerialPort(): Promise<boolean> {
    if (!this.isWebSerialSupported()) return false;
    try {
      const ports: any[] = await (navigator as any).serial.getPorts();
      return ports.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Sends raw ESC/POS bytes via an authorized Web Serial / COM port
   */
  public static async sendViaWebSerial(
    bytes: Uint8Array,
    baudRate: number = 9600
  ): Promise<void> {
    if (!this.isWebSerialSupported()) {
      throw new Error("Web Serial is not supported in this browser");
    }

    const ports: any[] = await (navigator as any).serial.getPorts();
    if (!ports || ports.length === 0) {
      throw new Error(
        "ຍັງບໍ່ໄດ້ເຊື່ອມຕໍ່ພອດ Serial/COM. ກະລຸນາກົດປຸ່ມ 'ເລືອກພອດ COM' ກ່ອນ."
      );
    }

    const port = ports[0];
    if (!port.readable && !port.writable) {
      await port.open({ baudRate });
    }

    const writer = port.writable.getWriter();
    try {
      await writer.write(bytes);
    } finally {
      writer.releaseLock();
      await port.close().catch(() => {});
    }
  }
}
