"use client";

// ============================================================================
// TanStack Query: Categories Data Fetching
// 30-second staleTime & auto-refetch on window focus
// Zero Emojis - Enterprise Cache
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import { CategoryItem } from "../types/category.types";
import { QUERY_KEYS } from "@/constants/queryKeys";

export const CATEGORIES_QUERY_KEY = QUERY_KEYS.categories;

export function useCategoriesQuery() {
  const query = useQuery<CategoryItem[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => categoriesApi.fetchCategories(),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
