// ============================================================================
// Shift Management Type Definitions - Enterprise Lao Retail POS
// ============================================================================

export type ShiftStatus = "open" | "closed" | "audited";

export interface CashDenominationCount {
  100000: number;
  50000: number;
  20000: number;
  10000: number;
  5000: number;
  2000: number;
  1000: number;
  500?: number;
  [key: number]: number | undefined;
}

export interface ShiftItem {
  id: string;
  store_id: string;
  user_id: string;
  cashier_name?: string;
  opening_time: string;
  closing_time?: string | null;
  opening_cash: number;
  expected_closing_cash?: number | null;
  actual_closing_cash?: number | null;
  discrepancy?: number | null;
  status: ShiftStatus;
  notes?: string | null;
  created_at?: string;

  // Computed summary metrics
  total_cash_sales?: number;
  total_transfer_sales?: number;
  total_orders_count?: number;
}

export interface CloseShiftBlindInput {
  shift_id: string;
  counts: CashDenominationCount;
  transfer_sales_entered: number;
  actual_cash_entered?: number;
  notes?: string;
}

export interface ShiftClosingSummary {
  shift: ShiftItem;
  opening_cash: number;
  cash_sales: number;
  transfer_sales: number;
  expected_cash: number;
  actual_cash: number;
  discrepancy: number; // actual - expected
  order_count: number;
  counts: CashDenominationCount;
  closed_at: string;
}

