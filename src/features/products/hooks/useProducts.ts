"use client";

// ============================================================================
// Products Hooks: TanStack Query Data Fetching & Mutation Actions
// Zero useEffect Data Fetching, 5-minute StaleTime Cache Stability
// ============================================================================

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
  const { products, isLoading, isFetching, refetch } = useProductsQuery();
  const searchTerm = useProductStore((s) => s.searchTerm);
  const selectedCategory = useProductStore((s) => s.selectedCategory);
  const filterType = useProductStore((s) => s.filterType);

  const filteredProducts = products.filter((prod) => {
    // 1. Category filter (matches by category_id or category_name)
    if (selectedCategory !== "all") {
      const matchesCategory =
        prod.category_id === selectedCategory ||
        (prod.category_name &&
          prod.category_name.toLowerCase() === selectedCategory.toLowerCase());
      if (!matchesCategory) return false;
    }

    // 2. Type filter
    if (filterType === "weighing" && !prod.is_weighing) return false;
    if (filterType === "low_stock" && prod.total_stock > 10) return false;

    // 3. Search filter
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      prod.name_lo.toLowerCase().includes(q) ||
      (prod.name_en && prod.name_en.toLowerCase().includes(q)) ||
      prod.barcode.toLowerCase().includes(q) ||
      (prod.sku && prod.sku.toLowerCase().includes(q)) ||
      prod.units.some((u) => u.barcode && u.barcode.includes(q))
    );
  });

  return {
    products: filteredProducts,
    allProducts: products,
    totalCount: products.length,
    isLoading: isLoading || isFetching,
    refresh: refetch,
  };
}
