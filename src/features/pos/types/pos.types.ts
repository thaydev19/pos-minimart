// ============================================================================
// POS Terminal Type Definitions - Enterprise Lao Retail Minimart
// ============================================================================

import {
  LocalProduct,
  LocalProductUnit,
  LocalProductBatch,
} from "@/apis/offline-db";

export interface ProductWithDetails extends LocalProduct {
  units: LocalProductUnit[];
  batches: LocalProductBatch[];
  category_name?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  barcode: string;
  selectedUnit: LocalProductUnit;
  availableUnits: LocalProductUnit[];
  quantity: number;
  unitPrice: number;
  subtotalPrice: number;
  discountAmount: number;
  totalPrice: number;
  allocatedBatch?: LocalProductBatch;
  imageUrl?: string;
  isNearExpiry?: boolean;
  isExpired?: boolean;
  isWeighing?: boolean;
}

export interface HoldOrder {
  id: string;
  tabTitle: string;
  items: CartItem[];
  heldAt: string;
  customerNote?: string;
}

export interface CashierInfo {
  id: string;
  name: string;
  role: "cashier" | "store_manager" | "owner";
  shiftNumber: string;
}

export interface PosTotals {
  subtotal: number;
  itemsDiscount: number;
  orderDiscount: number;
  totalDiscount: number;
  vatAmount: number;
  finalTotal: number;
  totalItemCount: number;
}
