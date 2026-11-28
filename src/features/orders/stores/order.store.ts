// ============================================================================
// Order Store: State Management for Order Filters, Details & Void Modal
// ============================================================================

import { create } from "zustand";
import { OrderRecord, OrdersFilter } from "../types/order.types";
import { ordersApi } from "../api/orders.api";

interface OrderState {
  orders: OrderRecord[];
  isLoading: boolean;
  lastFetchedAt: number;
  filters: OrdersFilter;

  selectedOrderForDetail: OrderRecord | null;
  orderForVoid: OrderRecord | null;
  orderForReprint: OrderRecord | null;

  // Actions
  loadOrders: (forceRefresh?: boolean) => Promise<void>;
  setDateRange: (range: "today" | "week" | "month" | "all") => void;
  setPaymentMethod: (method: "all" | "cash" | "transfer" | "lao_qr") => void;
  setStatus: (status: "all" | "completed" | "cancelled") => void;
  setSearchTerm: (term: string) => void;
  setShiftId: (shiftId?: string) => void;

  openDetail: (order: OrderRecord) => void;
  closeDetail: () => void;

  openVoidDialog: (order: OrderRecord) => void;
  closeVoidDialog: () => void;

  setReprintOrder: (order: OrderRecord | null) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  lastFetchedAt: 0,
  filters: {
    dateRange: "today",
    paymentMethod: "all",
    status: "all",
    searchTerm: "",
    shiftId: undefined,
  },

  selectedOrderForDetail: null,
  orderForVoid: null,
  orderForReprint: null,

  loadOrders: async (forceRefresh = false) => {
    const { orders, lastFetchedAt } = get();
    const isFresh =
      !forceRefresh &&
      lastFetchedAt > 0 &&
      Date.now() - lastFetchedAt < 45_000;
    if (isFresh) return;

    if (lastFetchedAt === 0 && orders.length === 0) {
      set({ isLoading: true });
    }

    // Fetch authoritative orders (falls back to Dexie automatically only on network error)
    try {
      const records = await ordersApi.fetchOrders();
      set({ orders: records, isLoading: false, lastFetchedAt: Date.now() });

      // Refresh detail view if open
      const currentDetail = get().selectedOrderForDetail;
      if (currentDetail) {
        const updated = records.find((o) => o.id === currentDetail.id);
        if (updated) set({ selectedOrderForDetail: updated });
      }
    } catch (err) {
      console.error("[useOrderStore] loadOrders failed:", err);
      set({ isLoading: false });
    }
  },

  setDateRange: (range) =>
    set((state) => ({ filters: { ...state.filters, dateRange: range } })),

  setPaymentMethod: (method) =>
    set((state) => ({ filters: { ...state.filters, paymentMethod: method } })),

  setStatus: (status) =>
    set((state) => ({ filters: { ...state.filters, status: status } })),

  setSearchTerm: (term) =>
    set((state) => ({ filters: { ...state.filters, searchTerm: term } })),

  setShiftId: (shiftId) =>
    set((state) => ({ filters: { ...state.filters, shiftId } })),

  openDetail: (order) => set({ selectedOrderForDetail: order }),
  closeDetail: () => set({ selectedOrderForDetail: null }),

  openVoidDialog: (order) => set({ orderForVoid: order }),
  closeVoidDialog: () => set({ orderForVoid: null }),

  setReprintOrder: (order) => set({ orderForReprint: order }),
}));

