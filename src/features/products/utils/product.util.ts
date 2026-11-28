// ============================================================================
// Product Utilities: Barcode Generation, Validation & Calculations
// ============================================================================

import { ProductUnitFormData } from "../types/product.types";

/**
 * Generates an internal barcode for unpackaged goods or weighted scale items.
 * If isWeighing is true, starts with prefix '20' (Standard EAN-13 in-store weighing prefix).
 */
export function generateInternalBarcode(isWeighing = false): string {
  if (isWeighing) {
    // 5-digit PLU code for weighing scales (e.g. 00108)
    const plu = Math.floor(100 + Math.random() * 900);
    return `20${plu.toString().padStart(5, "0")}`;
  }

  // 12-digit in-store retail barcode + calculate check digit
  const raw11 = "885" + Math.floor(10000000 + Math.random() * 90000000).toString();
  let oddSum = 0;
  let evenSum = 0;
  for (let i = 0; i < raw11.length; i++) {
    const digit = parseInt(raw11[i], 10);
    if (i % 2 === 0) oddSum += digit;
    else evenSum += digit;
  }
  const total = oddSum + evenSum * 3;
  const checkDigit = (10 - (total % 10)) % 10;
  return `${raw11}${checkDigit}`;
}

/**
 * Validates that all units have valid, non-duplicate barcodes.
 */
export function validateUnitBarcodes(
  units: ProductUnitFormData[],
  mainBarcode: string
): { isValid: boolean; error?: string } {
  const seenBarcodes = new Set<string>();

  if (mainBarcode.trim()) {
    seenBarcodes.add(mainBarcode.trim());
  }

  for (const unit of units) {
    if (!unit.unit_name.trim()) {
      return { isValid: false, error: "ກະລຸນາໃສ່ຊື່ຫົວໜ່ວຍໃຫ້ຄົບຖ້ວນ" };
    }
    if (unit.conversion_rate <= 0) {
      return { isValid: false, error: `ອັດຕາແປງຂອງ ${unit.unit_name} ຕ້ອງໃຫຍ່ກວ່າ 0` };
    }
    if (unit.selling_price < 0) {
      return { isValid: false, error: `ລາຄາຂາຍຂອງ ${unit.unit_name} ບໍ່ສາມາດຕິດລົບໄດ້` };
    }

    // Secondary unit custom barcode
    if (unit.barcode && unit.barcode.trim()) {
      const code = unit.barcode.trim();
      if (seenBarcodes.has(code) && !unit.is_base_unit) {
        return {
          isValid: false,
          error: `ບາໂຄດ "${code}" ຖືກໃຊ້ຊ້ຳກັນໃນຫົວໜ່ວຍຂອງສິນຄ້ານີ້`,
        };
      }
      seenBarcodes.add(code);
    }
  }

  return { isValid: true };
}

/**
 * Calculates discount / savings percentage when customer buys a pack/crate vs individual units.
 */
export function calculateUnitSavings(
  basePrice: number,
  unitPrice: number,
  conversionRate: number
): number {
  if (conversionRate <= 1 || basePrice <= 0 || unitPrice <= 0) return 0;
  const singleCombinedPrice = basePrice * conversionRate;
  if (unitPrice >= singleCombinedPrice) return 0;
  return Math.round(((singleCombinedPrice - unitPrice) / singleCombinedPrice) * 100);
}

