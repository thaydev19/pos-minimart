// ============================================================================
// Products & Units Type Definitions - Enterprise Lao Retail POS
// ============================================================================

import { LocalProductUnit, LocalProductBatch } from "@/apis/offline-db";

export interface ProductUnitFormData {
  id?: string;
  unit_name: string;
  conversion_rate: number;
  selling_price: number;
  barcode?: string;
  is_base_unit: boolean;
}

export interface InitialStockInput {
  quantity: number;
  unit_name?: string;
  conversion_rate?: number;
  expiry_date?: string;
}

export interface ProductListItem {
  id: string;
  store_id: string;
  category_id?: string | null;
  category_name?: string;
  barcode: string;
  sku?: string | null;
  name_lo: string;
  name_en?: string | null;
  base_unit: string;
  cost_price: number;
  selling_price: number;
  is_perishable: boolean;
  warning_days_before_expiry: number;
  is_weighing: boolean;
  image_url?: string | null;
  is_active: boolean;
  units: LocalProductUnit[];
  batches: LocalProductBatch[];
  total_stock: number;
  created_at?: string;
}

export interface ProductFormData {
  name_lo: string;
  name_en?: string;
  category_id?: string;
  base_unit: string;
  barcode: string;
  sku?: string;
  cost_price: number;
  selling_price: number;
  is_weighing: boolean;
  is_perishable: boolean;
  warning_days_before_expiry: number;
  image_url?: string;
  units: ProductUnitFormData[];
  initial_stock?: InitialStockInput;
}

