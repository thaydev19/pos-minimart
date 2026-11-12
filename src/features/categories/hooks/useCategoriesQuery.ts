"use client";

// ============================================================================
// TanStack Query: Categories Data Fetching
// 5-minute staleTime prevents redundant refetches & reference churn
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import { CategoryItem } from "../types/category.types";

export const CATEGORIES_QUERY_KEY = ["categories"] as const;

export function useCategoriesQuery() {
  const query = useQuery<CategoryItem[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => categoriesApi.fetchCategories(),
    staleTime: 1000 * 60 * 5, // 5 minutes stable cache
    refetchOnWindowFocus: false,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

