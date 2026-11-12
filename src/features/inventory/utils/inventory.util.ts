// ============================================================================
// Inventory Utilities: Expiry Countdown, Batch Generation & Unit Conversions
// ============================================================================

import {
  EXPIRY_THRESHOLDS,
  BATCH_NUMBER_PREFIX,
} from "../constants/inventory.constants";
import { BatchExpiryStatus, InventoryProductUnit } from "../types/inventory.types";

/**
 * Calculates remaining whole days until an expiry date (YYYY-MM-DD).
 * Negative number means already expired.
 */
export function calculateDaysUntilExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 999;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = expiryDateStr.split("-");
    if (parts.length < 3) return 999;

    const expiryDate = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

/**
 * Categorizes expiry status into "good" | "warning" | "critical" | "expired".
 */
export function getExpiryStatus(
  daysUntilExpiry: number,
  customWarningDays: number = EXPIRY_THRESHOLDS.WARNING_DAYS
): BatchExpiryStatus {
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= EXPIRY_THRESHOLDS.CRITICAL_DAYS) return "critical";
  if (daysUntilExpiry <= customWarningDays) return "warning";
  return "good";
}

/**
 * Generates an auto-incremented or timestamp-based batch code:
 * E.g. LOT-20261113-A8F2
 */
export function generateDefaultBatchNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${BATCH_NUMBER_PREFIX}-${yyyy}${mm}${dd}-${randomSuffix}`;
}

/**
 * Converts package input quantity to base unit quantity.
 * E.g. 5 boxes * 24 cans/box = 120 cans
 */
export function convertInputQuantityToBase(
  quantity: number,
  conversionRate: number
): number {
  const rate = conversionRate > 0 ? conversionRate : 1;
  return Math.round(quantity * rate);
}

/**
 * Calculates unit cost per base item when bought as a crate/pack.
 * E.g. 240,000 LAK per crate / 24 cans = 10,000 LAK per can
 */
export function calculateBaseUnitCost(
  unitCost: number,
  conversionRate: number
): number {
  if (conversionRate <= 1) return unitCost;
  return Math.round(unitCost / conversionRate);
}

/**
 * Intelligently formats stock count with secondary packaging breakdown:
 * E.g. 48 cans -> "48 ປ໋ອງ (2 ແກັດ)"
 * E.g. 52 cans -> "52 ປ໋ອງ (2 ແກັດ + 4 ປ໋ອງ)"
 */
export function formatStockDisplay(
  totalStock: number,
  baseUnit: string,
  units?: InventoryProductUnit[]
): string {
  if (totalStock <= 0) return `0 ${baseUnit}`;

  if (!units || units.length <= 1) {
    return `${totalStock} ${baseUnit}`;
  }

  // Find largest secondary unit
  const secondaryUnits = units
    .filter((u) => !u.is_base_unit && u.conversion_rate > 1)
    .sort((a, b) => b.conversion_rate - a.conversion_rate);

  if (secondaryUnits.length === 0) {
    return `${totalStock} ${baseUnit}`;
  }

  const largest = secondaryUnits[0];
  if (totalStock >= largest.conversion_rate) {
    const fullPacks = Math.floor(totalStock / largest.conversion_rate);
    const remainder = totalStock % largest.conversion_rate;

    if (remainder === 0) {
      return `${totalStock} ${baseUnit} (${fullPacks} ${largest.unit_name})`;
    }
    return `${totalStock} ${baseUnit} (${fullPacks} ${largest.unit_name} + ${remainder} ${baseUnit})`;
  }

  return `${totalStock} ${baseUnit}`;
}

/**
 * Calculates weighted average cost from active batches.
 */
export function calculateAverageCost(
  batches: { quantity_on_hand: number; cost_price: number }[]
): number {
  let totalCost = 0;
  let totalQty = 0;

  for (const b of batches) {
    if (b.quantity_on_hand > 0) {
      totalCost += b.quantity_on_hand * b.cost_price;
      totalQty += b.quantity_on_hand;
    }
  }

  if (totalQty === 0) return 0;
  return Math.round(totalCost / totalQty);
}
