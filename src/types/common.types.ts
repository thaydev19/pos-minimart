// ============================================================================
// Common Application Types
// ============================================================================

export type UserRole = "cashier" | "store_manager" | "owner";

export type PaymentMethod = "cash" | "lao_qr" | "mixed";

export type OrderStatus = "completed" | "cancelled" | "refunded";

export type ShiftStatus = "open" | "closed";

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

