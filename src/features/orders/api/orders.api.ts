// ============================================================================
// Orders API: Real Supabase CRUD, Batch Stock Restoral & Dexie Sync
// ============================================================================

import { supabase } from "@/apis/supabase-client";
import {
  offlineDb,
  LocalOrder,
  LocalOrderItem,
  LocalAuditLog,
} from "@/apis/offline-db";
import { DEFAULT_STORE, DEFAULT_CASHIER } from "@/features/pos/constants/pos.constants";
import { useAuthStore } from "@/features/auth";
import {
  OrderRecord,
  OrderItemRecord,
  VoidOrderInput,
  OrderPaymentMethod,
} from "../types/order.types";
import { DEFAULT_MANAGER_PIN } from "../constants/order.constants";
import { usePosStore } from "@/features/pos/stores/pos.store";

export const ordersApi = {
  /**
   * Fetches past orders with their items from Supabase.
   * Caches to Dexie for offline search.
   */
  async fetchOrders(): Promise<OrderRecord[]> {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("offline_created_at", { ascending: false })
          .limit(200),
        supabase.from("products").select("id, name_lo, image_url"),
      ]);

      if (ordersRes.error) {
        console.warn("[OrdersApi] Supabase orders error, falling back to Dexie:", ordersRes.error.message);
        return this.fetchOrdersFromDexie();
      }

      const prodMap = new Map<string, { name_lo: string; image_url?: string }>();
      if (productsRes.data) {
        for (const p of productsRes.data) {
          prodMap.set(p.id, { name_lo: p.name_lo, image_url: p.image_url });
        }
      }

      const allOrdersForDexie: LocalOrder[] = [];
      const allItemsForDexie: LocalOrderItem[] = [];

      const records: OrderRecord[] = (ordersRes.data || []).map((raw) => {
        const rawItems = (raw.order_items || []) as any[];
        const items: OrderItemRecord[] = rawItems.map((item) => {
          const prodInfo = prodMap.get(item.product_id);
          const itemRecord: OrderItemRecord = {
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            product_name: item.product_name || prodInfo?.name_lo || "ສິນຄ້າ",
            product_image: prodInfo?.image_url,
            batch_id: item.batch_id,
            unit_name: item.unit_name,
            conversion_rate: Number(item.conversion_rate) || 1,
            unit_price: Number(item.unit_price) || 0,
            quantity: Number(item.quantity) || 0,
            subtotal_price: Number(item.subtotal_price) || 0,
            discount_amount: Number(item.discount_amount) || 0,
            total_price: Number(item.total_price) || 0,
          };

          allItemsForDexie.push({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            batch_id: item.batch_id || undefined,
            product_name: itemRecord.product_name || "ສິນຄ້າ",
            unit_name: item.unit_name,
            conversion_rate: itemRecord.conversion_rate,
            unit_price: itemRecord.unit_price,
            quantity: itemRecord.quantity,
            subtotal_price: itemRecord.subtotal_price,
            discount_amount: itemRecord.discount_amount,
            total_price: itemRecord.total_price,
          });

          return itemRecord;
        });

        const orderRecord: OrderRecord = {
          id: raw.id,
          store_id: raw.store_id || DEFAULT_STORE.id,
          shift_id: raw.shift_id,
          cashier_id: raw.cashier_id,
          cashier_name: DEFAULT_CASHIER.name,
          order_number: raw.order_number,
          subtotal: Number(raw.subtotal) || 0,
          discount_amount: Number(raw.discount_amount) || 0,
          vat_amount: Number(raw.vat_amount) || 0,
          final_total: Number(raw.final_total) || 0,
          payment_method: raw.payment_method,
          cash_tendered: Number(raw.cash_tendered) || 0,
          change_amount: Number(raw.change_amount) || 0,
          status: raw.status,
          offline_created_at: raw.offline_created_at,
          client_synced_at: raw.client_synced_at,
          notes: raw.notes,
          items,
        };

        allOrdersForDexie.push({
          id: orderRecord.id,
          store_id: orderRecord.store_id,
          shift_id: orderRecord.shift_id || undefined,
          cashier_id: orderRecord.cashier_id,
          cashier_name: orderRecord.cashier_name || DEFAULT_CASHIER.name,
          order_number: orderRecord.order_number,
          subtotal: orderRecord.subtotal,
          discount_amount: orderRecord.discount_amount,
          vat_amount: orderRecord.vat_amount,
          final_total: orderRecord.final_total,
          payment_method: (orderRecord.payment_method as any) === "transfer" ? "lao_qr" : (orderRecord.payment_method as any),
          cash_tendered: orderRecord.cash_tendered,
          change_amount: orderRecord.change_amount,
          status: orderRecord.status,
          offline_created_at: orderRecord.offline_created_at,
          client_synced_at: orderRecord.client_synced_at,
          notes: orderRecord.notes || undefined,
        });

        return orderRecord;
      });

      // Cache to Dexie
      if (allOrdersForDexie.length > 0) {
        offlineDb.transaction(
          "rw",
          [offlineDb.orders, offlineDb.order_items],
          async () => {
            await offlineDb.orders.bulkPut(allOrdersForDexie);
            if (allItemsForDexie.length > 0) {
              await offlineDb.order_items.bulkPut(allItemsForDexie);
            }
          }
        ).catch(console.error);
      }

      return records;
    } catch (err) {
      console.error("[OrdersApi] fetchOrders failed:", err);
      return this.fetchOrdersFromDexie();
    }
  },

  /**
   * Reads past orders from Dexie local database.
   */
  async fetchOrdersFromDexie(): Promise<OrderRecord[]> {
    const [localOrders, localItems, localProds] = await Promise.all([
      offlineDb.orders.toArray(),
      offlineDb.order_items.toArray(),
      offlineDb.products.toArray(),
    ]);

    const prodMap = new Map<string, { name_lo: string; image_url?: string }>();
    for (const p of localProds) {
      prodMap.set(p.id, { name_lo: p.name_lo, image_url: p.image_url });
    }

    return localOrders
      .map((raw) => {
        const items = localItems
          .filter((i) => i.order_id === raw.id)
          .map((i) => {
            const prodInfo = prodMap.get(i.product_id);
            return {
              id: i.id,
              order_id: i.order_id,
              product_id: i.product_id,
              product_name: i.product_name || prodInfo?.name_lo || "ສິນຄ້າ",
              product_image: prodInfo?.image_url,
              batch_id: i.batch_id,
              unit_name: i.unit_name,
              conversion_rate: i.conversion_rate,
              unit_price: i.unit_price,
              quantity: i.quantity,
              subtotal_price: i.subtotal_price,
              discount_amount: i.discount_amount,
              total_price: i.total_price,
            };
          });

        return {
          id: raw.id,
          store_id: raw.store_id,
          shift_id: raw.shift_id,
          cashier_id: raw.cashier_id,
          cashier_name: raw.cashier_name,
          order_number: raw.order_number,
          subtotal: raw.subtotal,
          discount_amount: raw.discount_amount,
          vat_amount: raw.vat_amount,
          final_total: raw.final_total,
          payment_method: ((raw.payment_method as any) === "lao_qr" ? "transfer" : raw.payment_method) as OrderPaymentMethod,
          cash_tendered: raw.cash_tendered,
          change_amount: raw.change_amount,
          status: raw.status,
          offline_created_at: raw.offline_created_at,
          client_synced_at: raw.client_synced_at,
          notes: raw.notes,
          items,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.offline_created_at).getTime() -
          new Date(a.offline_created_at).getTime()
      );
  },

  /**
   * Voids an order with Manager PIN:
   * 1. Updates order status to 'cancelled'.
   * 2. Restores inventory quantity in product_batches.
   * 3. Writes Audit Log.
   * 4. Updates Dexie and notifies POS terminal.
   */
  async voidOrder(input: VoidOrderInput): Promise<void> {
    // 1. PIN Check
    if (input.manager_pin !== DEFAULT_MANAGER_PIN) {
      throw new Error("ລະຫັດ PIN ຜູ້ຈັດການບໍ່ຖືກຕ້ອງ! ບໍ່ສາມາດຍົກເລີກບິນໄດ້.");
    }

    const timestamp = new Date().toISOString();

    // 2. Fetch order items to restore stock
    const { data: orderData, error: fetchErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", input.order_id)
      .single();

    if (fetchErr || !orderData) {
      throw new Error(`ບໍ່ພົບຂໍ້ມູນບິນທີ່ຕ້ອງການຍົກເລີກ: ${fetchErr?.message || ""}`);
    }

    if (orderData.status === "cancelled") {
      throw new Error("ບິນນີ້ຖືກຍົກເລີກໄປກ່ອນໜ້ານີ້ແລ້ວ");
    }

    // 3. Mark order as cancelled
    const updatedNotes = orderData.notes
      ? `${orderData.notes}\n[ຍົກເລີກບິນ]: ${input.reason}`
      : `[ຍົກເລີກບິນ]: ${input.reason}`;

    const { error: cancelErr } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        notes: updatedNotes,
      })
      .eq("id", input.order_id);

    if (cancelErr) {
      throw new Error(`ອັບເດດສະຖານະບິນບໍ່ສຳເລັດ: ${cancelErr.message}`);
    }

    // 4. Restore batch inventory
    const orderItems = (orderData.order_items || []) as any[];
    for (const item of orderItems) {
      if (item.batch_id) {
        const qtyToRestore =
          (Number(item.quantity) || 1) * (Number(item.conversion_rate) || 1);

        // Fetch current batch stock
        const { data: batchData } = await supabase
          .from("product_batches")
          .select("quantity_on_hand")
          .eq("id", item.batch_id)
          .single();

        if (batchData) {
          const newQty = (Number(batchData.quantity_on_hand) || 0) + qtyToRestore;
          await supabase
            .from("product_batches")
            .update({ quantity_on_hand: newQty })
            .eq("id", item.batch_id);

          await offlineDb.product_batches.update(item.batch_id, {
            quantity_on_hand: newQty,
          });
        }
      }
    }

    // 5. Audit Log
    const currentUser = useAuthStore.getState().user;
    const auditRecord: LocalAuditLog = {
      id: crypto.randomUUID(),
      store_id: currentUser?.store_id || DEFAULT_STORE.id,
      user_id: currentUser?.id || DEFAULT_CASHIER.id,
      role: currentUser?.role || "store_manager",
      action_type: "VOID_ORDER",
      entity_type: "order",
      entity_id: input.order_id,
      before_data: {
        order_number: orderData.order_number,
        total: orderData.final_total,
        status: orderData.status,
      },
      after_data: {
        status: "cancelled",
        reason: input.reason,
        notes: input.notes,
        manager_verified: true,
      },
      reason: `ຍົກເລີກບິນ #${orderData.order_number}: ${input.reason}`,
      created_at: timestamp,
    };

    try {
      await supabase.from("audit_logs").insert([auditRecord]);
    } catch (err) {
      console.warn("[OrdersApi] Failed to write void audit log:", err);
    }

    // 6. Update Dexie
    await offlineDb.transaction(
      "rw",
      [offlineDb.orders, offlineDb.audit_logs],
      async () => {
        await offlineDb.orders.update(input.order_id, {
          status: "cancelled",
          notes: updatedNotes,
        });
        await offlineDb.audit_logs.put(auditRecord);
      }
    );

    // 7. Notify POS Terminal
    usePosStore.getState().loadCatalog(true).catch(console.error);
  },
};
