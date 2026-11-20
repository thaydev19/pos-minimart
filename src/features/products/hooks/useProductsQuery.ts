"use client";

// ============================================================================
// TanStack Query: Products Data Fetching
// 30-second staleTime for fast navigation + guaranteed freshness
// Zero Emojis - Enterprise Cache
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/products.api";
import { ProductListItem } from "../types/product.types";
import { QUERY_KEYS } from "@/constants/queryKeys";

export const PRODUCTS_QUERY_KEY = QUERY_KEYS.products;

export interface ProductFilters {
  searchTerm?: string;
  categoryId?: string;
  filterType?: "all" | "weighing" | "low_stock";
}

/**
 * Main query for all products with 30-second stale cache
 */
export function useProductsQuery(filters?: ProductFilters) {
  const queryKey = filters
    ? ([...PRODUCTS_QUERY_KEY, filters] as const)
    : PRODUCTS_QUERY_KEY;

  const query = useQuery<ProductListItem[]>({
    queryKey,
    queryFn: () => productsApi.fetchProducts(),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Single product detail query
 */
export function useProductDetailQuery(productId?: string) {
  return useQuery<ProductListItem | undefined>({
    queryKey: QUERY_KEYS.productDetail(productId),
    queryFn: async () => {
      if (!productId) return undefined;
      const all = await productsApi.fetchProducts();
      return all.find((p) => p.id === productId);
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}
