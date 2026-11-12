// ============================================================================
// Products Zustand Store: Modal & UI State Management
// ============================================================================

import { create } from "zustand";
import { ProductListItem } from "../types/product.types";
import { productsApi } from "../api/products.api";

interface ProductState {
  products: ProductListItem[];
  isLoading: boolean;
  searchTerm: string;
  selectedCategory: string;
  filterType: "all" | "weighing" | "low_stock";
  isFormSheetOpen: boolean;
  editingProduct: ProductListItem | null;

  // Actions
  loadProducts: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (catId: string) => void;
  setFilterType: (f: "all" | "weighing" | "low_stock") => void;
  openCreateSheet: () => void;
  openEditSheet: (prod: ProductListItem) => void;
  closeFormSheet: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  searchTerm: "",
  selectedCategory: "all",
  filterType: "all",
  isFormSheetOpen: false,
  editingProduct: null,

  loadProducts: async () => {
    set({ isLoading: true });
    try {
      const items = await productsApi.fetchProducts();
      set({ products: items, isLoading: false });
    } catch (err) {
      console.error("[useProductStore] Failed to load products:", err);
      set({ isLoading: false });
    }
  },

  setSearchTerm: (term: string) => set({ searchTerm: term }),

  setSelectedCategory: (catId: string) => set({ selectedCategory: catId }),

  setFilterType: (f: "all" | "weighing" | "low_stock") => set({ filterType: f }),

  openCreateSheet: () => set({ isFormSheetOpen: true, editingProduct: null }),

  openEditSheet: (prod: ProductListItem) =>
    set({ isFormSheetOpen: true, editingProduct: prod }),

  closeFormSheet: () => set({ isFormSheetOpen: false, editingProduct: null }),
}));

