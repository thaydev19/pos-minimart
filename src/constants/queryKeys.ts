// ============================================================================
// Centralized React Query Keys & Cache Invalidation Pipeline
// Zero Emojis - Enterprise Cache Invalidation for Lao Minimart POS
// ============================================================================

import type { QueryClient } from "@tanstack/react-query";
import { usePosStore } from "@/features/pos/stores/pos.store";
import { useInventoryStore } from "@/features/inventory/stores/inventory.store";
import { useOrderStore } from "@/features/orders/stores/order.store";

export const QUERY_KEYS = {
  products: ["products"] as const,
  productDetail: (id?: string) => ["product-detail", id] as const,
  categories: ["categories"] as const,
  inventory: ["inventory"] as const,
  orders: ["orders"] as const,
  staff: ["staff_list"] as const,
  shifts: ["shifts"] as const,
  activeShift: ["active_shift"] as const,
};

/**
 * Invalidate Product & Inventory caches simultaneously
 * Triggered after: Product Create/Update/Delete/Toggle, GRN Stock In, Stock Adjustments, POS Checkout, Void Orders
 */
export async function invalidateProductsAndInventory(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory }),
  ]);

  // Synchronize Zustand inventory store if active
  useInventoryStore.getState().loadInventory().catch(() => {});

  // Synchronize POS catalog store if active
  usePosStore.getState().loadCatalog().catch(() => {});
}

/**
 * Invalidate Category caches and related Product filters
 * Triggered after: Category Create/Update/Delete
 */
export async function invalidateCategories(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products }),
  ]);

  // Synchronize POS catalog for fresh category tabs
  usePosStore.getState().loadCatalog().catch(() => {});
}

/**
 * Invalidate Orders cache
 * Triggered after: Order Checkout, Void Order
 */
export async function invalidateOrders(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
  useOrderStore.getState().loadOrders().catch(() => {});
}

/**
 * Invalidate Staff cache
 * Triggered after: Staff Create/Update/Delete/Toggle, PIN Change
 */
export async function invalidateStaff(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.staff });
}

/**
 * Invalidate Shift caches
 * Triggered after: Open Shift, Close Shift (Blind)
 */
export async function invalidateShifts(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shifts }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeShift }),
  ]);
}

/**
 * Global Cache Reset & Full Refetch from Supabase (When Online)
 * Resets React Query cache, refetches active queries, and synchronizes stores
 */
export async function clearCacheAndRefetchAll(queryClient: QueryClient): Promise<void> {
  // 1. Invalidate and reset all queries in React Query
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.staff }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shifts }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeShift }),
  ]);

  // 2. Refetch all active queries from network
  await queryClient.refetchQueries();

  // 3. Synchronize background Zustand stores
  await Promise.all([
    useInventoryStore.getState().loadInventory().catch(() => {}),
    useOrderStore.getState().loadOrders().catch(() => {}),
    usePosStore.getState().loadCatalog().catch(() => {}),
  ]);
}
