// ============================================================================
// Shift Store: State Management for Active Shift, Blind Close & History
// ============================================================================

import { create } from "zustand";
import { ShiftItem, ShiftClosingSummary } from "../types/shift.types";
import { shiftsApi } from "../api/shifts.api";

interface ShiftState {
  activeShift: ShiftItem | null;
  shiftHistory: ShiftItem[];
  isLoading: boolean;
  isOpenShiftModalOpen: boolean;
  isCloseShiftModalOpen: boolean;
  lastClosingSummary: ShiftClosingSummary | null;

  // Actions
  loadActiveShift: () => Promise<ShiftItem | null>;
  loadShiftHistory: () => Promise<void>;
  openOpenShiftModal: () => void;
  closeOpenShiftModal: () => void;
  openCloseShiftModal: () => void;
  closeCloseShiftModal: () => void;
  setLastClosingSummary: (summary: ShiftClosingSummary | null) => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  activeShift: null,
  shiftHistory: [],
  isLoading: false,
  isOpenShiftModalOpen: false,
  isCloseShiftModalOpen: false,
  lastClosingSummary: null,

  loadActiveShift: async () => {
    set({ isLoading: true });
    try {
      const active = await shiftsApi.getActiveShift();
      set({ activeShift: active, isLoading: false });
      return active;
    } catch (err) {
      console.error("[useShiftStore] loadActiveShift error:", err);
      set({ isLoading: false });
      return null;
    }
  },

  loadShiftHistory: async () => {
    set({ isLoading: true });
    try {
      const history = await shiftsApi.fetchShiftHistory();
      set({ shiftHistory: history, isLoading: false });
    } catch (err) {
      console.error("[useShiftStore] loadShiftHistory error:", err);
      set({ isLoading: false });
    }
  },

  openOpenShiftModal: () => set({ isOpenShiftModalOpen: true }),
  closeOpenShiftModal: () => set({ isOpenShiftModalOpen: false }),

  openCloseShiftModal: () => set({ isCloseShiftModalOpen: true }),
  closeCloseShiftModal: () => set({ isCloseShiftModalOpen: false }),

  setLastClosingSummary: (summary) => set({ lastClosingSummary: summary }),
}));

