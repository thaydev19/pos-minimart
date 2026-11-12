// ============================================================================
// Orders Type Definitions - Enterprise Lao Retail POS
// ============================================================================

export type OrderPaymentMethod = "cash" | "transfer" | "lao_qr" | "card" | "mixed";
export type OrderRecordStatus = "completed" | "cancelled" | "refunded";

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  batch_id?: string | null;
  batch_number?: string | null;
  unit_name: string;
  conversion_rate: number;
  unit_price: number;
  quantity: number;
  subtotal_price: number;
  discount_amount: number;
  total_price: number;
}

export interface OrderRecord {
  id: string;
  store_id: string;
  shift_id?: string | null;
  cashier_id: string;
  cashier_name?: string;
  order_number: string;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  final_total: number;
  payment_method: OrderPaymentMethod;
  cash_tendered: number;
  change_amount: number;
  status: OrderRecordStatus;
  offline_created_at: string;
  client_synced_at?: string;
  notes?: string | null;
  items?: OrderItemRecord[];
}

export interface VoidOrderInput {
  order_id: string;
  reason: string;
  manager_pin: string;
  notes?: string;
}

export interface OrdersFilter {
  dateRange: "today" | "week" | "month" | "all";
  paymentMethod: "all" | "cash" | "transfer" | "lao_qr";
  status: "all" | "completed" | "cancelled";
  searchTerm: string;
  shiftId?: string;
}

export interface OrderKPIs {
  totalRevenue: number;
  completedOrderCount: number;
  cancelledOrderCount: number;
  cashRevenue: number;
  transferRevenue: number;
  averageOrderValue: number;
}

