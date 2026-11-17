"use client";

// ============================================================================
// Shift Mutations Hook: Open Shift & Blind Reconciliation Close
// ============================================================================

import { useState } from "react";
import { useShiftStore } from "../stores/shift.store";
import { shiftsApi } from "../api/shifts.api";
import {
  CloseShiftBlindInput,
  ShiftClosingSummary,
} from "../types/shift.types";

export function useShiftMutations() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadActiveShift = useShiftStore((s) => s.loadActiveShift);
  const loadShiftHistory = useShiftStore((s) => s.loadShiftHistory);
  const closeOpenShiftModal = useShiftStore((s) => s.closeOpenShiftModal);
  const closeCloseShiftModal = useShiftStore((s) => s.closeCloseShiftModal);
  const setLastClosingSummary = useShiftStore((s) => s.setLastClosingSummary);

  const openShift = async (openingCash: number, notes?: string): Promise<boolean> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await shiftsApi.openShift(openingCash, notes);
      await loadActiveShift();
      await loadShiftHistory();
      closeOpenShiftModal();
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ເປີດກະບໍ່ສຳເລັດ");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeShiftBlind = async (
    input: CloseShiftBlindInput
  ): Promise<ShiftClosingSummary | null> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const summary = await shiftsApi.closeShiftBlind(input);
      setLastClosingSummary(summary);
      await loadActiveShift();
      await loadShiftHistory();
      // Keep modal open so the cashier can review the Z-Report and print 80mm slip
      return summary;
    } catch (err: any) {
      setErrorMessage(err.message || "ປິດກະບໍ່ສຳເລັດ");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const forceCloseShift = async (
    shiftId: string,
    notes?: string
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await shiftsApi.forceCloseAbandonedShift(shiftId, notes);
      await loadActiveShift();
      await loadShiftHistory();
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || "ປິດກະຄ້າງບໍ່ສຳເລັດ");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    errorMessage,
    openShift,
    closeShiftBlind,
    forceCloseShift,
    clearError: () => setErrorMessage(null),
  };
}

