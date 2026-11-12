"use client";

// ============================================================================
// Inventory Hooks: Querying, Filtering & KPI Calculations
// ============================================================================

import { useEffect, useMemo } from "react";
import { useInventoryStore } from "../stores/inventory.store";
import { InventoryKPIs } from "../types/inventory.types";

export function useInventory() {
  const items = useInventoryStore((s) => s.items);
  const isLoading = useInventoryStore((s) => s.isLoading);
  const searchTerm = useInventoryStore((s) => s.searchTerm);
  const filterStatus = useInventoryStore((s) => s.filterStatus);
  const selectedCategory = useInventoryStore((s) => s.selectedCategory);
  const loadInventory = useInventoryStore((s) => s.loadInventory);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Calculate KPIs across all items
  const kpis: InventoryKPIs = useMemo(() => {
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let nearExpiryBatchCount = 0;
    let expiredBatchCount = 0;

    for (const item of items) {
      totalInventoryValue += item.total_cost_value;
      if (item.is_low_stock) lowStockCount++;

      for (const b of item.batches) {
        if (b.quantity_on_hand > 0) {
          if (b.status === "warning" || b.status === "critical") {
            nearExpiryBatchCount++;
          } else if (b.status === "expired") {
            expiredBatchCount++;
          }
        }
      }
    }

    return {
      totalInventoryValue,
      lowStockCount,
      nearExpiryBatchCount,
      expiredBatchCount,
      totalProductCount: items.length,
    };
  }, [items]);

  // Filtered items based on search and status
  const filteredItems = useMemo(() => {
    return items.filter((prod) => {
      // 1. Category filter
      if (selectedCategory !== "all" && prod.category_id !== selectedCategory) {
        return false;
      }

      // 2. Status filter
      if (filterStatus === "low_stock" && !prod.is_low_stock) {
        return false;
      }
      if (filterStatus === "near_expiry" && !prod.has_near_expiry) {
        return false;
      }
      if (filterStatus === "expired" && !prod.has_expired) {
        return false;
      }

      // 3. Search query
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();

      return (
        prod.name_lo.toLowerCase().includes(q) ||
        (prod.name_en && prod.name_en.toLowerCase().includes(q)) ||
        prod.barcode.toLowerCase().includes(q) ||
        prod.batches.some((b) => b.batch_number.toLowerCase().includes(q))
      );
    });
  }, [items, selectedCategory, filterStatus, searchTerm]);

  return {
    items: filteredItems,
    totalCount: items.length,
    kpis,
    isLoading,
    refresh: loadInventory,
  };
}

