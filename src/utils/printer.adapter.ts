// ============================================================================
// ESC/POS Thermal Printer Adapter (80mm Canvas Raster Bitmap for Lao Script)
// ============================================================================

import { formatLak } from "./formatLakCurrency";
import { lo } from "@/constants/locales/lo";

export interface ReceiptItem {
  name: string;
  unitName: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
}

export interface ReceiptData {
  orderNumber: string;
  dateTime: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  finalTotal: number;
  paymentMethod: "cash" | "lao_qr" | "mixed";
  cashTendered?: number;
  changeAmount?: number;
  storeName?: string;
  storeBranch?: string;
  storeTel?: string;
  storeTaxCode?: string;
}

export class ThermalPrinterAdapter {
  public static isTauri(): boolean {
    return typeof window !== "undefined" && Boolean((window as any).__TAURI__);
  }

  public static isCapacitor(): boolean {
    return typeof window !== "undefined" && Boolean((window as any).Capacitor);
  }

  public static isWeb(): boolean {
    return !this.isTauri() && !this.isCapacitor();
  }

  public static async renderReceiptToCanvas(data: ReceiptData): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");
    const width = 576; // 80mm thermal width at 203 DPI = 576 dots
    canvas.width = width;

    const baseHeight = 520;
    const itemHeight = 44;
    const calculatedHeight = baseHeight + data.items.length * itemHeight;
    canvas.height = calculatedHeight;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not initialize 2D canvas context");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, calculatedHeight);

    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";

    let y = 24;

    // 1. Store Header
    ctx.font = "bold 28px 'Noto Sans Lao', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.storeName || lo.receipt.storeName, width / 2, y);
    y += 36;

    ctx.font = "20px 'Noto Sans Lao', sans-serif";
    ctx.fillText(data.storeBranch || lo.receipt.storeBranch, width / 2, y);
    y += 28;

    ctx.font = "18px 'Plus Jakarta Sans', 'Noto Sans Lao', sans-serif";
    ctx.fillText(data.storeTel || lo.receipt.storeTel, width / 2, y);
    y += 26;

    ctx.fillText(data.storeTaxCode || lo.receipt.storeTax, width / 2, y);
    y += 32;

    ctx.font = "bold 22px 'Noto Sans Lao', sans-serif";
    ctx.fillText(lo.receipt.receiptTitle, width / 2, y);
    y += 34;

    this.drawDottedLine(ctx, 20, y, width - 20);
    y += 18;

    // 2. Metadata
    ctx.textAlign = "left";
    ctx.font = "18px 'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`${lo.receipt.billNo}: ${data.orderNumber}`, 24, y);
    y += 26;

    ctx.fillText(`${lo.receipt.dateTime}: ${data.dateTime}`, 24, y);
    y += 26;

    ctx.fillText(`${lo.receipt.cashier}: ${data.cashierName}`, 24, y);
    y += 32;

    this.drawDottedLine(ctx, 20, y, width - 20);
    y += 12;

    ctx.font = "bold 18px 'Noto Sans Lao', sans-serif";
    ctx.fillText(lo.receipt.itemName, 24, y);
    ctx.textAlign = "right";
    ctx.fillText(lo.receipt.itemQty, 360, y);
    ctx.fillText(lo.receipt.itemAmount, width - 24, y);
    y += 28;

    this.drawDottedLine(ctx, 20, y, width - 20);
    y += 16;

    // 3. Items List
    ctx.font = "19px 'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif";
    for (const item of data.items) {
      ctx.textAlign = "left";
      const itemTitle = `${item.name} (${item.unitName})`;
      ctx.fillText(itemTitle, 24, y);

      ctx.textAlign = "right";
      ctx.fillText(`${item.qty}`, 360, y);
      ctx.fillText(formatLak(item.totalPrice, false), width - 24, y);
      y += 26;

      ctx.font = "16px 'Plus Jakarta Sans', 'Noto Sans Lao', sans-serif";
      ctx.fillStyle = "#333333";
      ctx.textAlign = "left";
      ctx.fillText(`@ ${formatLak(item.unitPrice, false)} ₭`, 32, y);
      ctx.fillStyle = "#000000";
      ctx.font = "19px 'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif";
      y += 24;
    }

    y += 8;
    this.drawDottedLine(ctx, 20, y, width - 20);
    y += 18;

    // 4. Totals Summary
    const printRow = (label: string, value: string, isBold: boolean = false) => {
      ctx.font = isBold
        ? "bold 22px 'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif"
        : "19px 'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label, 24, y);
      ctx.textAlign = "right";
      ctx.fillText(value, width - 24, y);
      y += isBold ? 34 : 26;
    };

    printRow(lo.receipt.subtotal, formatLak(data.subtotal));
    if (data.discountAmount > 0) {
      printRow(lo.receipt.discount, `-${formatLak(data.discountAmount)}`);
    }

    this.drawSolidLine(ctx, 20, y, width - 20);
    y += 14;

    printRow(lo.receipt.grandTotal, formatLak(data.finalTotal), true);

    this.drawSolidLine(ctx, 20, y, width - 20);
    y += 14;

    if (data.paymentMethod === "cash") {
      printRow(lo.receipt.cashPaid, formatLak(data.cashTendered || data.finalTotal));
      printRow(lo.receipt.changeDue, formatLak(data.changeAmount || 0));
    } else {
      printRow(lo.receipt.qrPaid, formatLak(data.finalTotal));
    }

    y += 16;
    this.drawDottedLine(ctx, 20, y, width - 20);
    y += 26;

    // 5. Footer
    ctx.textAlign = "center";
    ctx.font = "bold 20px 'Noto Sans Lao', sans-serif";
    ctx.fillText(lo.receipt.thankYou, width / 2, y);
    y += 28;

    ctx.font = "16px 'Noto Sans Lao', sans-serif";
    ctx.fillText(lo.receipt.returnNotice, width / 2, y);
    y += 40;

    return canvas;
  }

  public static convertCanvasToEscPosRaster(canvas: HTMLCanvasElement): Uint8Array {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new Uint8Array();

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    const widthBytes = Math.ceil(width / 8);
    const rasterBytesLength = widthBytes * height;
    const rasterData = new Uint8Array(rasterBytesLength);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luminance < 128) {
          const byteIndex = y * widthBytes + Math.floor(x / 8);
          const bitIndex = 7 - (x % 8);
          rasterData[byteIndex] |= 1 << bitIndex;
        }
      }
    }

    const xL = widthBytes & 0xff;
    const xH = (widthBytes >> 8) & 0xff;
    const yL = height & 0xff;
    const yH = (height >> 8) & 0xff;

    const header = new Uint8Array([
      0x1b, 0x40,
      0x1d, 0x76, 0x30, 0x00,
      xL, xH, yL, yH,
    ]);

    const cutCommand = new Uint8Array([
      0x1d, 0x56, 0x41, 0x00,
    ]);

    const finalBuffer = new Uint8Array(header.length + rasterData.length + cutCommand.length);
    finalBuffer.set(header, 0);
    finalBuffer.set(rasterData, header.length);
    finalBuffer.set(cutCommand, header.length + rasterData.length);

    return finalBuffer;
  }

  public static async printReceipt(data: ReceiptData): Promise<boolean> {
    const canvas = await this.renderReceiptToCanvas(data);

    if (this.isTauri()) {
      const escPosData = this.convertCanvasToEscPosRaster(canvas);
      try {
        const { invoke } = (window as any).__TAURI__.core || (window as any).__TAURI__;
        await invoke("print_raw_escpos", { data: Array.from(escPosData) });
        return true;
      } catch (e) {
        console.warn("Tauri printer invocation failed, falling back to browser print", e);
      }
    }

    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (printWindow) {
      const dataUrl = canvas.toDataURL("image/png");
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${data.orderNumber}</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; padding: 0; display: flex; justify-content: center; background: #fff; }
              img { width: 80mm; height: auto; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
      return true;
    }

    return false;
  }

  private static drawDottedLine(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.restore();
  }

  private static drawSolidLine(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
    ctx.save();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.restore();
  }
}

