// ============================================================================
// Order Utilities: Date Range Filtering, KPI Aggregation & Receipt Formatting
// ============================================================================

import { OrderRecord, OrderKPIs } from "../types/order.types";

/**
 * Filters orders by date range preset.
 */
export function filterOrdersByDateRange(
  orders: OrderRecord[],
  range: "today" | "week" | "month" | "all"
): OrderRecord[] {
  if (range === "all") return orders;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (range === "today") {
    return orders.filter((o) => {
      const time = new Date(o.offline_created_at).getTime();
      return time >= startOfDay;
    });
  }

  if (range === "week") {
    const weekAgo = startOfDay - 7 * 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const time = new Date(o.offline_created_at).getTime();
      return time >= weekAgo;
    });
  }

  if (range === "month") {
    const monthAgo = startOfDay - 30 * 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const time = new Date(o.offline_created_at).getTime();
      return time >= monthAgo;
    });
  }

  return orders;
}

/**
 * Computes top summary KPIs for orders.
 */
export function computeOrderKPIs(orders: OrderRecord[]): OrderKPIs {
  let totalRevenue = 0;
  let completedOrderCount = 0;
  let cancelledOrderCount = 0;
  let cashRevenue = 0;
  let transferRevenue = 0;

  for (const o of orders) {
    if (o.status === "completed") {
      completedOrderCount++;
      totalRevenue += o.final_total;

      if (o.payment_method === "cash") {
        cashRevenue += o.final_total;
      } else if (
        o.payment_method === "transfer" ||
        (o.payment_method as string) === "lao_qr"
      ) {
        transferRevenue += o.final_total;
      }
    } else if (o.status === "cancelled") {
      cancelledOrderCount++;
    }
  }

  const averageOrderValue =
    completedOrderCount > 0 ? Math.round(totalRevenue / completedOrderCount) : 0;

  return {
    totalRevenue,
    completedOrderCount,
    cancelledOrderCount,
    cashRevenue,
    transferRevenue,
    averageOrderValue,
  };
}

/**
 * Formats ISO date time string for retail receipts in Laos.
 */
export function formatReceiptDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("lo-LA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoString;
  }
}

