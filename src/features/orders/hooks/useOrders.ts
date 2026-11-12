"use client";

// ============================================================================
// Order Hooks: Order Queries, Multi-Filter Pipeline & KPI Calculations
// ============================================================================

import { useEffect, useMemo } from "react";
import { useOrderStore } from "../stores/order.store";
import { filterOrdersByDateRange, computeOrderKPIs } from "../utils/order.util";

export function useOrders() {
  const orders = useOrderStore((s) => s.orders);
  const isLoading = useOrderStore((s) => s.isLoading);
  const filters = useOrderStore((s) => s.filters);
  const loadOrders = useOrderStore((s) => s.loadOrders);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    // 1. Date Range
    let result = filterOrdersByDateRange(orders, filters.dateRange);

    // 2. Shift Filter
    if (filters.shiftId) {
      result = result.filter((o) => o.shift_id === filters.shiftId);
    }

    // 3. Payment Method
    if (filters.paymentMethod !== "all") {
      result = result.filter((o) => {
        if (filters.paymentMethod === "lao_qr" || filters.paymentMethod === "transfer") {
          return o.payment_method === "transfer" || (o.payment_method as string) === "lao_qr";
        }
        return o.payment_method === filters.paymentMethod;
      });
    }

    // 4. Status
    if (filters.status !== "all") {
      result = result.filter((o) => o.status === filters.status);
    }

    // 5. Search Query
    if (filters.searchTerm.trim()) {
      const q = filters.searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          (o.cashier_name && o.cashier_name.toLowerCase().includes(q)) ||
          o.items?.some((i) => i.product_name?.toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, filters]);

  const kpis = useMemo(() => computeOrderKPIs(filteredOrders), [filteredOrders]);

  return {
    orders: filteredOrders,
    totalCount: orders.length,
    kpis,
    isLoading,
    refresh: loadOrders,
  };
}

