"use client";

// ============================================================================
// Order Mutations Hook: Void Order with PIN Check & Inventory Restoral
// ============================================================================

import { useState } from "react";
import { useOrderStore } from "../stores/order.store";
import { ordersApi } from "../api/orders.api";
import { VoidOrderInput } from "../types/order.types";

export function useOrderMutations() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = useOrderStore((s) => s.loadOrders);
  const closeVoidDialog = useOrderStore((s) => s.closeVoidDialog);

  const voidOrder = async (input: VoidOrderInput): Promise<boolean> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await ordersApi.voidOrder(input);
      await loadOrders();
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

