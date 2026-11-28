"use client";

// ============================================================================
// Products Hooks: TanStack Query Data Fetching & Mutation Actions
// Zero useEffect Data Fetching, 5-minute StaleTime Cache Stability
// ============================================================================

import { useMemo } from "react";
import { useProductStore } from "../stores/product.store";
import { useProductsQuery } from "./useProductsQuery";

export {
  useProductsQuery,
  useProductDetailQuery,
  PRODUCTS_QUERY_KEY,
} from "./useProductsQuery";
export {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductActive,
  useProductMutations,
} from "./useProductMutations";

export function useProducts() {
  const { products, isLoading, refetch } = useProductsQuery();
  const searchTerm = useProductStore((s) => s.searchTerm);
  const selectedCategory = useProductStore((s) => s.selectedCategory);
  const filterType = useProductStore((s) => s.filterType);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter((prod) => {
      if (selectedCategory !== "all") {
        const matchesCategory =
          prod.category_id === selectedCategory ||
          (prod.category_name &&
            prod.category_name.toLowerCase() === selectedCategory.toLowerCase());
        if (!matchesCategory) return false;
      }

      if (filterType === "weighing" && !prod.is_weighing) return false;
      if (filterType === "low_stock" && prod.total_stock > 10) return false;

      if (!q) return true;
      return (
        prod.name_lo.toLowerCase().includes(q) ||
        (prod.name_en && prod.name_en.toLowerCase().includes(q)) ||
        prod.barcode.toLowerCase().includes(q) ||
        (prod.sku && prod.sku.toLowerCase().includes(q)) ||
        prod.units.some((u) => u.barcode && u.barcode.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, filterType, searchTerm]);

  return {
    products: filteredProducts,
    allProducts: products,
    totalCount: products.length,
    // Keep cached products rendered immediately instead of blanking out on background refetch
    isLoading: isLoading && products.length === 0,
    refresh: refetch,
  };
}
