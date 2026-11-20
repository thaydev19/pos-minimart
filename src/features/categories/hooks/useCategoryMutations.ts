"use client";

// ============================================================================
// TanStack Query: Category Mutations (Create, Update, Delete)
// Automatic cache invalidation on success, zero manual list mutations
// ============================================================================

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import { CategoryFormData, DeleteCategoryResult } from "../types/category.types";
import { useCategoryStore } from "../stores/category.store";
import { invalidateCategories } from "@/constants/queryKeys";

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const closeModal = useCategoryStore((s) => s.closeModal);

  return useMutation({
    mutationFn: (data: CategoryFormData) => categoriesApi.createCategory(data),
    onSuccess: async () => {
      await invalidateCategories(queryClient);
      closeModal();
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const closeModal = useCategoryStore((s) => s.closeModal);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      categoriesApi.updateCategory(id, data),
    onSuccess: async () => {
      await invalidateCategories(queryClient);
      closeModal();
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: async () => {
      await invalidateCategories(queryClient);
    },
  });
}

/**
 * Composite hook maintaining backward compatibility with existing components
 */
export function useCategoryMutations() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const createCategory = async (data: CategoryFormData): Promise<boolean> => {
    setErrorMessage(null);
    try {
      await createMutation.mutateAsync(data);
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ເພີ່ມໝວດໝູ່ບໍ່ສຳເລັດ");
      return false;
    }
  };

  const updateCategory = async (
    id: string,
    data: CategoryFormData
  ): Promise<boolean> => {
    setErrorMessage(null);
    try {
      await updateMutation.mutateAsync({ id, data });
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ແກ້ໄຂໝວດໝູ່ບໍ່ສຳເລັດ");
      return false;
    }
  };

  const deleteCategory = async (
    id: string
  ): Promise<DeleteCategoryResult> => {
    setErrorMessage(null);
    try {
      const result = await deleteMutation.mutateAsync(id);
      if (!result.success) {
        setErrorMessage(result.message || "ບໍ່ສາມາດລຶບໝວດໝູ່ໄດ້");
        return result;
      }
      return result;
    } catch (err: any) {
      const msg = err.message || "ລຶບໝວດໝູ່ຜິດພາດ";
      setErrorMessage(msg);
      return { success: false, message: msg };
    }
  };

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    isSubmitting,
    errorMessage,
    clearError: () => setErrorMessage(null),
  };
}

