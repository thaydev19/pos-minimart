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

export const dashboardApi = {
  async fetchDashboardStats(range: DashboardTimeRange): Promise<{
    kpis: DashboardKPIs;
    revenueSeries: RevenueTimeSeriesPoint[];
    paymentBreakdown: PaymentMethodBreakdown;
    topProducts: TopSellingProduct[];
    stockAlerts: DashboardStockAlert[];
    recentOrders: DashboardRecentOrder[];
  }> {
    const startDate = getStartDateForRange(range);
    const startDateIso = startDate.toISOString();

    try {
      // 1. Fetch completed orders and products/batches in parallel
      const [ordersRes, productsRes, batchesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*)")
          .gte("offline_created_at", startDateIso)
          .eq("status", "completed"),
        supabase
          .from("products")
          .select("id, name_lo, cost_price, image_url, base_unit"),
        supabase
          .from("product_batches")
          .select("*")
          .gt("quantity_on_hand", 0)
          .order("expiry_date", { ascending: true }),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const batches = batchesRes.data || [];

      const productCostMap = new Map<string, number>();
      const productInfoMap = new Map<string, any>();
      for (const p of products) {
        productCostMap.set(p.id, Number(p.cost_price) || 0);
        productInfoMap.set(p.id, p);
      }

      // 2. Compute KPIs
      let totalRevenue = 0;
      let totalCost = 0;
      let cashTotal = 0;
      let cashCount = 0;
      let transferTotal = 0;
      let transferCount = 0;

      const productSalesMap = new Map<
        string,
        { quantity: number; revenue: number }
      >();

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

        // Calculate item costs and top products
        const items = (o.order_items || []) as any[];
        for (const item of items) {
          const baseQty =
            (Number(item.quantity) || 1) * (Number(item.conversion_rate) || 1);
          const unitCost = productCostMap.get(item.product_id) || 0;
          totalCost += unitCost * baseQty;

          // Aggregate top products
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
        totalRevenue > 0
          ? Math.round((estimatedGrossProfit / totalRevenue) * 100)
          : 0;
      const averageOrderValue =
        totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

      // 3. Payment Method Breakdown
      const totalPayments = cashTotal + transferTotal;
      const paymentBreakdown: PaymentMethodBreakdown = {
        cashTotal,
        cashCount,
        transferTotal,
        transferCount,
        cashPct: totalPayments > 0 ? Math.round((cashTotal / totalPayments) * 100) : 50,
        transferPct: totalPayments > 0 ? Math.round((transferTotal / totalPayments) * 100) : 50,
      };

      // 4. Revenue Time Series Points
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

          const dayOrders = orders.filter((o) =>
            o.offline_created_at.startsWith(dateStr)
          );
          const rev = dayOrders.reduce((sum, o) => sum + (Number(o.final_total) || 0), 0);
          revenueSeries.push({
            label: `${dayName} (${targetDay.getDate()}/${targetDay.getMonth() + 1})`,
            revenue: rev,
            ordersCount: dayOrders.length,
          });
        }
      } else {
        // month: 4 weeks
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

      // 5. Top 5 Products
      const topProducts: TopSellingProduct[] = Array.from(
        productSalesMap.entries()
      )
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

      // 6. Stock Alerts (Near Expiry < 30 days & Low Stock)
      const stockAlerts: DashboardStockAlert[] = [];

      for (const b of batches) {
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

      // 7. Recent Orders from Database
      let recentOrders: DashboardRecentOrder[] = orders
        .slice()
        .sort((a, b) => new Date(b.offline_created_at).getTime() - new Date(a.offline_created_at).getTime())
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

      // Fallback: If 0 orders today, get latest completed orders from DB for preview
      if (recentOrders.length === 0) {
        const { data: latestDbOrders } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("offline_created_at", { ascending: false })
          .limit(6);

        if (latestDbOrders && latestDbOrders.length > 0) {
          recentOrders = latestDbOrders.map((o) => ({
            id: o.id,
            orderNumber: o.order_number || o.id.slice(0, 8),
            createdAt: o.offline_created_at,
            itemsCount: (o.order_items || []).length,
            total: Number(o.final_total) || 0,
            paymentMethod: o.payment_method === "cash" ? "ເງິນສົດ (Cash)" : "BCEL One QR",
            status: o.status === "completed" ? "ສຳເລັດ" : o.status,
          }));
        }
      }

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
    } catch (err) {
      console.error("[DashboardApi] fetchDashboardStats failed:", err);
      // Clean zero fallback
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
  },
};

