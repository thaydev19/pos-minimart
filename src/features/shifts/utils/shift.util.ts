// ============================================================================
// Shift Utilities: Cash Drawer Denomination Calculation & Reconciliation
// ============================================================================

import { CashDenominationCount } from "../types/shift.types";
import { LAO_KIP_DENOMINATIONS } from "../constants/shift.constants";

export function getInitialDenominationCounts(): CashDenominationCount {
  return {
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
  };
}

/**
 * Multiplies count by face value for each Lao Kip denomination and returns sum.
 */
export function calculateDenominationsTotal(counts: CashDenominationCount): number {
  let total = 0;
  for (const denom of LAO_KIP_DENOMINATIONS) {
    const qty = counts[denom] || 0;
    total += denom * qty;
  }
  return total;
}

/**
 * Calculates variance between counted cash and expected cash.
 * Positive = Surplus (ເງິນເກີນ), Negative = Shortage (ເງິນຂາດ).
 */
export function calculateDiscrepancy(actualCash: number, expectedCash: number): number {
  return actualCash - expectedCash;
}

/**
 * Formats time duration for a cashier shift in Lao language.
 */
export function formatShiftDuration(
  openingTimeStr: string,
  closingTimeStr?: string | null
): string {
  try {
    const start = new Date(openingTimeStr).getTime();
    const end = closingTimeStr ? new Date(closingTimeStr).getTime() : Date.now();
    const diffMs = Math.max(0, end - start);

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours} ຊົ່ວໂມງ ${minutes} ນາທີ`;
    }
    return `${minutes} ນາທີ`;
  } catch {
    return "-";
  }
}

