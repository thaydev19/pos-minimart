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
  loadInventory: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setFilterStatus: (status: InventoryFilterStatus) => void;
  setSelectedCategory: (catId: string) => void;

  openStockIn: (productId?: string) => void;
  closeStockIn: () => void;

  openBatchDetail: (prod: InventoryProductItem) => void;
  closeBatchDetail: () => void;

  openAdjustment: (prod: InventoryProductItem, batch: BatchDetail) => void;
  closeAdjustment: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  isLoading: false,
  searchTerm: "",
  filterStatus: "all",
  selectedCategory: "all",

  isStockInOpen: false,
  initialProductIdForStockIn: null,
  selectedProductForBatchView: null,
  selectedBatchForAdjustment: null,

  loadInventory: async () => {
    set({ isLoading: true });
    try {
      const items = await inventoryApi.fetchInventoryOverview();
      set({ items, isLoading: false });

      // If batch view is currently open, refresh its product reference
      const currentBatchView = get().selectedProductForBatchView;
      if (currentBatchView) {
        const updated = items.find((p) => p.id === currentBatchView.id);
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
  closeAdjustment: () => set({ selectedBatchForAdjustment: null }),
}));

