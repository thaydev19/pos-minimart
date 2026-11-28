// ============================================================================
// Inventory Zustand Store: State Management for FEFO & Stock Adjustments
// ============================================================================

import { create } from "zustand";
import {
  InventoryProductItem,
  InventoryFilterStatus,
  BatchDetail,
} from "../types/inventory.types";
import { inventoryApi } from "../api/inventory.api";

interface InventoryState {
  items: InventoryProductItem[];
  isLoading: boolean;
  lastLoadedAt: number;
  searchTerm: string;
  filterStatus: InventoryFilterStatus;
  selectedCategory: string;

  // Drawer / Dialog states
  isStockInOpen: boolean;
  initialProductIdForStockIn: string | null;
  selectedProductForBatchView: InventoryProductItem | null;
  selectedBatchForAdjustment: {
    product: InventoryProductItem;
    batch: BatchDetail;
  } | null;

  // Actions
  loadInventory: (options?: { ifStale?: boolean }) => Promise<void>;
  setSearchTerm: (term: string) => void;
  setFilterStatus: (status: InventoryFilterStatus) => void;
  setSelectedCategory: (catId: string) => void;

  openStockIn: (productId?: string) => void;
  closeStockIn: () => void;

  openBatchDetail: (prod: InventoryProductItem) => void;
  closeBatchDetail: () => void;

  openAdjustment: (prod: InventoryProductItem, batch: BatchDetail) => void;
  openAdjustmentForProduct: (productId: string) => Promise<void>;
  closeAdjustment: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  isLoading: false,
  lastLoadedAt: 0,
  searchTerm: "",
  filterStatus: "all",
  selectedCategory: "all",

  isStockInOpen: false,
  initialProductIdForStockIn: null,
  selectedProductForBatchView: null,
  selectedBatchForAdjustment: null,

  loadInventory: async (options) => {
    const { items, lastLoadedAt } = get();
    const isFresh = items.length > 0 && Date.now() - lastLoadedAt < 1000 * 60 * 5;
    if (options?.ifStale && isFresh) {
      return;
    }

    if (items.length === 0) {
      set({ isLoading: true });
    }
    try {
      const fetchedItems = await inventoryApi.fetchInventoryOverview();
      set({ items: fetchedItems, isLoading: false, lastLoadedAt: Date.now() });

      // If batch view is currently open, refresh its product reference
      const currentBatchView = get().selectedProductForBatchView;
      if (currentBatchView) {
        const updated = fetchedItems.find((p) => p.id === currentBatchView.id);
        if (updated) {
          set({ selectedProductForBatchView: updated });
        }
      }
    } catch (err) {
      console.error("[useInventoryStore] loadInventory failed:", err);
      set({ isLoading: false });
    }
  },

  setSearchTerm: (term: string) => set({ searchTerm: term }),

  setFilterStatus: (status: InventoryFilterStatus) => set({ filterStatus: status }),

  setSelectedCategory: (catId: string) => set({ selectedCategory: catId }),

  openStockIn: (productId?: string) =>
    set({ isStockInOpen: true, initialProductIdForStockIn: productId || null }),
  closeStockIn: () =>
    set({ isStockInOpen: false, initialProductIdForStockIn: null }),

  openBatchDetail: (prod: InventoryProductItem) =>
    set({ selectedProductForBatchView: prod }),
  closeBatchDetail: () => set({ selectedProductForBatchView: null }),

  openAdjustment: (prod: InventoryProductItem, batch: BatchDetail) =>
    set({ selectedBatchForAdjustment: { product: prod, batch } }),

  openAdjustmentForProduct: async (productId: string) => {
    let items = get().items;
    if (items.length === 0) {
      await get().loadInventory();
      items = get().items;
    }
    const prod = items.find((p) => p.id === productId);
    if (!prod) return;

    if (prod.batches && prod.batches.length > 0) {
      const activeBatch = prod.fefo_next_batch || prod.batches[0];
      get().openAdjustment(prod, activeBatch);
    } else {
      try {
        await inventoryApi.createInitialBatchIfEmpty(prod.id, prod.latest_cost_price);
        await get().loadInventory();
        const refreshed = get().items.find((p) => p.id === productId);
        if (refreshed && refreshed.batches.length > 0) {
          get().openAdjustment(refreshed, refreshed.batches[0]);
        }
      } catch {
        get().openStockIn(productId);
      }
    }
  },

  closeAdjustment: () => set({ selectedBatchForAdjustment: null }),
}));

