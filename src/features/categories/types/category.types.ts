// ============================================================================
// Categories Type Definitions - Enterprise Retail POS (Lao Minimart)
// ============================================================================

export interface CategoryItem {
  id: string;
  store_id: string;
  name_lo: string;
  name_en?: string | null;
  icon?: string | null;
  sort_order: number;
  color?: string | null;
  created_at?: string;
  product_count?: number;
}

export interface CategoryFormData {
  name_lo: string;
  name_en?: string;
  icon?: string;
  sort_order: number;
  color?: string;
}

export interface DeleteCategoryResult {
  success: boolean;
  message?: string;
  productCount?: number;
}

