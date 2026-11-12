// ============================================================================
// Zustand POS Store - State & Offline-First POS Engine (Minimart Laos)
// Totals are cached directly in state to avoid unstable snapshot re-allocations
// ============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  CartItem,
  HoldOrder,
  ProductWithDetails,
  CashierInfo,
  PosTotals,
} from "../types/pos.types";
import { LocalProductUnit, LocalCategory } from "@/apis/offline-db";
import { calculateLineTotal } from "@/utils/math.util";
import { computePosTotals, allocateFefoBatch } from "../utils/pos.util";
import { DEFAULT_CASHIER } from "../constants/pos.constants";
import { posApi } from "../api/pos.api";
import { syncEngine } from "@/apis/sync-engine";

interface PosState {
  // Catalog & Database State
  products: ProductWithDetails[];
  categories: LocalCategory[];
  isLoadingCatalog: boolean;
  catalogSource: "supabase" | "offline-dexie" | null;
  lastSyncTime: string | null;
  viewMode: "grid" | "compact";

  // Cart & Transaction State
  cart: CartItem[];
  totals: PosTotals;
  holdOrders: HoldOrder[];
  activeHoldId: string | null;
  orderDiscountFixed: number;
  vatRatePercent: number;
  cashier: CashierInfo;
  activeCategory: string;

  // Actions
  setViewMode: (mode: "grid" | "compact") => void;
  loadCatalog: (forceRefresh?: boolean) => Promise<void>;
  syncWithDatabase: () => Promise<void>;
  setActiveCategory: (catId: string) => void;
  addToCart: (
    product: ProductWithDetails,
    preferredUnit?: LocalProductUnit,
    quantity?: number,
    customPrice?: number
  ) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  changeUnit: (itemId: string, newUnitName: string) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setOrderDiscount: (amount: number) => void;
  holdCurrentOrder: (customTitle?: string) => void;
  restoreHoldOrder: (holdId: string) => void;
  deleteHoldOrder: (holdId: string) => void;
  deductCartInventory: (cartItems: CartItem[]) => void;
  getTotals: () => PosTotals;
}

const INITIAL_TOTALS: PosTotals = {
  subtotal: 0,
  itemsDiscount: 0,
  orderDiscount: 0,
  totalDiscount: 0,
  vatAmount: 0,
  finalTotal: 0,
  totalItemCount: 0,
};

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      // Catalog Data (Direct from Supabase & Dexie)
      products: [],
      categories: [],
      isLoadingCatalog: false,
      catalogSource: null,
      lastSyncTime: null,
      viewMode: "grid",

      // Cart State
      cart: [],
      totals: INITIAL_TOTALS,
      holdOrders: [],
      activeHoldId: null,
      orderDiscountFixed: 0,
      vatRatePercent: 0,
      activeCategory: "cat-all",
      cashier: DEFAULT_CASHIER,

      setViewMode: (mode) => set({ viewMode: mode }),

      loadCatalog: async () => {
        set({ isLoadingCatalog: true });
        try {
          const res = await posApi.fetchCatalog();
          set({
            products: res.products,
            categories: res.categories,
            catalogSource: res.source,
            isLoadingCatalog: false,
            lastSyncTime: new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          });
        } catch (err) {
          console.error("Failed to load catalog:", err);
          set({ isLoadingCatalog: false });
        }
      },

      syncWithDatabase: async () => {
        set({ isLoadingCatalog: true });
        try {
          // 1. Flush any pending offline queue items to Supabase
          await syncEngine.processQueue();
          // 2. Fetch fresh catalog from Supabase
          const res = await posApi.fetchCatalog();
          set({
            products: res.products,
            categories: res.categories,
            catalogSource: res.source,
            isLoadingCatalog: false,
            lastSyncTime: new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          });
        } catch (err) {
          console.error("Manual database sync failed:", err);
          set({ isLoadingCatalog: false });
        }
      },

      setActiveCategory: (catId) => set({ activeCategory: catId }),

      addToCart: (product, preferredUnit, quantity = 1, customPrice) => {
        const state = get();
        const unit =
          preferredUnit ||
          product.units.find((u) => u.is_base_unit) ||
          product.units[0];

        // 1. FEFO Batch Allocation
        const { allocatedBatch, isNearExpiry, isExpired } = allocateFefoBatch(
          product.batches,
          product.warning_days_before_expiry
        );

        // 2. Unit Selling Price
        let effectiveUnitPrice = customPrice ?? unit.selling_price;
        if (allocatedBatch?.is_clearance && allocatedBatch.clearance_price && !customPrice) {
          effectiveUnitPrice = allocatedBatch.clearance_price;
        }

        // 3. Add to or update cart
        const existingIndex = state.cart.findIndex(
          (item) => item.productId === product.id && item.selectedUnit.unit_name === unit.unit_name
        );

        let nextCart: CartItem[];

        if (existingIndex > -1) {
          nextCart = [...state.cart];
          const existingItem = nextCart[existingIndex];
          const nextQty = existingItem.quantity + quantity;
          const { subtotal, discountAmount, total } = calculateLineTotal(
            existingItem.unitPrice,
            nextQty
          );

          nextCart[existingIndex] = {
            ...existingItem,
            quantity: nextQty,
            subtotalPrice: subtotal,
            discountAmount,
            totalPrice: total,
          };
        } else {
          const { subtotal, discountAmount, total } = calculateLineTotal(
            effectiveUnitPrice,
            quantity
          );

          const newItem: CartItem = {
            id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            productId: product.id,
            name: product.name_lo,
            barcode: unit.barcode || product.barcode,
            selectedUnit: unit,
            availableUnits: product.units,
            quantity,
            unitPrice: effectiveUnitPrice,
            subtotalPrice: subtotal,
            discountAmount,
            totalPrice: total,
            allocatedBatch,
            imageUrl: product.image_url,
            isNearExpiry,
            isExpired,
            isWeighing: product.is_weighing,
          };

          nextCart = [newItem, ...state.cart];
        }

        const nextTotals = computePosTotals(
          nextCart,
          state.orderDiscountFixed,
          state.vatRatePercent
        );

        set({ cart: nextCart, totals: nextTotals });
      },

      updateQuantity: (itemId, qty) => {
        const state = get();
        if (qty <= 0) {
          state.removeItem(itemId);
          return;
        }

        const nextCart = state.cart.map((item) => {
          if (item.id === itemId) {
            const { subtotal, discountAmount, total } = calculateLineTotal(item.unitPrice, qty);
            return {
              ...item,
              quantity: qty,
              subtotalPrice: subtotal,
              discountAmount,
              totalPrice: total,
            };
          }
          return item;
        });

        const nextTotals = computePosTotals(
          nextCart,
          state.orderDiscountFixed,
          state.vatRatePercent
        );

        set({ cart: nextCart, totals: nextTotals });
      },

      changeUnit: (itemId: string, newUnitName: string) => {
        const state = get();
        const nextCart = state.cart.map((item) => {
          if (item.id === itemId) {
            const targetUnit = item.availableUnits.find((u) => u.unit_name === newUnitName);
            if (!targetUnit) return item;

            const newUnitPrice = targetUnit.selling_price;
            const { subtotal, discountAmount, total } = calculateLineTotal(
              newUnitPrice,
              item.quantity
            );

            return {
              ...item,
              selectedUnit: targetUnit,
              unitPrice: newUnitPrice,
              subtotalPrice: subtotal,
              discountAmount,
              totalPrice: total,
            };
          }
          return item;
        });

        const nextTotals = computePosTotals(
          nextCart,
          state.orderDiscountFixed,
          state.vatRatePercent
        );

        set({ cart: nextCart, totals: nextTotals });
      },

      removeItem: (itemId) => {
        const state = get();
        const nextCart = state.cart.filter((item) => item.id !== itemId);
        const nextTotals = computePosTotals(
          nextCart,
          state.orderDiscountFixed,
          state.vatRatePercent
        );
        set({ cart: nextCart, totals: nextTotals });
      },

      clearCart: () => {
        set({
          cart: [],
          totals: INITIAL_TOTALS,
          orderDiscountFixed: 0,
        });
      },

      setOrderDiscount: (amount) => {
        const state = get();
        const nextTotals = computePosTotals(
          state.cart,
          amount,
          state.vatRatePercent
        );
        set({ orderDiscountFixed: amount, totals: nextTotals });
      },

      holdCurrentOrder: (customTitle) => {
        const state = get();
        if (state.cart.length === 0) return;

        const holdCount = state.holdOrders.length + 1;
        const newHold: HoldOrder = {
          id: `hold-${Date.now()}`,
          tabTitle: customTitle || `ບິນພັກ #${holdCount}`,
          items: [...state.cart],
          heldAt: new Date().toISOString(),
        };

        set({
          holdOrders: [...state.holdOrders, newHold],
          cart: [],
          totals: INITIAL_TOTALS,
          orderDiscountFixed: 0,
          activeHoldId: null,
        });
      },

      restoreHoldOrder: (holdId) => {
        const state = get();
        const targetHold = state.holdOrders.find((h) => h.id === holdId);
        if (!targetHold) return;

        let nextHolds = state.holdOrders.filter((h) => h.id !== holdId);
        if (state.cart.length > 0) {
          nextHolds.push({
            id: `hold-${Date.now()}`,
            tabTitle: `ບິນ #${nextHolds.length + 1}`,
            items: state.cart,
            heldAt: new Date().toISOString(),
          });
        }

        const nextTotals = computePosTotals(
          targetHold.items,
          state.orderDiscountFixed,
          state.vatRatePercent
        );

        set({
          cart: targetHold.items,
          totals: nextTotals,
          holdOrders: nextHolds,
          activeHoldId: null,
        });
      },

      deleteHoldOrder: (holdId) => {
        const state = get();
        set({ holdOrders: state.holdOrders.filter((h) => h.id !== holdId) });
      },

      deductCartInventory: (cartItems: CartItem[]) => {
        const state = get();
        const updatedProducts = state.products.map((prod) => {
          const matchingItems = cartItems.filter((i) => i.productId === prod.id);
          if (matchingItems.length === 0) return prod;

          let updatedBatches = [...prod.batches];
          for (const item of matchingItems) {
            if (item.allocatedBatch) {
              const deduction = item.quantity * item.selectedUnit.conversion_rate;
              updatedBatches = updatedBatches.map((b) => {
                if (b.id === item.allocatedBatch?.id) {
                  return {
                    ...b,
                    quantity_on_hand: Math.max(0, b.quantity_on_hand - deduction),
                  };
                }
                return b;
              });
            }
          }

          return {
            ...prod,
            batches: updatedBatches,
          };
        });

        set({ products: updatedProducts });
      },

      getTotals: () => {
        return get().totals;
      },
    }),
    {
      name: "lao-pos-cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        totals: state.totals,
        holdOrders: state.holdOrders,
        cashier: state.cashier,
        viewMode: state.viewMode,
      }),
    }
  )
);
