"use client";

// ============================================================================
// TanStack Query: Product Mutations (Create, Update, Delete, Toggle Active)
// Auto-invalidates ['products'] query cache & auto-closes modal on success
// ============================================================================

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/products.api";
import { ProductFormData } from "../types/product.types";
import { useProductStore } from "../stores/product.store";
import { invalidateProductsAndInventory } from "@/constants/queryKeys";

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const closeFormSheet = useProductStore((s) => s.closeFormSheet);

  return useMutation({
    mutationFn: (data: ProductFormData) => productsApi.createProduct(data),
    onSuccess: async () => {
      await invalidateProductsAndInventory(queryClient);
      closeFormSheet();
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const closeFormSheet = useProductStore((s) => s.closeFormSheet);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
      productsApi.updateProduct(id, data),
    onSuccess: async () => {
      await invalidateProductsAndInventory(queryClient);
      closeFormSheet();
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: async () => {
      await invalidateProductsAndInventory(queryClient);
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productsApi.toggleProductActive(id, isActive),
    onSuccess: async () => {
      await invalidateProductsAndInventory(queryClient);
    },
  });
}

/**
 * Composite hook maintaining backward compatibility with existing components
 */
export function useProductMutations() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const toggleMutation = useToggleProductActive();

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleMutation.isPending;

  const createProduct = async (data: ProductFormData): Promise<boolean> => {
    setErrorMessage(null);
    try {
      await createMutation.mutateAsync(data);
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ເພີ່ມສິນຄ້າບໍ່ສຳເລັດ");
      return false;
    }
  };

  const updateProduct = async (
    id: string,
    data: ProductFormData
  ): Promise<boolean> => {
    setErrorMessage(null);
    try {
      await updateMutation.mutateAsync({ id, data });
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ແກ້ໄຂສິນຄ້າບໍ່ສຳເລັດ");
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ລຶບສິນຄ້າບໍ່ສຳເລັດ");
      return false;
    }
  };

  const toggleProductActive = async (
    id: string,
    isActive: boolean
  ): Promise<boolean> => {
    setErrorMessage(null);
    try {
      await toggleMutation.mutateAsync({ id, isActive });
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ອັບເດດສະຖານະສິນຄ້າບໍ່ສຳເລັດ");
      return false;
    }
  };

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    isSubmitting,
    errorMessage,
    clearError: () => setErrorMessage(null),
  };
}

