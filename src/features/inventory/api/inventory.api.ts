// ============================================================================
// Inventory API: Real Supabase CRUD, Dexie Sync & Audit Logging (No Mock Data)
// ============================================================================

import { supabase } from "@/apis/supabase-client";
import {
  offlineDb,
  LocalProductBatch,
  LocalAuditLog,
} from "@/apis/offline-db";
import { DEFAULT_STORE, DEFAULT_CASHIER } from "@/features/pos/constants/pos.constants";
import { useAuthStore } from "@/features/auth";
import {
  InventoryProductItem,
  BatchDetail,
  StockInFormData,
  StockAdjustmentFormData,
} from "../types/inventory.types";
import {
  calculateDaysUntilExpiry,
  getExpiryStatus,
  calculateAverageCost,
} from "../utils/inventory.util";
import { LOW_STOCK_THRESHOLD } from "../constants/inventory.constants";
import { usePosStore } from "@/features/pos/stores/pos.store";

export const inventoryApi = {
  /**
   * Fetches full inventory overview with product details, units and FEFO batches.
   */
  async fetchInventoryOverview(): Promise<InventoryProductItem[]> {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*, product_units(*), product_batches(*)")
          .order("name_lo", { ascending: true }),
        supabase.from("categories").select("id, name_lo"),
      ]);

      if (productsRes.error) {
        console.warn("[InventoryApi] Supabase error, falling back to Dexie:", productsRes.error.message);
        return this.fetchFromDexie();
      }

      const catMap = new Map<string, string>();
      if (categoriesRes.data) {
        for (const c of categoriesRes.data) {
          catMap.set(c.id, c.name_lo);
        }
      }

      const allBatchesForDexie: LocalProductBatch[] = [];

      const items: InventoryProductItem[] = (productsRes.data || []).map((raw) => {
        // Map batches
        const rawBatches = (raw.product_batches || []) as any[];
        const batches: BatchDetail[] = rawBatches
          .map((b) => {
            const days = calculateDaysUntilExpiry(b.expiry_date);
            const status = getExpiryStatus(days, raw.warning_days_before_expiry || 30);

            // Collect for Dexie
            allBatchesForDexie.push({
              id: b.id,
              store_id: b.store_id || DEFAULT_STORE.id,
              product_id: b.product_id,
              batch_number: b.batch_number,
              expiry_date: b.expiry_date,
              quantity_on_hand: Number(b.quantity_on_hand) || 0,
              cost_price: Number(b.cost_price) || 0,
              is_clearance: Boolean(b.is_clearance),
              clearance_price: b.clearance_price ? Number(b.clearance_price) : undefined,
              created_at: b.created_at,
            });

            return {
              id: b.id,
              store_id: b.store_id || DEFAULT_STORE.id,
              product_id: b.product_id,
              product_name: raw.name_lo,
              product_image: raw.image_url,
              batch_number: b.batch_number,
              expiry_date: b.expiry_date,
              quantity_on_hand: Number(b.quantity_on_hand) || 0,
              cost_price: Number(b.cost_price) || 0,
              is_clearance: Boolean(b.is_clearance),
              clearance_price: b.clearance_price ? Number(b.clearance_price) : undefined,
              days_until_expiry: days,
              status,
              created_at: b.created_at,
            };
          })
          // Strict FEFO sorting: Earliest expiry date first
          .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

        // Find next active batch to sell (FEFO next batch with stock > 0)
        const fefo_next_batch = batches.find((b) => b.quantity_on_hand > 0);

        const total_stock = batches.reduce((sum, b) => sum + b.quantity_on_hand, 0);
        const total_cost_value = batches.reduce(
          (sum, b) => sum + b.quantity_on_hand * b.cost_price,
          0
        );

        const has_near_expiry = batches.some(
          (b) => b.quantity_on_hand > 0 && (b.status === "warning" || b.status === "critical")
        );
        const has_expired = batches.some(
          (b) => b.quantity_on_hand > 0 && b.status === "expired"
        );
        const is_low_stock = total_stock <= LOW_STOCK_THRESHOLD;

        const latest_cost_price =
          fefo_next_batch?.cost_price ||
          (batches.length > 0 ? batches[batches.length - 1].cost_price : Number(raw.cost_price) || 0);

        return {
          id: raw.id,
          barcode: raw.barcode,
          name_lo: raw.name_lo,
          name_en: raw.name_en,
          base_unit: raw.base_unit || "ອັນ",
          image_url: raw.image_url,
          category_id: raw.category_id,
          category_name: raw.category_id ? catMap.get(raw.category_id) || "ທົ່ວໄປ" : "ທົ່ວໄປ",
          is_perishable: Boolean(raw.is_perishable),
          warning_days: raw.warning_days_before_expiry ?? 30,
          is_weighing: Boolean(raw.is_weighing),
          total_stock,
          batches,
          fefo_next_batch,
          latest_cost_price,
          selling_price: Number(raw.selling_price) || 0,
          total_cost_value,
          has_near_expiry,
          has_expired,
          is_low_stock,
          units: (raw.product_units || []).map((u: any) => ({
            id: u.id,
            unit_name: u.unit_name,
            conversion_rate: Number(u.conversion_rate) || 1,
            selling_price: Number(u.selling_price) || 0,
            barcode: u.barcode,
            is_base_unit: Boolean(u.is_base_unit),
          })),
        };
      });

      // Cache batches to Dexie in background
      if (allBatchesForDexie.length > 0) {
        offlineDb.product_batches.bulkPut(allBatchesForDexie).catch(console.error);
      }

      return items;
    } catch (err) {
      console.error("[InventoryApi] fetchInventoryOverview failed:", err);
      return this.fetchFromDexie();
    }
  },

  /**
   * Offline fallback for reading inventory from Dexie.js
   */
  async fetchFromDexie(): Promise<InventoryProductItem[]> {
    const [localProds, localUnits, localBatches, localCats] = await Promise.all([
      offlineDb.products.toArray(),
      offlineDb.product_units.toArray(),
      offlineDb.product_batches.toArray(),
      offlineDb.categories.toArray(),
    ]);

    const catMap = new Map<string, string>();
    for (const c of localCats) catMap.set(c.id, c.name_lo);

    return localProds.map((raw) => {
      const prodBatches = localBatches.filter((b) => b.product_id === raw.id);
      const batches: BatchDetail[] = prodBatches
        .map((b) => {
          const days = calculateDaysUntilExpiry(b.expiry_date);
          const status = getExpiryStatus(days, raw.warning_days_before_expiry || 30);

          return {
            id: b.id,
            store_id: b.store_id || DEFAULT_STORE.id,
            product_id: b.product_id,
            product_name: raw.name_lo,
            product_image: raw.image_url,
            batch_number: b.batch_number,
            expiry_date: b.expiry_date,
            quantity_on_hand: Number(b.quantity_on_hand) || 0,
            cost_price: Number(b.cost_price) || 0,
            is_clearance: Boolean(b.is_clearance),
            clearance_price: b.clearance_price ? Number(b.clearance_price) : undefined,
            days_until_expiry: days,
            status,
            created_at: b.created_at,
          };
        })
        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

      const fefo_next_batch = batches.find((b) => b.quantity_on_hand > 0);
      const total_stock = batches.reduce((sum, b) => sum + b.quantity_on_hand, 0);
      const total_cost_value = batches.reduce(
        (sum, b) => sum + b.quantity_on_hand * b.cost_price,
        0
      );

      const has_near_expiry = batches.some(
        (b) => b.quantity_on_hand > 0 && (b.status === "warning" || b.status === "critical")
      );
      const has_expired = batches.some(
        (b) => b.quantity_on_hand > 0 && b.status === "expired"
      );
      const is_low_stock = total_stock <= LOW_STOCK_THRESHOLD;

      const latest_cost_price =
        fefo_next_batch?.cost_price ||
        (batches.length > 0 ? batches[batches.length - 1].cost_price : Number(raw.cost_price) || 0);

      const units = localUnits.filter((u) => u.product_id === raw.id);

      return {
        id: raw.id,
        barcode: raw.barcode,
        name_lo: raw.name_lo,
        name_en: raw.name_en,
        base_unit: raw.base_unit || "ອັນ",
        image_url: raw.image_url,
        category_id: raw.category_id,
        category_name: raw.category_id ? catMap.get(raw.category_id) || "ທົ່ວໄປ" : "ທົ່ວໄປ",
        is_perishable: Boolean(raw.is_perishable),
        warning_days: raw.warning_days_before_expiry ?? 30,
        is_weighing: Boolean(raw.is_weighing),
        total_stock,
        batches,
        fefo_next_batch,
        latest_cost_price,
        selling_price: Number(raw.selling_price) || 0,
        total_cost_value,
        has_near_expiry,
        has_expired,
        is_low_stock,
        units: units.map((u) => ({
          id: u.id,
          unit_name: u.unit_name,
          conversion_rate: Number(u.conversion_rate) || 1,
          selling_price: Number(u.selling_price) || 0,
          barcode: u.barcode,
          is_base_unit: Boolean(u.is_base_unit),
        })),
      };
    });
  },

  /**
   * Creates a multi-item stock receipt, inserts batches into Supabase and Dexie,
   * writes audit log and refreshes the POS catalog.
   */
  async createStockIn(
    formData: StockInFormData
  ): Promise<{ success: boolean; createdBatches: LocalProductBatch[] }> {
    if (!formData.items || formData.items.length === 0) {
      throw new Error("ກະລຸນາເພີ່ມລາຍການສິນຄ້າທີ່ຈະນຳເຂົ້າສາງ");
    }

    const timestamp = new Date().toISOString();
    const createdBatches: LocalProductBatch[] = [];

    // 1. Prepare batch payloads
    const batchPayloads = formData.items.map((item) => {
      const batchId = crypto.randomUUID();
      const record: LocalProductBatch = {
        id: batchId,
        store_id: DEFAULT_STORE.id,
        product_id: item.product_id,
        batch_number: item.batch_number.trim(),
        expiry_date: item.expiry_date,
        quantity_on_hand: item.total_base_quantity,
        cost_price: item.base_unit_cost,
        is_clearance: false,
        created_at: timestamp,
      };
      createdBatches.push(record);
      return record;
    });

    // 2. Insert into Supabase
    try {
      const { error: batchErr } = await supabase
        .from("product_batches")
        .insert(batchPayloads);

      if (batchErr) {
        console.warn("[InventoryApi] Supabase batch insert warning (RLS/Network):", batchErr.message);
      }
    } catch (e: any) {
      console.warn("[InventoryApi] Supabase batch insert exception:", e?.message);
    }

    // 3. Write Audit Log
    const currentUser = useAuthStore.getState().user;
    const storeId = currentUser?.store_id || DEFAULT_STORE.id;
    const userId = currentUser?.id || DEFAULT_CASHIER.id;
    const userRole = currentUser?.role || "store_manager";

    const auditRecord: LocalAuditLog = {
      id: crypto.randomUUID(),
      store_id: storeId,
      user_id: userId,
      role: userRole,
      action_type: "STOCK_IN",
      entity_type: "stock_receipt",
      entity_id: formData.invoice_ref || `RCV-${Date.now()}`,
      reason: formData.notes || `ນຳເຂົ້າສິນຄ້າ ${formData.items.length} ລາຍການ`,
      after_data: {
        supplier: formData.supplier_name,
        invoice_ref: formData.invoice_ref,
        items_count: formData.items.length,
        total_items: formData.items.map((i) => ({
          name: i.product_name,
          unit: i.selected_unit_name,
          qty: i.input_quantity,
          base_qty: i.total_base_quantity,
          batch: i.batch_number,
          expiry: i.expiry_date,
        })),
      },
      created_at: timestamp,
    };

    try {
      await supabase.from("audit_logs").insert([auditRecord]);
    } catch (err) {
      console.warn("[InventoryApi] Failed to write audit_log on remote:", err);
    }

    // 4. Update Dexie Database
    await offlineDb.transaction(
      "rw",
      [offlineDb.product_batches, offlineDb.audit_logs],
      async () => {
        await offlineDb.product_batches.bulkPut(createdBatches);
        await offlineDb.audit_logs.put(auditRecord);
      }
    );

    // 5. Instantly notify POS catalog to reload FEFO batches
    usePosStore.getState().loadCatalog(true).catch(console.error);

    return { success: true, createdBatches };
  },

  /**
   * Adjusts stock quantity of an existing batch, records audit trail.
   */
  async adjustBatchStock(adjustment: StockAdjustmentFormData): Promise<void> {
    const timestamp = new Date().toISOString();

    // 1. Update batch in Supabase
    const { error: updateErr } = await supabase
      .from("product_batches")
      .update({
        quantity_on_hand: adjustment.adjusted_quantity,
      })
      .eq("id", adjustment.batch_id);

    if (updateErr) {
      throw new Error(`ປັບຍອດສະຕັອກບໍ່ສຳເລັດ: ${updateErr.message}`);
    }

    // 2. Insert audit log to track inventory variance
    const currentUser = useAuthStore.getState().user;
    const storeId = currentUser?.store_id || DEFAULT_STORE.id;
    const userId = currentUser?.id || DEFAULT_CASHIER.id;
    const userRole = currentUser?.role || "store_manager";

    const auditRecord: LocalAuditLog = {
      id: crypto.randomUUID(),
      store_id: storeId,
      user_id: userId,
      role: userRole,
      action_type: "STOCK_ADJUSTMENT",
      entity_type: "product_batch",
      entity_id: adjustment.batch_id,
      before_data: {
        product_name: adjustment.product_name,
        batch_number: adjustment.batch_number,
        quantity_on_hand: adjustment.current_quantity,
      },
      after_data: {
        quantity_on_hand: adjustment.adjusted_quantity,
        difference: adjustment.difference,
      },
      reason: `${adjustment.reason}${adjustment.notes ? ` (${adjustment.notes})` : ""}`,
      created_at: timestamp,
    };

    try {
      await supabase.from("audit_logs").insert([auditRecord]);
    } catch (err) {
      console.warn("[InventoryApi] Failed to write audit_log on remote:", err);
    }

    // 3. Update Dexie
    await offlineDb.transaction(
      "rw",
      [offlineDb.product_batches, offlineDb.audit_logs],
      async () => {
        await offlineDb.product_batches.update(adjustment.batch_id, {
          quantity_on_hand: adjustment.adjusted_quantity,
        });
        await offlineDb.audit_logs.put(auditRecord);
      }
    );

    // 4. Instantly notify POS catalog
    usePosStore.getState().loadCatalog(true).catch(console.error);
  },

  /**
   * Toggles clearance pricing for a near-expiry batch.
   */
  async markBatchClearance(
    batchId: string,
    isClearance: boolean,
    clearancePrice?: number
  ): Promise<void> {
    const updatePayload = {
      is_clearance: isClearance,
      clearance_price: isClearance && clearancePrice ? clearancePrice : null,
    };

    const { error } = await supabase
      .from("product_batches")
      .update(updatePayload)
      .eq("id", batchId);

    if (error) {
      throw new Error(`ອັບເດດສະຖານະລັອດບໍ່ສຳເລັດ: ${error.message}`);
    }

    await offlineDb.product_batches.update(batchId, {
      is_clearance: isClearance,
      clearance_price: clearancePrice,
    });

    usePosStore.getState().loadCatalog(true).catch(console.error);
  },
};
