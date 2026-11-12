"use client";

// ============================================================================
// Stock Mutations Hook: Stock In Receipts & Physical Count Adjustments
// ============================================================================

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInventoryStore } from "../stores/inventory.store";
import { inventoryApi } from "../api/inventory.api";
import {
  StockInFormData,
  StockAdjustmentFormData,
} from "../types/inventory.types";

export function useStockMutations() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const loadInventory = useInventoryStore((s) => s.loadInventory);
  const closeStockIn = useInventoryStore((s) => s.closeStockIn);
  const closeAdjustment = useInventoryStore((s) => s.closeAdjustment);

  const createStockIn = async (data: StockInFormData): Promise<boolean> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await inventoryApi.createStockIn(data);
      await loadInventory();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      closeStockIn();
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ບັນທຶກການນຳເຂົ້າບໍ່ສຳເລັດ");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustStock = async (
    adjustment: StockAdjustmentFormData
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await inventoryApi.adjustBatchStock(adjustment);
      await loadInventory();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      closeAdjustment();
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ປັບຍອດສະຕັອກບໍ່ສຳເລັດ");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleClearance = async (
    batchId: string,
    isClearance: boolean,
    clearancePrice?: number
  ): Promise<boolean> => {
    try {
      await inventoryApi.markBatchClearance(batchId, isClearance, clearancePrice);
      await loadInventory();
      return true;
    } catch (err: any) {
      alert(err.message || "ອັບເດດສະຖານະລັອດບໍ່ສຳເລັດ");
      return false;
    }
  };

  return {
    isSubmitting,
    errorMessage,
    createStockIn,
    adjustStock,
    toggleClearance,
    clearError: () => setErrorMessage(null),
  };
}

