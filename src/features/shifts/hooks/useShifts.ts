"use client";

// ============================================================================
// Shifts Hooks: Active Shift Status & Shift History Queries
// ============================================================================

import { useEffect } from "react";
import { useShiftStore } from "../stores/shift.store";

export function useShifts() {
  const activeShift = useShiftStore((s) => s.activeShift);
  const shiftHistory = useShiftStore((s) => s.shiftHistory);
  const isLoading = useShiftStore((s) => s.isLoading);
  const loadActiveShift = useShiftStore((s) => s.loadActiveShift);
  const loadShiftHistory = useShiftStore((s) => s.loadShiftHistory);

  useEffect(() => {
    loadActiveShift();
    loadShiftHistory();
  }, [loadActiveShift, loadShiftHistory]);

  return {
    activeShift,
    shiftHistory,
    isLoading,
    refreshActiveShift: loadActiveShift,
    refreshHistory: loadShiftHistory,
  };
}

