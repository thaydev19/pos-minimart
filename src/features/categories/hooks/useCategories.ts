"use client";

// ============================================================================
// Categories Hooks: TanStack Query Data Fetching & Mutation Actions
// Zero useEffect Data Fetching, 5-minute StaleTime Cache Stability
// ============================================================================

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

  const filteredCategories = categories.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name_lo.toLowerCase().includes(term) ||
      (c.name_en && c.name_en.toLowerCase().includes(term))
    );
  });

  return {
    categories: filteredCategories,
    allCategories: categories,
    totalCount: categories.length,
    isLoading,
    refresh: refetch,
  };
}
