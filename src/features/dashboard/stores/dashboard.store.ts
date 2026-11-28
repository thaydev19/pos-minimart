// ============================================================================
// Dashboard Store: State Management for Metrics, Charts & Alerts
// ============================================================================

import { create } from "zustand";
import {
  DashboardTimeRange,
  DashboardKPIs,
  RevenueTimeSeriesPoint,
  PaymentMethodBreakdown,
  TopSellingProduct,
  DashboardStockAlert,
  DashboardRecentOrder,
} from "../types/dashboard.types";
import { dashboardApi, DashboardStatsPayload } from "../api/dashboard.api";

interface DashboardState {
  timeRange: DashboardTimeRange;
  kpis: DashboardKPIs | null;
  revenueSeries: RevenueTimeSeriesPoint[];
  paymentBreakdown: PaymentMethodBreakdown | null;
  topProducts: TopSellingProduct[];
  stockAlerts: DashboardStockAlert[];
  recentOrders: DashboardRecentOrder[];
  isLoading: boolean;
  cacheByRange: Partial<
    Record<DashboardTimeRange, { data: DashboardStatsPayload; fetchedAt: number }>
  >;

  // Actions
  loadDashboardStats: (forceRefresh?: boolean) => Promise<void>;
  setTimeRange: (range: DashboardTimeRange) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  timeRange: "today",
  kpis: null,
  revenueSeries: [],
  paymentBreakdown: null,
  topProducts: [],
  stockAlerts: [],
  recentOrders: [],
  isLoading: false,
  cacheByRange: {},

  loadDashboardStats: async (forceRefresh = false) => {
    const range = get().timeRange;
    const cached = get().cacheByRange[range];

    if (cached) {
      if (get().kpis !== cached.data.kpis) {
        set({
          kpis: cached.data.kpis,
          revenueSeries: cached.data.revenueSeries,
          paymentBreakdown: cached.data.paymentBreakdown,
          topProducts: cached.data.topProducts,
          stockAlerts: cached.data.stockAlerts,
          recentOrders: cached.data.recentOrders,
          isLoading: false,
        });
      }

      if (!forceRefresh && Date.now() - cached.fetchedAt < 45_000) {
        return;
      }
    } else if (get().kpis === null) {
      set({ isLoading: true });
    }

    try {
      const data = await dashboardApi.fetchDashboardStats(range);
      set((state) => ({
        cacheByRange: {
          ...state.cacheByRange,
          [range]: { data, fetchedAt: Date.now() },
        },
        ...(state.timeRange === range
          ? {
              kpis: data.kpis,
              revenueSeries: data.revenueSeries,
              paymentBreakdown: data.paymentBreakdown,
              topProducts: data.topProducts,
              stockAlerts: data.stockAlerts,
              recentOrders: data.recentOrders,
              isLoading: false,
            }
          : {}),
      }));
    } catch (err) {
      console.error("[useDashboardStore] loadDashboardStats failed:", err);
      set({ isLoading: false });
    }
  },

  setTimeRange: (range) => {
    set({ timeRange: range });
    get().loadDashboardStats();
  },
}));

