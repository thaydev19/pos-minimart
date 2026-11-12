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
} from "../types/dashboard.types";
import { dashboardApi } from "../api/dashboard.api";

interface DashboardState {
  timeRange: DashboardTimeRange;
  kpis: DashboardKPIs | null;
  revenueSeries: RevenueTimeSeriesPoint[];
  paymentBreakdown: PaymentMethodBreakdown | null;
  topProducts: TopSellingProduct[];
  stockAlerts: DashboardStockAlert[];
  isLoading: boolean;

  // Actions
  loadDashboardStats: () => Promise<void>;
  setTimeRange: (range: DashboardTimeRange) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  timeRange: "today",
  kpis: null,
  revenueSeries: [],
  paymentBreakdown: null,
  topProducts: [],
  stockAlerts: [],
  isLoading: false,

  loadDashboardStats: async () => {
    set({ isLoading: true });
    try {
      const data = await dashboardApi.fetchDashboardStats(get().timeRange);
      set({
        kpis: data.kpis,
        revenueSeries: data.revenueSeries,
        paymentBreakdown: data.paymentBreakdown,
        topProducts: data.topProducts,
        stockAlerts: data.stockAlerts,
        isLoading: false,
      });
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

