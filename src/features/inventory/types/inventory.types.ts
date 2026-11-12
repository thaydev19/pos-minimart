// ============================================================================
// Inventory & FEFO Batch Management Type Definitions
// Enterprise Lao Retail POS
// ============================================================================

export type InventoryFilterStatus = "all" | "low_stock" | "near_expiry" | "expired";

export type BatchExpiryStatus = "good" | "warning" | "critical" | "expired";

export interface BatchDetail {
  id: string;
  store_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  batch_number: string;
  expiry_date: string;
  quantity_on_hand: number;
  cost_price: number;
  is_clearance: boolean;
  clearance_price?: number;
  days_until_expiry: number;
  status: BatchExpiryStatus;
  created_at?: string;
}

export interface InventoryProductUnit {
  id: string;
  unit_name: string;
  conversion_rate: number;
  selling_price: number;
  barcode?: string;
  is_base_unit: boolean;
}

export interface InventoryProductItem {
  id: string;
  barcode: string;
  name_lo: string;
  name_en?: string;
  base_unit: string;
  image_url?: string;
  category_id?: string;
  category_name?: string;
  is_perishable: boolean;
  warning_days: number;
  is_weighing: boolean;
  total_stock: number;
  batches: BatchDetail[];
  fefo_next_batch?: BatchDetail;
  latest_cost_price: number;
  selling_price: number;
  total_cost_value: number;
  has_near_expiry: boolean;
  has_expired: boolean;
  is_low_stock: boolean;
  units: InventoryProductUnit[];
}

export interface StockInItemFormData {
  id: string; // client temporary id
  product_id: string;
  product_name: string;
  barcode: string;
  base_unit: string;
  selected_unit_name: string;
  conversion_rate: number;
  input_quantity: number;
  total_base_quantity: number;
  input_cost_price: number;
  base_unit_cost: number;
  batch_number: string;
  expiry_date: string;
  is_perishable?: boolean;
}

export interface StockInFormData {
  supplier_name?: string;
  invoice_ref?: string;
  items: StockInItemFormData[];
  notes?: string;
}

export interface StockAdjustmentFormData {
  batch_id: string;
  product_id: string;
  product_name: string;
  batch_number: string;
  current_quantity: number;
  adjusted_quantity: number;
  difference: number;
  reason: string;
  notes?: string;
}

export interface InventoryKPIs {
  totalInventoryValue: number;
  lowStockCount: number;
  nearExpiryBatchCount: number;
  expiredBatchCount: number;
  totalProductCount: number;
}

