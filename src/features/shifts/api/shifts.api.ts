// ============================================================================
// Shifts API: Real Supabase CRUD, Blind Cash Reconciliation & Dexie Offline Sync
// ============================================================================

import { supabase } from "@/apis/supabase-client";
import { offlineDb, LocalShift, LocalAuditLog } from "@/apis/offline-db";
import { DEFAULT_STORE, DEFAULT_CASHIER } from "@/features/pos/constants/pos.constants";
import { useAuthStore } from "@/features/auth";
import {
  ShiftItem,
  CloseShiftBlindInput,
  ShiftClosingSummary,
} from "../types/shift.types";
import {
  calculateDenominationsTotal,
  calculateDiscrepancy,
} from "../utils/shift.util";

export const shiftsApi = {
  /**
   * Fetches the current active shift (status = 'open') for this cashier/store.
   * Also computes real-time sales metrics for orders in this shift.
   */
  async getActiveShift(): Promise<ShiftItem | null> {
    try {
      // 1. Try Supabase
      const { data: shiftData, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("store_id", DEFAULT_STORE.id)
        .eq("status", "open")
        .order("opening_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("[ShiftsApi] Supabase getActiveShift error, falling back to Dexie:", error.message);
        return this.getActiveShiftFromDexie();
      }

      if (!shiftData) return null;

      // 2. Compute sales totals for this shift
      const { data: ordersData } = await supabase
        .from("orders")
        .select("payment_method, final_total, status")
        .eq("shift_id", shiftData.id)
        .eq("status", "completed");

      let cashSales = 0;
      let transferSales = 0;
      let orderCount = 0;

      if (ordersData) {
        orderCount = ordersData.length;
        for (const o of ordersData) {
          if (o.payment_method === "cash") {
            cashSales += Number(o.final_total) || 0;
          } else if (o.payment_method === "transfer") {
            transferSales += Number(o.final_total) || 0;
          }
        }
      }

      const currentUser = useAuthStore.getState().user;

      const activeShift: ShiftItem = {
        id: shiftData.id,
        store_id: shiftData.store_id,
        user_id: shiftData.user_id,
        cashier_name: currentUser?.full_name_lo || DEFAULT_CASHIER.name,
        opening_time: shiftData.opening_time,
        closing_time: shiftData.closing_time,
        opening_cash: Number(shiftData.opening_cash) || 0,
        expected_closing_cash: shiftData.expected_closing_cash ? Number(shiftData.expected_closing_cash) : null,
        actual_closing_cash: shiftData.actual_closing_cash ? Number(shiftData.actual_closing_cash) : null,
        discrepancy: shiftData.discrepancy ? Number(shiftData.discrepancy) : null,
        status: shiftData.status,
        notes: shiftData.notes,
        created_at: shiftData.created_at,
        total_cash_sales: cashSales,
        total_transfer_sales: transferSales,
        total_orders_count: orderCount,
      };

      // Cache to Dexie
      await offlineDb.shifts.put({
        id: activeShift.id,
        store_id: activeShift.store_id,
        user_id: activeShift.user_id,
        opening_time: activeShift.opening_time,
        closing_time: activeShift.closing_time || undefined,
        opening_cash: activeShift.opening_cash,
        status: "open",
        created_at: activeShift.created_at || new Date().toISOString(),
      });

      return activeShift;
    } catch (err) {
      console.error("[ShiftsApi] getActiveShift failed:", err);
      return this.getActiveShiftFromDexie();
    }
  },

  async getActiveShiftFromDexie(): Promise<ShiftItem | null> {
    const local = await offlineDb.shifts
      .where("status")
      .equals("open")
      .reverse()
      .first();

    if (!local) return null;

    // Read orders from Dexie
    const localOrders = await offlineDb.orders
      .where("shift_id")
      .equals(local.id)
      .toArray();

    const completed = localOrders.filter((o) => o.status === "completed");
    const cashSales = completed
      .filter((o) => o.payment_method === "cash")
      .reduce((sum, o) => sum + (o.final_total || 0), 0);
    const transferSales = completed
      .filter((o) => (o.payment_method as string) === "transfer" || o.payment_method === "lao_qr")
      .reduce((sum, o) => sum + (o.final_total || 0), 0);

    return {
      ...local,
      cashier_name: DEFAULT_CASHIER.name,
      total_cash_sales: cashSales,
      total_transfer_sales: transferSales,
      total_orders_count: completed.length,
    };
  },

  /**
   * Opens a new shift with the given starting cash float.
   * Ensures STRICTLY only 1 shift can be active/open at any time.
   */
  async openShift(openingCash: number, notes?: string): Promise<ShiftItem> {
    // 0. Ensure no open shift exists
    const existingActive = await this.getActiveShift();
    if (existingActive) {
      throw new Error(
        "ມີກະຂາຍເຄື່ອງກຳລັງເປີດຢູ່ແລ້ວ (" +
          new Date(existingActive.opening_time).toLocaleTimeString() +
          "). ກະລຸນາປິດກະເກົ່າກ່ອນເປີດກະໃໝ່."
      );
    }

    const shiftId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const currentUser = useAuthStore.getState().user;
    const storeId = currentUser?.store_id || DEFAULT_STORE.id;
    const userId = currentUser?.id || DEFAULT_CASHIER.id;
    const userRole = currentUser?.role || "cashier";

    const payload: LocalShift = {
      id: shiftId,
      store_id: storeId,
      user_id: userId,
      opening_time: timestamp,
      opening_cash: Number(openingCash) || 0,
      status: "open",
      notes: notes?.trim() || undefined,
      created_at: timestamp,
    };

    // 1. Insert into Supabase
    try {
      const { error: insertErr } = await supabase
        .from("shifts")
        .insert([payload]);

      if (insertErr) {
        console.warn("[ShiftsApi] Supabase open shift warning (RLS/Network):", insertErr.message);
      }
    } catch (e: any) {
      console.warn("[ShiftsApi] Supabase open shift exception:", e?.message);
    }

    // 2. Audit log
    const auditRecord: LocalAuditLog = {
      id: crypto.randomUUID(),
      store_id: storeId,
      user_id: userId,
      role: userRole,
      action_type: "OPEN_SHIFT",
      entity_type: "shift",
      entity_id: shiftId,
      after_data: { opening_cash: openingCash, notes },
      reason: "ເປີດກະຂາຍເຄື່ອງໃໝ່",
      created_at: timestamp,
    };

    try {
      await supabase.from("audit_logs").insert([auditRecord]);
    } catch (err) {
      console.warn("[ShiftsApi] Failed to record open shift audit log:", err);
    }

    // 3. Sync to Dexie
    await offlineDb.transaction(
      "rw",
      [offlineDb.shifts, offlineDb.audit_logs],
      async () => {
        await offlineDb.shifts.put(payload);
        await offlineDb.audit_logs.put(auditRecord);
      }
    );

    return {
      ...payload,
      cashier_name: DEFAULT_CASHIER.name,
      total_cash_sales: 0,
      total_transfer_sales: 0,
      total_orders_count: 0,
    };
  },

  /**
   * Performs Blind Close:
   * 1. Multiplies actual physical denomination counts.
   * 2. Queries system orders for total cash/transfer sales.
   * 3. Calculates expected closing cash & discrepancy.
   * 4. Updates shift to 'closed' and writes audit log.
   */
  async closeShiftBlind(input: CloseShiftBlindInput): Promise<ShiftClosingSummary> {
    const timestamp = new Date().toISOString();
    const actualCash =
      typeof input.actual_cash_entered === "number" && input.actual_cash_entered >= 0
        ? input.actual_cash_entered
        : calculateDenominationsTotal(input.counts);

    // 1. Read shift details
    const { data: shiftData, error: fetchErr } = await supabase
      .from("shifts")
      .select("*")
      .eq("id", input.shift_id)
      .single();

    if (fetchErr || !shiftData) {
      throw new Error(`ບໍ່ພົບຂໍ້ມູນກະທີ່ຕ້ອງການປິດ: ${fetchErr?.message || ""}`);
    }

    const openingCash = Number(shiftData.opening_cash) || 0;

    // 2. Query completed orders in this shift to calculate expected cash
    const { data: ordersData } = await supabase
      .from("orders")
      .select("payment_method, final_total, status")
      .eq("shift_id", input.shift_id)
      .eq("status", "completed");

    let cashSales = 0;
    let transferSales = 0;
    let orderCount = 0;

    if (ordersData) {
      orderCount = ordersData.length;
      for (const o of ordersData) {
        if (o.payment_method === "cash") {
          cashSales += Number(o.final_total) || 0;
        } else if (o.payment_method === "transfer") {
          transferSales += Number(o.final_total) || 0;
        }
      }
    }

    const expectedCash = openingCash + cashSales;
    const discrepancy = calculateDiscrepancy(actualCash, expectedCash);

    // 3. Update Supabase shift record
    const updatePayload = {
      closing_time: timestamp,
      expected_closing_cash: expectedCash,
      actual_closing_cash: actualCash,
      discrepancy: discrepancy,
      status: "closed",
      notes: input.notes?.trim() || null,
    };

    try {
      const { error: updateErr } = await supabase
        .from("shifts")
        .update(updatePayload)
        .eq("id", input.shift_id);

      if (updateErr) {
        console.warn("[ShiftsApi] Supabase close shift warning (RLS/Network):", updateErr.message);
      }
    } catch (e: any) {
      console.warn("[ShiftsApi] Supabase close shift exception:", e?.message);
    }

    // 4. Record Audit Log with full denomination breakdown
    const auditRecord: LocalAuditLog = {
      id: crypto.randomUUID(),
      store_id: DEFAULT_STORE.id,
      user_id: DEFAULT_CASHIER.id,
      role: "cashier",
      action_type: "CLOSE_SHIFT",
      entity_type: "shift",
      entity_id: input.shift_id,
      before_data: {
        opening_cash: openingCash,
        expected_cash: expectedCash,
        cash_sales: cashSales,
      },
      after_data: {
        actual_cash: actualCash,
        discrepancy: discrepancy,
        denomination_counts: input.counts,
        transfer_sales_entered: input.transfer_sales_entered,
      },
      reason: `ປິດກະຂາຍເຄື່ອງ (Blind Close) - ສ່ວນຕ່າງ: ${discrepancy.toLocaleString()} ₭`,
      created_at: timestamp,
    };

    try {
      await supabase.from("audit_logs").insert([auditRecord]);
    } catch (err) {
      console.warn("[ShiftsApi] Failed to write close shift audit log:", err);
    }

    // 5. Update Dexie
    await offlineDb.transaction(
      "rw",
      [offlineDb.shifts, offlineDb.audit_logs],
      async () => {
        await offlineDb.shifts.update(input.shift_id, {
          closing_time: timestamp,
          expected_closing_cash: expectedCash,
          actual_closing_cash: actualCash,
          discrepancy: discrepancy,
          status: "closed",
          notes: input.notes?.trim(),
        });
        await offlineDb.audit_logs.put(auditRecord);
      }
    );

    const updatedShift: ShiftItem = {
      id: shiftData.id,
      store_id: shiftData.store_id,
      user_id: shiftData.user_id,
      cashier_name: DEFAULT_CASHIER.name,
      opening_time: shiftData.opening_time,
      closing_time: timestamp,
      opening_cash: openingCash,
      expected_closing_cash: expectedCash,
      actual_closing_cash: actualCash,
      discrepancy: discrepancy,
      status: "closed",
      notes: input.notes,
      total_cash_sales: cashSales,
      total_transfer_sales: transferSales,
      total_orders_count: orderCount,
    };

    return {
      shift: updatedShift,
      opening_cash: openingCash,
      cash_sales: cashSales,
      transfer_sales: transferSales,
      expected_cash: expectedCash,
      actual_cash: actualCash,
      discrepancy: discrepancy,
      order_count: orderCount,
      counts: input.counts,
      closed_at: timestamp,
    };
  },

  /**
   * Fetches full shift history.
   */
  async fetchShiftHistory(): Promise<ShiftItem[]> {
    try {
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .order("opening_time", { ascending: false });

      if (error) {
        console.warn("[ShiftsApi] fetchShiftHistory error, falling back to Dexie:", error.message);
        return this.fetchShiftHistoryFromDexie();
      }

      return (data || []).map((s) => ({
        id: s.id,
        store_id: s.store_id,
        user_id: s.user_id,
        cashier_name: DEFAULT_CASHIER.name,
        opening_time: s.opening_time,
        closing_time: s.closing_time,
        opening_cash: Number(s.opening_cash) || 0,
        expected_closing_cash: s.expected_closing_cash ? Number(s.expected_closing_cash) : null,
        actual_closing_cash: s.actual_closing_cash ? Number(s.actual_closing_cash) : null,
        discrepancy: s.discrepancy ? Number(s.discrepancy) : null,
        status: s.status,
        notes: s.notes,
        created_at: s.created_at,
      }));
    } catch (err) {
      console.error("[ShiftsApi] fetchShiftHistory failed:", err);
      return this.fetchShiftHistoryFromDexie();
    }
  },

  async fetchShiftHistoryFromDexie(): Promise<ShiftItem[]> {
    const list = await offlineDb.shifts.toArray();
    return list
      .map((s) => ({
        ...s,
        cashier_name: DEFAULT_CASHIER.name,
      }))
      .sort(
        (a, b) =>
          new Date(b.opening_time).getTime() - new Date(a.opening_time).getTime()
      );
  },

  /**
   * Forces close an abandoned/stranded open shift from the history table.
   */
  async forceCloseAbandonedShift(shiftId: string, notes?: string): Promise<void> {
    const timestamp = new Date().toISOString();

    // Fetch shift to calculate expected cash
    let openingCash = 0;
    let cashSales = 0;
    try {
      const { data: shiftData } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", shiftId)
        .maybeSingle();

      if (shiftData) {
        openingCash = Number(shiftData.opening_cash) || 0;
        const { data: ordersData } = await supabase
          .from("orders")
          .select("payment_method, final_total, status")
          .eq("shift_id", shiftId)
          .eq("status", "completed");

        if (ordersData) {
          for (const o of ordersData) {
            if (o.payment_method === "cash") {
              cashSales += Number(o.final_total) || 0;
            }
          }
        }
      }
    } catch {}

    const expectedCash = openingCash + cashSales;
    const updatePayload = {
      closing_time: timestamp,
      expected_closing_cash: expectedCash,
      actual_closing_cash: expectedCash,
      discrepancy: 0,
      status: "closed" as const,
      notes: notes?.trim() || "ປິດກະຄ້າງ (Abandoned Shift Force Closed)",
    };

    try {
      await supabase.from("shifts").update(updatePayload).eq("id", shiftId);
    } catch (err) {
      console.warn("[ShiftsApi] forceCloseAbandonedShift Supabase error:", err);
    }

    try {
      await offlineDb.shifts.update(shiftId, updatePayload as any);
    } catch (err) {
      console.warn("[ShiftsApi] forceCloseAbandonedShift Dexie error:", err);
    }
  },
};
