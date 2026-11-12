// ============================================================================
// Dexie.js (IndexedDB) Local-First Database - Enterprise Minimart POS
// ============================================================================

import Dexie, { type EntityTable } from "dexie";
import {
  ProductEntity,
  ProductUnitEntity,
  ProductBatchEntity,
  CategoryEntity,
  OrderStatus,
  PaymentMethod,
} from "@/types";

export interface LocalProduct extends ProductEntity {}
export interface LocalProductUnit extends ProductUnitEntity {}
export interface LocalProductBatch extends ProductBatchEntity {}
export interface LocalCategory extends CategoryEntity {}

export interface LocalOrder {
  id: string;
  store_id: string;
  shift_id?: string;
  cashier_id: string;
  cashier_name: string;
  order_number: string;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  final_total: number;
  payment_method: PaymentMethod;
  cash_tendered: number;
  change_amount: number;
  status: OrderStatus;
  offline_created_at: string;
  client_synced_at?: string;
  notes?: string;
  items?: LocalOrderItem[];
}

export interface LocalOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  batch_id?: string;
  product_name: string;
  unit_name: string;
  conversion_rate: number;
  unit_price: number;
  quantity: number;
  subtotal_price: number;
  discount_amount: number;
  total_price: number;
}

export interface LocalHeldCart {
  id: string;
  tab_title: string;
  items: any[];
  held_at: string;
  customer_name?: string;
}

export interface LocalShift {
  id: string;
  store_id: string;
  user_id: string;
  opening_time: string;
  closing_time?: string;
  opening_cash: number;
  expected_closing_cash?: number;
  actual_closing_cash?: number;
  discrepancy?: number;
  status: "open" | "closed" | "audited";
  notes?: string;
  created_at: string;
}

export interface LocalSyncQueueItem {
  id?: number;
  entity_type: "order" | "shift" | "audit_log";
  entity_id: string;
  action: "INSERT" | "UPDATE";
  payload: Record<string, any>;
  status: "pending" | "processing" | "failed" | "synced";
  retry_count: number;
  error_message?: string;
  created_at: string;
}

export interface LocalAuditLog {
  id: string;
  store_id: string;
  user_id: string;
  role: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  before_data?: any;
  after_data?: any;
  reason?: string;
  created_at: string;
}

export class LaoPosDexieDatabase extends Dexie {
  products!: EntityTable<LocalProduct, "id">;
  product_units!: EntityTable<LocalProductUnit, "id">;
  product_batches!: EntityTable<LocalProductBatch, "id">;
  categories!: EntityTable<LocalCategory, "id">;
  orders!: EntityTable<LocalOrder, "id">;
  order_items!: EntityTable<LocalOrderItem, "id">;
  held_carts!: EntityTable<LocalHeldCart, "id">;
  shifts!: EntityTable<LocalShift, "id">;
  sync_queue!: EntityTable<LocalSyncQueueItem, "id">;
  audit_logs!: EntityTable<LocalAuditLog, "id">;

  constructor() {
    super("LaoMinimartPosDb");

    this.version(1).stores({
      products: "id, barcode, category_id, sku, is_active, is_weighing, [store_id+barcode]",
      product_units: "id, product_id, unit_name, barcode, is_base_unit",
      product_batches: "id, product_id, expiry_date, is_clearance, [product_id+expiry_date]",
      categories: "id, sort_order",
      orders: "id, order_number, shift_id, cashier_id, status, offline_created_at, client_synced_at",
      order_items: "id, order_id, product_id, batch_id",
      held_carts: "id, held_at",
      sync_queue: "++id, entity_type, entity_id, status, created_at",
      audit_logs: "id, action_type, user_id, created_at",
    });

    this.version(2).stores({
      shifts: "id, store_id, user_id, status, opening_time",
    });
  }
}

export const offlineDb = new LaoPosDexieDatabase();

