// ============================================================================
// Sync Engine: Local-First Offline Sync Queue for Minimart POS
// ============================================================================

import { offlineDb, type LocalSyncQueueItem } from "./offline-db";
import { supabase } from "./supabase-client";

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
      this.intervalId = setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.processQueue();
        }
      }, 15000);
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notifyListeners();
    if (online) {
      this.processQueue();
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

  private async notifyListeners() {
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

    try {
      const pendingItems = await offlineDb.sync_queue
        .where("status")
        .equals("pending")
        .limit(20)
        .toArray();

      for (const item of pendingItems) {
        if (!item.id) continue;

        try {
          if (
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
            !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
          ) {
            if (item.entity_type === "order") {
              const { error: rpcErr } = await supabase.rpc("process_pos_order", {
                p_order: item.payload,
              });
              if (rpcErr) {
                const { error: upsertErr } = await supabase.from("orders").upsert(item.payload);
                if (upsertErr) throw upsertErr;
              }
            } else {
              const tableMap: Record<string, string> = {
                shift: "shifts",
                audit_log: "audit_logs",
              };

              const tableName = tableMap[item.entity_type];
              if (tableName) {
                const { error } = await supabase.from(tableName).upsert(item.payload);
                if (error) throw error;
              }
            }
          }

          await offlineDb.sync_queue.update(item.id, {
            status: "synced",
          });
        } catch (err: any) {
          const nextRetry = item.retry_count + 1;
          await offlineDb.sync_queue.update(item.id, {
            retry_count: nextRetry,
            error_message: err?.message || "Sync failed",
            status: nextRetry >= 5 ? "failed" : "pending",
          });
        }
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  public getStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }
}

export const syncEngine = new SyncEngine();

