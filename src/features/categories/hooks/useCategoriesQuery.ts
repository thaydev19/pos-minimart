"use client";

// ============================================================================
// TanStack Query: Categories Data Fetching
// 30-second staleTime & auto-refetch on window focus
// Zero Emojis - Enterprise Cache
// ============================================================================

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import { CategoryItem } from "../types/category.types";
import { QUERY_KEYS } from "@/constants/queryKeys";

export const CATEGORIES_QUERY_KEY = QUERY_KEYS.categories;

export function useCategoriesQuery() {
  const queryClient = useQueryClient();

  // Instant local Dexie seed on cold cache so UI never waits for network
  useEffect(() => {
    const existing = queryClient.getQueryData<CategoryItem[]>(CATEGORIES_QUERY_KEY);
    if (existing && existing.length > 0) return;
    categoriesApi.fetchCategoriesFromDexie().then((local) => {
      if (local.length > 0) {
        queryClient.setQueryData<CategoryItem[]>(CATEGORIES_QUERY_KEY, (prev) =>
          prev && prev.length > 0 ? prev : local
        );
      }
    });
  }, [queryClient]);

  const query = useQuery<CategoryItem[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => categoriesApi.fetchCategories(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
