"use client";

// ============================================================================
// TanStack Query: Products Data Fetching
// 5-minute staleTime ensures stable reference & zero re-render thrashing
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/products.api";
import { ProductListItem } from "../types/product.types";

export const PRODUCTS_QUERY_KEY = ["products"] as const;

export interface ProductFilters {
  searchTerm?: string;
  categoryId?: string;
  filterType?: "all" | "weighing" | "low_stock";
}

/**
 * Main query for all products with 5-minute stale cache
 */
export function useProductsQuery(filters?: ProductFilters) {
  const queryKey = filters
    ? ([...PRODUCTS_QUERY_KEY, filters] as const)
    : PRODUCTS_QUERY_KEY;

  const query = useQuery<ProductListItem[]>({
    queryKey,
    queryFn: () => productsApi.fetchProducts(),
    staleTime: 1000 * 60 * 5, // 5 minutes stable cache
    refetchOnWindowFocus: false,
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
    queryKey: ["product-detail", productId],
    queryFn: async () => {
      if (!productId) return undefined;
      const all = await productsApi.fetchProducts();
      return all.find((p) => p.id === productId);
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5, // 5 minutes stable cache
    refetchOnWindowFocus: false,
  });
}

