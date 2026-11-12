// ============================================================================
// POS API Layer: 100% Real Supabase & Dexie Local-First Engine (NO MOCKS)
// ============================================================================

import { supabase } from "@/apis/supabase-client";
import {
  offlineDb,
  LocalOrder,
  LocalProduct,
  LocalProductUnit,
  LocalProductBatch,
  LocalCategory,
} from "@/apis/offline-db";
import { syncEngine } from "@/apis/sync-engine";
import { ProductWithDetails } from "../types/pos.types";

export interface CatalogLoadResult {
  products: ProductWithDetails[];
  categories: LocalCategory[];
  source: "supabase" | "offline-dexie";
  error?: string;
}

const DEFAULT_CATEGORY_ALL: LocalCategory = {
  id: "cat-all",
  store_id: "default-store",
  name_lo: "ທັງໝົດ",
  name_en: "All Categories",
  icon: "LayoutGrid",
  sort_order: 0,
};

export const posApi = {
  /**
   * Loads catalog directly from Supabase with automatic caching to Dexie.js (Offline-First).
   * Reads from local Dexie database if offline. Zero mock data.
   */
  async fetchCatalog(): Promise<CatalogLoadResult> {
    try {
      // 1. Attempt fetching live catalog from Supabase
      const [categoriesRes, productsRes] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("products")
          .select("*, product_units(*), product_batches(*)")
          .eq("is_active", true),
      ]);

      if (
        !categoriesRes.error &&
        !productsRes.error &&
        productsRes.data &&
        productsRes.data.length > 0
      ) {
        // Map Categories
        const remoteCategories: LocalCategory[] = (categoriesRes.data || []).map(
          (cat) => ({
            id: cat.id,
            store_id: cat.store_id,
            name_lo: cat.name_lo,
            name_en: cat.name_en,
            icon: cat.icon || "LayoutGrid",
            sort_order: cat.sort_order ?? 99,
            created_at: cat.created_at,
          })
        );

        const categories: LocalCategory[] = [
          DEFAULT_CATEGORY_ALL,
          ...remoteCategories,
        ];

        // Map Products with Units and FEFO Batches
        const products: ProductWithDetails[] = productsRes.data.map((raw) => {
          const units: LocalProductUnit[] = (raw.product_units || []).map((u: any) => ({
            id: u.id,
            product_id: u.product_id,
            unit_name: u.unit_name,
            conversion_rate: Number(u.conversion_rate) || 1,
            selling_price: Number(u.selling_price) || 0,
            barcode: u.barcode || raw.barcode,
            is_base_unit: Boolean(u.is_base_unit),
            created_at: u.created_at,
          }));

          const batches: LocalProductBatch[] = (raw.product_batches || []).map((b: any) => ({
            id: b.id,
            store_id: b.store_id,
            product_id: b.product_id,
            batch_number: b.batch_number,
            expiry_date: b.expiry_date,
            quantity_on_hand: Number(b.quantity_on_hand) || 0,
            cost_price: Number(b.cost_price) || 0,
            is_clearance: Boolean(b.is_clearance),
            clearance_price: b.clearance_price ? Number(b.clearance_price) : undefined,
            created_at: b.created_at,
          }));

          return {
            id: raw.id,
            store_id: raw.store_id,
            category_id: raw.category_id,
            barcode: raw.barcode,
            sku: raw.sku,
            name_lo: raw.name_lo,
            name_en: raw.name_en,
            base_unit: raw.base_unit || "ອັນ",
            cost_price: Number(raw.cost_price) || 0,
            selling_price: Number(raw.selling_price) || 0,
            is_perishable: Boolean(raw.is_perishable),
            warning_days_before_expiry: raw.warning_days_before_expiry || 30,
            is_weighing: Boolean(raw.is_weighing),
            image_url: raw.image_url || getFallbackImageUrl(raw.barcode, raw.name_lo),
            is_active: Boolean(raw.is_active),
            created_at: raw.created_at,
            updated_at: raw.updated_at,
            units,
            batches,
          };
        });

        // Background update local Dexie cache for offline resilience
        try {
          await offlineDb.transaction(
            "rw",
            [
              offlineDb.categories,
              offlineDb.products,
              offlineDb.product_units,
              offlineDb.product_batches,
            ],
            async () => {
              await offlineDb.categories.bulkPut(categories);
              await offlineDb.products.bulkPut(products);

              const allUnits = products.flatMap((p) => p.units);
              if (allUnits.length > 0) {
                await offlineDb.product_units.bulkPut(allUnits);
              }

              const allBatches = products.flatMap((p) => p.batches);
              if (allBatches.length > 0) {
                await offlineDb.product_batches.bulkPut(allBatches);
              }
            }
          );
        } catch (cacheErr) {
          console.warn("Failed to update Dexie local cache:", cacheErr);
        }

        return {
          products,
          categories,
          source: "supabase",
        };
      }
    } catch (err: any) {
      console.warn("Supabase fetch failed, falling back to local storage:", err?.message || err);
    }

    // 2. Fallback to Dexie IndexedDB (Local-First Offline)
    try {
      const localProducts = await offlineDb.products.toArray();
      const localCats = await offlineDb.categories.toArray();

      if (localProducts.length > 0) {
        const localUnits = await offlineDb.product_units.toArray();
        const localBatches = await offlineDb.product_batches.toArray();

        const assembled: ProductWithDetails[] = localProducts.map((p) => ({
          ...p,
          units: localUnits.filter((u) => u.product_id === p.id),
          batches: localBatches.filter((b) => b.product_id === p.id),
        }));

        const categories = localCats.length > 0 ? localCats : [DEFAULT_CATEGORY_ALL];

        return {
          products: assembled,
          categories,
          source: "offline-dexie",
        };
      }
    } catch (dexieErr) {
      console.warn("Dexie read failed:", dexieErr);
    }

    // 3. Database is empty (waiting for user to run seed.sql)
    return {
      products: [],
      categories: [DEFAULT_CATEGORY_ALL],
      source: "supabase",
    };
  },

  /**
   * Persists completed order into local Dexie store, deducts local FEFO batch stock,
   * invokes atomic FEFO RPC on Supabase (process_pos_order) if online,
   * or enqueues into background sync queue if offline.
   */
  async submitOrder(orderPayload: LocalOrder): Promise<void> {
    await offlineDb.orders.add(orderPayload);

    if (orderPayload.items && orderPayload.items.length > 0) {
      await offlineDb.order_items.bulkAdd(orderPayload.items);

      // Deduct FEFO batch stock in local Dexie database immediately
      for (const item of orderPayload.items) {
        if (item.batch_id) {
          try {
            const batch = await offlineDb.product_batches.get(item.batch_id);
            if (batch) {
              const deduction = (item.quantity || 1) * (item.conversion_rate || 1);
              const updatedQty = Math.max(0, batch.quantity_on_hand - deduction);
              await offlineDb.product_batches.update(item.batch_id, {
                quantity_on_hand: updatedQty,
              });
            }
          } catch (deductErr) {
            console.warn("Failed to deduct local batch stock:", deductErr);
          }
        }
      }
    }

    // Try atomic PostgreSQL RPC on Supabase for concurrency-safe FEFO stock deduction
    let rpcSucceeded = false;
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const { error: rpcErr } = await supabase.rpc("process_pos_order", {
          p_order: orderPayload,
        });

        if (!rpcErr) {
          rpcSucceeded = true;
        } else {
          console.warn("[PosApi] process_pos_order RPC warning:", rpcErr);
        }
      } catch (netErr) {
        console.warn("[PosApi] Network error executing process_pos_order RPC:", netErr);
      }
    }

    // If offline or RPC did not run, enqueue into background sync queue
    if (!rpcSucceeded) {
      await syncEngine.enqueue("order", orderPayload.id, "INSERT", orderPayload);
      if (typeof navigator !== "undefined" && navigator.onLine) {
        syncEngine.processQueue().catch(console.error);
      }
    }
  },

  /**
   * Fetches recent transactions for display in POS receipt reprint
   */
  async getRecentOrders(limit: number = 10): Promise<LocalOrder[]> {
    return await offlineDb.orders
      .orderBy("offline_created_at")
      .reverse()
      .limit(limit)
      .toArray();
  },
};

/**
 * Intelligent Image Resolver for Lao Minimart Products
 */
function getFallbackImageUrl(barcode?: string, name?: string): string {
  const b = (barcode || "").trim();
  const n = (name || "").toLowerCase();

  if (b === "8850029100018" || n.includes("beerlao") || n.includes("ເບຍລາວ")) {
    return "https://upload.wikimedia.org/wikipedia/commons/9/94/Beerlao_lager.jpg";
  }
  if (b === "8850029100025" || n.includes("tigerhead") || n.includes("ຫົວເສືອ")) {
    return "https://www.beerlao.la/media/r5cflnvf/tgh-600ml.png";
  }
  if (b === "8850029100032" || n.includes("lactasoy") || n.includes("ແລັກຕາຊອຍ")) {
    return "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80";
  }
  if (b === "8850029100049" || n.includes("red bull") || n.includes("ກະທິງແດງ")) {
    return "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=400&q=80";
  }
  if (b === "8850029100056" || n.includes("mama") || n.includes("ມາມ່າ")) {
    return "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80";
  }
  if (b === "8850029100063" || n.includes("dao") || n.includes("ດາວ")) {
    return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80";
  }
  if (b === "00105" || n.includes("ເຂົ້າໜຽວ") || n.includes("rice")) {
    return "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80";
  }
  if (b === "00108" || n.includes("ກ້ວຍ") || n.includes("banana")) {
    return "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80";
  }
  if (b === "QUICK_ICE" || n.includes("ນ້ຳກ້ອນ") || n.includes("ice")) {
    return "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80";
  }
  if (b === "QUICK_BAG" || n.includes("ຖົງ") || n.includes("bag")) {
    return "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80";
  }

  return "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80";
}
