// ============================================================================
// POS Calculation Utilities & FEFO Allocator
// ============================================================================

import { CartItem, PosTotals } from "../types/pos.types";
import { LocalProductBatch } from "@/apis/offline-db";
import { calculateCartTotals } from "@/utils/math.util";

/**
 * Computes complete POS totals and returns stable PosTotals object
 */
export function computePosTotals(
  cart: CartItem[],
  orderDiscountFixed: number = 0,
  vatRatePercent: number = 0
): PosTotals {
  const totals = calculateCartTotals(cart, orderDiscountFixed, vatRatePercent);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    ...totals,
    totalItemCount,
  };
}

/**
 * Allocates product batch using FEFO (First Expired, First Out)
 */
export function allocateFefoBatch(
  batches: LocalProductBatch[] = [],
  warningDays: number = 15
): {
  allocatedBatch?: LocalProductBatch;
  isNearExpiry: boolean;
  isExpired: boolean;
} {
  if (!batches || batches.length === 0) {
    return { isNearExpiry: false, isExpired: false };
  }

  // Sort by expiry_date ascending
  const sorted = [...batches].sort(
    (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
  );

  const allocatedBatch = sorted.find((b) => b.quantity_on_hand > 0) || sorted[0];

  let isNearExpiry = false;
  let isExpired = false;

  if (allocatedBatch) {
    const today = new Date();
    const expDate = new Date(allocatedBatch.expiry_date);
    const daysDiff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysDiff <= 0) {
      isExpired = true;
    } else if (daysDiff <= warningDays || allocatedBatch.is_clearance) {
      isNearExpiry = true;
    }
  }

  return {
    allocatedBatch,
    isNearExpiry,
    isExpired,
  };
}

/**
 * Rounds Lao Kip currency amount to physical currency multiples (500₭ or 1,000₭).
 * In Laos retail cash transactions, denominations under 500₭ are not in physical circulation.
 * Particularly essential for fresh produce / scale items (ຊັ່ງກິໂລ) or percentage discounts.
 *
 * @param amount Total amount to round
 * @param step Rounding step (default 500, can be 1000)
 * @param mode Rounding mode: 'round' (nearest), 'ceil' (up), 'floor' (down)
 */
export function roundToLaoKip(
  amount: number,
  step: 500 | 1000 = 500,
  mode: "round" | "ceil" | "floor" = "round"
): number {
  if (!amount || amount <= 0) return 0;
  if (mode === "ceil") {
    return Math.ceil(amount / step) * step;
  }
  if (mode === "floor") {
    return Math.floor(amount / step) * step;
  }
  return Math.round(amount / step) * step;
}


