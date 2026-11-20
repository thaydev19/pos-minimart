"use client";

// ============================================================================
// Order Mutations Hook: Void Order with PIN Check & Inventory Restoral
// Zero Emojis - Enterprise Cache Invalidation
// ============================================================================

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrderStore } from "../stores/order.store";
import { ordersApi } from "../api/orders.api";
import { VoidOrderInput } from "../types/order.types";
import { invalidateOrders, invalidateProductsAndInventory } from "@/constants/queryKeys";

export function useOrderMutations() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const loadOrders = useOrderStore((s) => s.loadOrders);
  const closeVoidDialog = useOrderStore((s) => s.closeVoidDialog);

  const voidOrder = async (input: VoidOrderInput): Promise<boolean> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await ordersApi.voidOrder(input);
      await loadOrders();
      await invalidateOrders(queryClient);
      await invalidateProductsAndInventory(queryClient);
      closeVoidDialog();
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ຍົກເລີກບິນບໍ່ສຳເລັດ");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    errorMessage,
    voidOrder,
    clearError: () => setErrorMessage(null),
  };
}
