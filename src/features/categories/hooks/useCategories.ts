"use client";

// ============================================================================
// Categories Hooks: TanStack Query Data Fetching & Mutation Actions
// Zero useEffect Data Fetching, 5-minute StaleTime Cache Stability
// ============================================================================

import { useMemo } from "react";
import { useCategoryStore } from "../stores/category.store";
import { useCategoriesQuery } from "./useCategoriesQuery";

export { useCategoriesQuery } from "./useCategoriesQuery";
export {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategoryMutations,
} from "./useCategoryMutations";

export function useCategories() {
  const { categories, isLoading, refetch } = useCategoriesQuery();
  const searchTerm = useCategoryStore((s) => s.searchTerm);

  const filteredCategories = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name_lo.toLowerCase().includes(q) ||
        (c.name_en && c.name_en.toLowerCase().includes(q))
    );
  }, [categories, searchTerm]);

  return {
    categories: filteredCategories,
    allCategories: categories,
    totalCount: categories.length,
    isLoading,
    refresh: refetch,
  };
}
