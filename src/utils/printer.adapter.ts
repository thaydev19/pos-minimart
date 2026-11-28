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
  paymentMethod: "cash" | "lao_qr" | "mixed" | "transfer" | "card" | string;
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

  public static async renderReceiptToCanvas(
    data: ReceiptData,
    paperWidth: "58mm" | "80mm" = "80mm"
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");
    const is58 = paperWidth === "58mm";
    // 80mm = 576 dots, 58mm = 384 dots at 203 DPI (8 dots/mm)
    const width = is58 ? 384 : 576;
    canvas.width = width;
    canvas.height = 900 + data.items.length * 72;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not initialize 2D canvas context");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, canvas.height);

    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";
    if ("letterSpacing" in ctx) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0.4px";
    }

    // Sized in 203-DPI dots (8 dots = 1mm) with clean weights & breathing room for Lao script
    const fHeader = is58 ? 34 : 38;
    const fSub = is58 ? 20 : 23;
    const fMeta = is58 ? 20 : 22;
    const fItem = is58 ? 22 : 24;
    const fUnit = is58 ? 19 : 21;
    const fTotal = is58 ? 26 : 30;
    const fFooter = is58 ? 20 : 23;

    const lineGap = is58 ? 30 : 34;
    let y = is58 ? 12 : 18;
    const padX = is58 ? 4 : 14;
    const qtyX = is58 ? 246 : 365;

    // 1. Store Header
    ctx.font = `bold ${fHeader}px 'Noto Sans Lao', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(data.storeName || lo.receipt.storeName, width / 2, y, width - padX * 2);
    y += is58 ? 42 : 48;

    ctx.font = `400 ${fSub}px 'Noto Sans Lao', sans-serif`;
    ctx.fillText(data.storeBranch || lo.receipt.storeBranch, width / 2, y, width - padX * 2);
    y += is58 ? 28 : 32;

    ctx.font = `400 ${fUnit}px 'Plus Jakarta Sans', 'Noto Sans Lao', sans-serif`;
    ctx.fillText(data.storeTel || lo.receipt.storeTel, width / 2, y, width - padX * 2);
    y += is58 ? 26 : 30;

    ctx.fillText(data.storeTaxCode || lo.receipt.storeTax, width / 2, y, width - padX * 2);
    y += is58 ? 28 : 34;

    ctx.font = `bold ${is58 ? 22 : 26}px 'Noto Sans Lao', sans-serif`;
    ctx.fillText(lo.receipt.receiptTitle, width / 2, y, width - padX * 2);
    y += is58 ? 32 : 38;

    this.drawDottedLine(ctx, padX, y, width - padX);
    y += is58 ? 14 : 18;

    // 2. Metadata
    ctx.textAlign = "left";
    ctx.font = `400 ${fMeta}px 'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText(`${lo.receipt.billNo}: ${data.orderNumber}`, padX, y, width - padX * 2);
    y += lineGap;

    ctx.fillText(`${lo.receipt.dateTime}: ${data.dateTime}`, padX, y, width - padX * 2);
    y += lineGap;

    ctx.fillText(`${lo.receipt.cashier}: ${data.cashierName}`, padX, y, width - padX * 2);
    y += lineGap + 4;

    this.drawDottedLine(ctx, padX, y, width - padX);
    y += is58 ? 14 : 16;

    ctx.font = `bold ${fMeta}px 'Noto Sans Lao', sans-serif`;
    ctx.fillText(lo.receipt.itemName, padX, y);
    ctx.textAlign = "right";
    ctx.fillText(lo.receipt.itemQty, qtyX, y);
    ctx.fillText(lo.receipt.itemAmount, width - padX, y);
    y += is58 ? 30 : 34;

    this.drawDottedLine(ctx, padX, y, width - padX);
    y += is58 ? 14 : 18;

    // 3. Items List
    ctx.font = `500 ${fItem}px 'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif`;
    for (const item of data.items) {
      ctx.textAlign = "left";
      const itemTitle = `${item.name} (${item.unitName})`;
      ctx.fillText(itemTitle, padX, y, qtyX - padX - (is58 ? 28 : 38));

      ctx.textAlign = "right";
      ctx.fillText(`${item.qty}`, qtyX, y);
      ctx.fillText(formatLak(item.totalPrice, false), width - padX, y);
      y += is58 ? 31 : 35;

      ctx.font = `400 ${fUnit}px 'Plus Jakarta Sans', 'Noto Sans Lao', sans-serif`;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "left";
      ctx.fillText(`@ ${formatLak(item.unitPrice, false)} ₭`, padX + 4, y);
      ctx.font = `500 ${fItem}px 'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif`;
      y += is58 ? 30 : 32;
    }

    y += 6;
    this.drawDottedLine(ctx, padX, y, width - padX);
    y += is58 ? 14 : 18;

    // 4. Totals Summary
    const printRow = (label: string, value: string, isBold: boolean = false) => {
      ctx.font = isBold
        ? `bold ${fTotal}px 'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif`
        : `400 ${fMeta}px 'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(label, padX, y);
      ctx.textAlign = "right";
      ctx.fillText(value, width - padX, y);
      y += isBold ? (is58 ? 36 : 40) : lineGap;
    };

    printRow(lo.receipt.subtotal, formatLak(data.subtotal));
    if (data.discountAmount > 0) {
      printRow(lo.receipt.discount, `-${formatLak(data.discountAmount)}`);
    }

    this.drawSolidLine(ctx, padX, y, width - padX);
    y += is58 ? 12 : 14;

    printRow(lo.receipt.grandTotal, formatLak(data.finalTotal), true);

    this.drawSolidLine(ctx, padX, y, width - padX);
    y += is58 ? 12 : 14;

    if (data.paymentMethod === "cash") {
      printRow(lo.receipt.cashPaid, formatLak(data.cashTendered || data.finalTotal));
      printRow(lo.receipt.changeDue, formatLak(data.changeAmount || 0));
    } else {
      printRow(lo.receipt.qrPaid, formatLak(data.finalTotal));
    }

    y += is58 ? 12 : 16;
    this.drawDottedLine(ctx, padX, y, width - padX);
    y += is58 ? 18 : 24;

    // 5. Footer
    ctx.textAlign = "center";
    ctx.font = `500 ${fFooter}px 'Noto Sans Lao', sans-serif`;
    ctx.fillText(lo.receipt.thankYou, width / 2, y, width - padX * 2);
    y += is58 ? 28 : 34;

    ctx.font = `400 ${fUnit}px 'Noto Sans Lao', sans-serif`;
    ctx.fillText(lo.receipt.returnNotice, width / 2, y, width - padX * 2);
    y += 32;

    // Crop canvas to exact content height so nothing clips and no blank space is wasted
    const trimmed = document.createElement("canvas");
    trimmed.width = width;
    trimmed.height = y;
    const tCtx = trimmed.getContext("2d");
    if (tCtx) {
      tCtx.drawImage(canvas, 0, 0, width, y, 0, 0, width, y);
      return trimmed;
    }

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

        // Balanced threshold (138) keeps strokes crisp without thickening anti-aliased edges
        if (luminance < 138) {
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
      0x1b, 0x64, 0x07,
      0x1d, 0x56, 0x00,
    ]);

    const finalBuffer = new Uint8Array(header.length + rasterData.length + cutCommand.length);
    finalBuffer.set(header, 0);
    finalBuffer.set(rasterData, header.length);
    finalBuffer.set(cutCommand, header.length + rasterData.length);

    return finalBuffer;
  }

  public static async printReceipt(
    data: ReceiptData,
    paperWidth: "58mm" | "80mm" = "80mm"
  ): Promise<boolean> {
    const canvas = await this.renderReceiptToCanvas(data, paperWidth);

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

    // Use hidden iframe to bypass browser popup blockers and avoid blank tab flashes
    const dataUrl = canvas.toDataURL("image/png");
    const widthCss = paperWidth === "58mm" ? "58mm" : "80mm";

    return new Promise<boolean>((resolve) => {
      try {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.style.visibility = "hidden";
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc || !iframe.contentWindow) {
          iframe.remove();
          resolve(false);
          return;
        }

        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${data.orderNumber}</title>
              <style>
                @page { size: ${widthCss} auto; margin: 0; }
                body { margin: 0; padding: 0; display: flex; justify-content: center; background: #fff; }
                img { width: ${widthCss}; height: auto; display: block; }
              </style>
            </head>
            <body>
              <img id="receipt-img" src="${dataUrl}" />
            </body>
          </html>
        `);
        doc.close();

        const img = doc.getElementById("receipt-img") as HTMLImageElement | null;
        const triggerPrint = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } finally {
            setTimeout(() => iframe.remove(), 1500);
            resolve(true);
          }
        };

        if (img) {
          if (img.complete) {
            setTimeout(triggerPrint, 50);
          } else {
            img.onload = () => setTimeout(triggerPrint, 50);
            img.onerror = () => {
              iframe.remove();
              resolve(false);
            };
          }
        } else {
          setTimeout(triggerPrint, 100);
        }
      } catch {
        resolve(false);
      }
    });
  }

  private static drawDottedLine(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
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

