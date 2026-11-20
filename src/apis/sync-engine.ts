// ============================================================================
// Sync Engine: Local-First Offline Sync Queue for Minimart POS
// Zero Emojis - Enterprise Reliability & Concurrency Safe
// ============================================================================

import { offlineDb, type LocalSyncQueueItem } from "./offline-db";
import { supabase } from "./supabase-client";
import { toast } from "sonner";

type SyncStateListener = (state: { isOnline: boolean; pendingCount: number }) => void;

class SyncEngine {
  private isOnline: boolean = typeof window !== "undefined" ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private listeners: Set<SyncStateListener> = new Set();
  private intervalId: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));

      // Periodic background sync check every 15 seconds
      this.intervalId = setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.processQueue();
        }
      }, 15000);
    }
  }

  private handleNetworkChange(online: boolean) {
    const wasOffline = !this.isOnline;
    this.isOnline = online;
    this.notifyListeners();

    if (typeof window !== "undefined") {
      if (!online) {
        toast.warning(
          "ຂາດການເຊື່ອມຕໍ່ອິນເຕີເນັດ (Offline): ທ່ານຍັງສາມາດຂາຍເງິນສົດ ແລະ ພິມບິນໄດ້ປົກກະຕິ",
          { id: "network-status", duration: 5000 }
        );
      } else if (wasOffline) {
        toast.info(
          "ເຊື່ອມຕໍ່ອິນເຕີເນັດແລ້ວ: ກຳລັງເລີ່ມຊິ້ງຂໍ້ມູນບິນອອບລາຍ...",
          { id: "network-status", duration: 4000 }
        );
        this.processQueue();
      }
    }
  }

  public subscribe(listener: SyncStateListener) {
    this.listeners.add(listener);
    this.getPendingCount().then((count) => {
      listener({ isOnline: this.isOnline, pendingCount: count });
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async notifyListeners() {
    const pendingCount = await this.getPendingCount();
    for (const listener of this.listeners) {
      listener({ isOnline: this.isOnline, pendingCount });
    }
  }

  public async getPendingCount(): Promise<number> {
    try {
      return await offlineDb.sync_queue
        .where("status")
        .equals("pending")
        .count();
    } catch {
      return 0;
    }
  }

  public async enqueue(
    entity_type: "order" | "shift" | "audit_log",
    entity_id: string,
    action: "INSERT" | "UPDATE",
    payload: Record<string, any>
  ): Promise<number | undefined> {
    const id = await offlineDb.sync_queue.add({
      entity_type,
      entity_id,
      action,
      payload,
      status: "pending",
      retry_count: 0,
      created_at: new Date().toISOString(),
    });

    this.notifyListeners();

    if (this.isOnline && !this.isSyncing) {
      this.processQueue();
    }

    return id;
  }

  public async processQueue() {
    if (this.isSyncing || !this.isOnline) return;
    this.isSyncing = true;
    let syncedCount = 0;

    try {
      const pendingItems = await offlineDb.sync_queue
        .where("status")
        .equals("pending")
        .limit(20)
        .toArray();

      if (pendingItems.length === 0) return;

      for (const item of pendingItems) {
        if (!item.id) continue;

        try {
          if (
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
            !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
          ) {
            if (item.entity_type === "order") {
              // 1. Attempt atomic PostgreSQL FEFO RPC
              const { error: rpcErr } = await supabase.rpc("process_pos_order", {
                p_order: item.payload,
              });

              if (rpcErr) {
                console.warn(
                  "[SyncEngine] process_pos_order RPC failed, performing table-level fallback:",
                  rpcErr.message
                );

                // Fallback: Strip non-table properties (items, cashier_name) before upserting into public.orders
                const { items, cashier_name, ...orderRow } = item.payload;
                const { error: upsertErr } = await supabase.from("orders").upsert({
                  id: orderRow.id,
                  store_id: orderRow.store_id,
                  shift_id: orderRow.shift_id || null,
                  cashier_id: orderRow.cashier_id,
                  order_number: orderRow.order_number,
                  subtotal: orderRow.subtotal,
                  discount_amount: orderRow.discount_amount || 0,
                  vat_amount: orderRow.vat_amount || 0,
                  final_total: orderRow.final_total,
                  payment_method: orderRow.payment_method || "cash",
                  cash_tendered: orderRow.cash_tendered || 0,
                  change_amount: orderRow.change_amount || 0,
                  status: orderRow.status || "completed",
                  offline_created_at: orderRow.offline_created_at || new Date().toISOString(),
                  client_synced_at: new Date().toISOString(),
                  notes: orderRow.notes || null,
                });

                if (upsertErr) throw upsertErr;

                // Insert order items if present
                if (Array.isArray(items) && items.length > 0) {
                  const cleanItems = items.map((it: any) => ({
                    id: it.id,
                    order_id: it.order_id || orderRow.id,
                    product_id: it.product_id,
                    batch_id: it.batch_id || null,
                    unit_name: it.unit_name || "unit",
                    conversion_rate: it.conversion_rate || 1,
                    unit_price: it.unit_price || 0,
                    quantity: it.quantity || 1,
                    subtotal_price: it.subtotal_price || 0,
                    discount_amount: it.discount_amount || 0,
                    total_price: it.total_price || 0,
                  }));

                  const { error: itemsErr } = await supabase
                    .from("order_items")
                    .upsert(cleanItems);
                  if (itemsErr) throw itemsErr;
                }
              }

              // Mark as synced in local Dexie database
              await offlineDb.orders.update(item.entity_id, {
                client_synced_at: new Date().toISOString(),
              });
            } else if (item.entity_type === "shift") {
              const { error } = await supabase.from("shifts").upsert(item.payload);
              if (error) throw error;
            } else if (item.entity_type === "audit_log") {
              const { error } = await supabase.from("audit_logs").upsert(item.payload);
              if (error) throw error;
            }
          }

          // Mark queue item as synced
          await offlineDb.sync_queue.update(item.id, {
            status: "synced",
          });
          syncedCount++;
        } catch (err: any) {
          const nextRetry = item.retry_count + 1;
          await offlineDb.sync_queue.update(item.id, {
            retry_count: nextRetry,
            error_message: err?.message || "Sync failed",
            status: nextRetry >= 5 ? "failed" : "pending",
          });
        }
      }

      if (syncedCount > 0 && typeof window !== "undefined") {
        toast.success(`ຊິ້ງຂໍ້ມູນບິນອອບລາຍສຳເລັດແລ້ວ (${syncedCount} ບິນ)`, {
          id: "sync-success",
          duration: 4000,
        });
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  public async forceSync(): Promise<void> {
    if (typeof window !== "undefined" && !navigator.onLine) {
      toast.warning("ອຸປະກອນຍັງບໍ່ມີອິນເຕີເນັດ, ບໍ່ສາມາດຊິ້ງໄດ້ໃນຕອນນີ້", {
        duration: 3000,
      });
      return;
    }
    await this.processQueue();
  }

  public getStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }
}

export const syncEngine = new SyncEngine();
