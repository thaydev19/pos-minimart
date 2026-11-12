// ============================================================================
// Categories Zustand Store: Modal & UI State Management
// ============================================================================

import { create } from "zustand";
import { CategoryItem } from "../types/category.types";
import { categoriesApi } from "../api/categories.api";

interface CategoryState {
  categories: CategoryItem[];
  isLoading: boolean;
  searchTerm: string;
  isFormOpen: boolean;
  editingCategory: CategoryItem | null;

  // Actions
  loadCategories: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  openCreateModal: () => void;
  openEditModal: (cat: CategoryItem) => void;
  closeModal: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  searchTerm: "",
  isFormOpen: false,
  editingCategory: null,

  loadCategories: async () => {
    set({ isLoading: true });
    try {
      const items = await categoriesApi.fetchCategories();
      set({ categories: items, isLoading: false });
    } catch (err) {
      console.error("[useCategoryStore] Failed to load categories:", err);
      set({ isLoading: false });
    }
  },

  setSearchTerm: (term: string) => set({ searchTerm: term }),

  openCreateModal: () => set({ isFormOpen: true, editingCategory: null }),

  openEditModal: (cat: CategoryItem) =>
    set({ isFormOpen: true, editingCategory: cat }),

  closeModal: () => set({ isFormOpen: false, editingCategory: null }),
}));

