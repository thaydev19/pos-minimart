// ============================================================================
// EAN-13 Electronic Scale Barcode Parser (Prefix 20-29 In-Store Scale Items)
// ============================================================================

export interface ParsedScaleBarcode {
  isScaleBarcode: boolean;
  itemPlu: string;
  weightKg?: number;
  priceLak?: number;
  rawBarcode: string;
}

export function parseEan13ScaleBarcode(barcode: string): ParsedScaleBarcode {
  const clean = barcode.trim();

  if (clean.length !== 13 || !/^\d{13}$/.test(clean)) {
    return {
      isScaleBarcode: false,
      itemPlu: clean,
      rawBarcode: clean,
    };
  }

  const prefix = clean.substring(0, 2);
  const prefixNum = parseInt(prefix, 10);

  if (prefixNum < 20 || prefixNum > 29) {
    return {
      isScaleBarcode: false,
      itemPlu: clean,
      rawBarcode: clean,
    };
  }

  const itemPlu = clean.substring(2, 7);
  const valuePart = parseInt(clean.substring(7, 12), 10);

  if (prefixNum === 20 || prefixNum === 21) {
    const weightKg = valuePart / 1000;
    return {
      isScaleBarcode: true,
      itemPlu,
      weightKg,
      rawBarcode: clean,
    };
  } else {
    return {
      isScaleBarcode: true,
      itemPlu,
      priceLak: valuePart,
      rawBarcode: clean,
    };
  }
}

