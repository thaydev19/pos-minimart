// ============================================================================
// Dashboard API: Real Supabase Aggregation & Analytics Calculations
// ============================================================================

import { supabase } from "@/apis/supabase-client";
import { offlineDb } from "@/apis/offline-db";
import {
  DashboardTimeRange,
  DashboardKPIs,
  RevenueTimeSeriesPoint,
  PaymentMethodBreakdown,
  TopSellingProduct,
  DashboardStockAlert,
  DashboardRecentOrder,
} from "../types/dashboard.types";
import { getStartDateForRange } from "../utils/dashboard.util";
import { calculateDaysUntilExpiry } from "@/features/inventory/utils/inventory.util";

export interface DashboardStatsPayload {
  kpis: DashboardKPIs;
  revenueSeries: RevenueTimeSeriesPoint[];
  paymentBreakdown: PaymentMethodBreakdown;
  topProducts: TopSellingProduct[];
  stockAlerts: DashboardStockAlert[];
  recentOrders: DashboardRecentOrder[];
}

function emptyDashboardStats(): DashboardStatsPayload {
  return {
    kpis: {
      totalRevenue: 0,
      totalCost: 0,
      estimatedGrossProfit: 0,
      grossProfitMarginPct: 0,
      totalOrdersCount: 0,
      averageOrderValue: 0,
    },
    revenueSeries: [],
    paymentBreakdown: {
      cashTotal: 0,
      cashCount: 0,
      transferTotal: 0,
      transferCount: 0,
      cashPct: 50,
      transferPct: 50,
    },
    topProducts: [],
    stockAlerts: [],
    recentOrders: [],
  };
}

function buildDashboardSnapshot(
  orders: any[],
  products: any[],
  batches: any[],
  range: DashboardTimeRange,
  fallbackOrders: any[] = []
): DashboardStatsPayload {
  const productCostMap = new Map<string, number>();
  const productInfoMap = new Map<string, any>();
  for (const p of products) {
    productCostMap.set(p.id, Number(p.cost_price) || 0);
    productInfoMap.set(p.id, p);
  }

  let totalRevenue = 0;
  let totalCost = 0;
  let cashTotal = 0;
  let cashCount = 0;
  let transferTotal = 0;
  let transferCount = 0;

  const productSalesMap = new Map<string, { quantity: number; revenue: number }>();

  for (const o of orders) {
    const orderTotal = Number(o.final_total) || 0;
    totalRevenue += orderTotal;

    if (o.payment_method === "cash") {
      cashTotal += orderTotal;
      cashCount++;
    } else {
      transferTotal += orderTotal;
      transferCount++;
    }

    const items = (o.order_items || []) as any[];
    for (const item of items) {
      const baseQty = (Number(item.quantity) || 1) * (Number(item.conversion_rate) || 1);
      const unitCost = productCostMap.get(item.product_id) || 0;
      totalCost += unitCost * baseQty;

      const existing = productSalesMap.get(item.product_id) || {
        quantity: 0,
        revenue: 0,
      };
      productSalesMap.set(item.product_id, {
        quantity: existing.quantity + (Number(item.quantity) || 0),
        revenue: existing.revenue + (Number(item.total_price) || 0),
      });
    }
  }

  const totalOrdersCount = orders.length;
  const estimatedGrossProfit = Math.max(0, totalRevenue - totalCost);
  const grossProfitMarginPct =
    totalRevenue > 0 ? Math.round((estimatedGrossProfit / totalRevenue) * 100) : 0;
  const averageOrderValue =
    totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  const totalPayments = cashTotal + transferTotal;
  const paymentBreakdown: PaymentMethodBreakdown = {
    cashTotal,
    cashCount,
    transferTotal,
    transferCount,
    cashPct: totalPayments > 0 ? Math.round((cashTotal / totalPayments) * 100) : 50,
    transferPct: totalPayments > 0 ? Math.round((transferTotal / totalPayments) * 100) : 50,
  };

  const revenueSeries: RevenueTimeSeriesPoint[] = [];

  if (range === "today") {
    const slots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    for (const slot of slots) {
      const slotHour = parseInt(slot.split(":")[0], 10);
      const slotOrders = orders.filter((o) => {
        const h = new Date(o.offline_created_at).getHours();
        return h >= slotHour && h < slotHour + 2;
      });
      const rev = slotOrders.reduce((sum, o) => sum + (Number(o.final_total) || 0), 0);
      revenueSeries.push({
        label: slot,
        revenue: rev,
        ordersCount: slotOrders.length,
      });
    }
  } else if (range === "week") {
    const days = ["ອາທິດ", "ຈັນ", "ອັງຄານ", "ພຸດ", "ພະຫັດ", "ສຸກ", "ເສົາ"];
    for (let i = 6; i >= 0; i--) {
      const targetDay = new Date();
      targetDay.setDate(targetDay.getDate() - i);
      const dayName = days[targetDay.getDay()];
      const dateStr = targetDay.toISOString().split("T")[0];

      const dayOrders = orders.filter((o) => o.offline_created_at.startsWith(dateStr));
      const rev = dayOrders.reduce((sum, o) => sum + (Number(o.final_total) || 0), 0);
      revenueSeries.push({
        label: `${dayName} (${targetDay.getDate()}/${targetDay.getMonth() + 1})`,
        revenue: rev,
        ordersCount: dayOrders.length,
      });
    }
  } else {
    const weeks = ["ອາທິດ 1", "ອາທິດ 2", "ອາທິດ 3", "ອາທິດ 4"];
    for (let w = 0; w < 4; w++) {
      const startDay = w * 7 + 1;
      const endDay = (w + 1) * 7;
      const weekOrders = orders.filter((o) => {
        const d = new Date(o.offline_created_at).getDate();
        return d >= startDay && d <= endDay;
      });
      const rev = weekOrders.reduce((sum, o) => sum + (Number(o.final_total) || 0), 0);
      revenueSeries.push({
        label: weeks[w],
        revenue: rev,
        ordersCount: weekOrders.length,
      });
    }
  }

  const topProducts: TopSellingProduct[] = Array.from(productSalesMap.entries())
    .map(([prodId, sales]) => {
      const p = productInfoMap.get(prodId);
      return {
        productId: prodId,
        productName: p?.name_lo || "ສິນຄ້າ",
        imageUrl: p?.image_url,
        baseUnit: p?.base_unit || "ອັນ",
        quantitySold: sales.quantity,
        totalRevenue: sales.revenue,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  const stockAlerts: DashboardStockAlert[] = [];
  for (const b of batches) {
    if ((Number(b.quantity_on_hand) || 0) <= 0) continue;
    const days = calculateDaysUntilExpiry(b.expiry_date);
    const p = productInfoMap.get(b.product_id);
    const pName = p?.name_lo || "ສິນຄ້າ";

    if (days < 0) {
      stockAlerts.push({
        id: b.id,
        type: "expired",
        productId: b.product_id,
        productName: pName,
        batchNumber: b.batch_number,
        detail: `ລັອດ ${b.batch_number} ໝົດອາຍຸແລ້ວ (${Math.abs(days)} ວັນກ່ອນ)`,
        daysRemaining: days,
      });
    } else if (days <= 30) {
      stockAlerts.push({
        id: b.id,
        type: "near_expiry",
        productId: b.product_id,
        productName: pName,
        batchNumber: b.batch_number,
        detail: `ລັອດ ${b.batch_number} ເຫຼືອອີກ ${days} ວັນ (FEFO)`,
        daysRemaining: days,
      });
    }

    if (stockAlerts.length >= 6) break;
  }

  const sourceForRecent = orders.length > 0 ? orders : fallbackOrders;
  const recentOrders: DashboardRecentOrder[] = sourceForRecent
    .slice()
    .sort(
      (a, b) =>
        new Date(b.offline_created_at).getTime() - new Date(a.offline_created_at).getTime()
    )
    .slice(0, 6)
    .map((o) => ({
      id: o.id,
      orderNumber: o.order_number || o.id.slice(0, 8),
      createdAt: o.offline_created_at,
      itemsCount: (o.order_items || []).length,
      total: Number(o.final_total) || 0,
      paymentMethod: o.payment_method === "cash" ? "ເງິນສົດ (Cash)" : "BCEL One QR",
      status: o.status === "completed" ? "ສຳເລັດ" : o.status,
    }));

  return {
    kpis: {
      totalRevenue,
      totalCost,
      estimatedGrossProfit,
      grossProfitMarginPct,
      totalOrdersCount,
      averageOrderValue,
    },
    revenueSeries,
    paymentBreakdown,
    topProducts,
    stockAlerts,
    recentOrders,
  };
}

export const dashboardApi = {
  async fetchDashboardStatsFromDexie(
    range: DashboardTimeRange
  ): Promise<DashboardStatsPayload> {
    try {
      const startMs = getStartDateForRange(range).getTime();
      const [localOrders, localItems, localProducts, localBatches] = await Promise.all([
        offlineDb.orders.toArray(),
        offlineDb.order_items.toArray(),
        offlineDb.products.toArray(),
        offlineDb.product_batches.toArray(),
      ]);

      const itemsByOrder = new Map<string, any[]>();
      for (const item of localItems) {
        const arr = itemsByOrder.get(item.order_id);
        if (arr) arr.push(item);
        else itemsByOrder.set(item.order_id, [item]);
      }

      const enrichedOrders = localOrders.map((o) => ({
        ...o,
        order_items: itemsByOrder.get(o.id) || [],
      }));

      const rangeOrders = enrichedOrders.filter(
        (o) =>
          o.status === "completed" &&
          new Date(o.offline_created_at).getTime() >= startMs
      );

      const sortedBatches = localBatches
        .filter((b) => (Number(b.quantity_on_hand) || 0) > 0)
        .sort(
          (a, b) =>
            new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        );

      return buildDashboardSnapshot(
        rangeOrders,
        localProducts,
        sortedBatches,
        range,
        enrichedOrders
      );
    } catch {
      return emptyDashboardStats();
    }
  },

  async fetchDashboardStats(range: DashboardTimeRange): Promise<DashboardStatsPayload> {
    const startDate = getStartDateForRange(range);
    const startDateIso = startDate.toISOString();

    try {
      const [ordersRes, latestOrdersRes, productsRes, batchesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*)")
          .gte("offline_created_at", startDateIso)
          .eq("status", "completed"),
        supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("offline_created_at", { ascending: false })
          .limit(6),
        supabase
          .from("products")
          .select("id, name_lo, cost_price, image_url, base_unit"),
        supabase
          .from("product_batches")
          .select("*")
          .gt("quantity_on_hand", 0)
          .order("expiry_date", { ascending: true }),
      ]);

      if (ordersRes.error) {
        return this.fetchDashboardStatsFromDexie(range);
      }

      const orders = ordersRes.data || [];
      const fallbackOrders = orders.length === 0 ? latestOrdersRes.data || [] : [];
      const products = productsRes.data || [];
      const batches = batchesRes.data || [];

      return buildDashboardSnapshot(orders, products, batches, range, fallbackOrders);
    } catch (err) {
      console.error("[DashboardApi] fetchDashboardStats failed:", err);
      return this.fetchDashboardStatsFromDexie(range);
    }
  },
};

