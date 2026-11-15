// ============================================================================
// Database & Entity Types for Minimart POS
// ============================================================================

import { UserRole, PaymentMethod, OrderStatus, ShiftStatus } from "./common.types";

export interface StoreEntity {
  id: string;
  name_lo: string;
  name_en?: string;
  address_lo?: string;
  phone?: string;
  tax_code?: string;
  currency: string;
  receipt_footer_lo?: string;
  created_at: string;
  updated_at: string;
}

export interface UserEntity {
  id: string;
  store_id: string;
  username: string;
  full_name_lo: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface CategoryEntity {
  id: string;
  store_id: string;
  name_lo: string;
  name_en?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  created_at?: string;
}

export interface ProductEntity {
  id: string;
  store_id: string;
  category_id?: string;
  barcode: string;
  sku?: string;
  name_lo: string;
  name_en?: string;
  base_unit: string;
  cost_price: number;
  selling_price: number;
  is_perishable: boolean;
  warning_days_before_expiry: number;
  is_weighing: boolean;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductUnitEntity {
  id: string;
  product_id: string;
  unit_name: string;
  conversion_rate: number;
  selling_price: number;
  barcode?: string;
  is_base_unit: boolean;
  created_at?: string;
}

export interface ProductBatchEntity {
  id: string;
  store_id: string;
  product_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_on_hand: number;
  cost_price: number;
  is_clearance: boolean;
  clearance_price?: number;
  created_at?: string;
}
