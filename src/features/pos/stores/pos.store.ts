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

export interface PosBillTab {
  id: string;
  tabTitle: string;
  items: CartItem[];
  heldAt?: string;
}

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
  bills: PosBillTab[];
  activeBillId: string;
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
  holdCurrentOrder: (customTitle?: string) => boolean;
  restoreHoldOrder: (holdId: string) => void;
  deleteHoldOrder: (holdId: string) => void;
  switchBill: (billId: string) => void;
  deleteBill: (billId: string) => void;
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
      bills: [
        {
          id: "bill-1",
          tabTitle: "ບິນ #1",
          items: [],
        },
      ],
      activeBillId: "bill-1",
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

        const currentActiveId = state.activeBillId || "bill-1";
        const currentBills = state.bills && state.bills.length > 0
          ? state.bills
          : [{ id: currentActiveId, tabTitle: "ບິນ #1", items: [] }];
        const nextBills = currentBills.map((b) =>
          b.id === currentActiveId ? { ...b, items: nextCart } : b
        );

        set({ cart: nextCart, totals: nextTotals, bills: nextBills });
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

        const currentActiveId = state.activeBillId || "bill-1";
        const currentBills = state.bills && state.bills.length > 0
          ? state.bills
          : [{ id: currentActiveId, tabTitle: "ບິນ #1", items: [] }];
        const nextBills = currentBills.map((b) =>
          b.id === currentActiveId ? { ...b, items: nextCart } : b
        );

        set({ cart: nextCart, totals: nextTotals, bills: nextBills });
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

        const currentActiveId = state.activeBillId || "bill-1";
        const currentBills = state.bills && state.bills.length > 0
          ? state.bills
          : [{ id: currentActiveId, tabTitle: "ບິນ #1", items: [] }];
        const nextBills = currentBills.map((b) =>
          b.id === currentActiveId ? { ...b, items: nextCart } : b
        );

        set({ cart: nextCart, totals: nextTotals, bills: nextBills });
      },

      removeItem: (itemId) => {
        const state = get();
        const nextCart = state.cart.filter((item) => item.id !== itemId);
        const nextTotals = computePosTotals(
          nextCart,
          state.orderDiscountFixed,
          state.vatRatePercent
        );

        const currentActiveId = state.activeBillId || "bill-1";
        const currentBills = state.bills && state.bills.length > 0
          ? state.bills
          : [{ id: currentActiveId, tabTitle: "ບິນ #1", items: [] }];
        const nextBills = currentBills.map((b) =>
          b.id === currentActiveId ? { ...b, items: nextCart } : b
        );

        set({ cart: nextCart, totals: nextTotals, bills: nextBills });
      },

      clearCart: () => {
        const state = get();
        const currentActiveId = state.activeBillId || "bill-1";
        const currentBills = state.bills && state.bills.length > 0
          ? state.bills
          : [{ id: currentActiveId, tabTitle: "ບິນ #1", items: [] }];
        const nextBills = currentBills.map((b) =>
          b.id === currentActiveId ? { ...b, items: [] } : b
        );

        set({
          cart: [],
          totals: INITIAL_TOTALS,
          orderDiscountFixed: 0,
          bills: nextBills,
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
        if (state.cart.length === 0) return false;

        const currentActiveId = state.activeBillId || "bill-1";
        const currentBills = state.bills && state.bills.length > 0
          ? state.bills
          : [{ id: currentActiveId, tabTitle: "ບິນ #1", items: [] }];

        // 1. Update current bill with current cart items
        const updatedCurrentBills = currentBills.map((b) =>
          b.id === currentActiveId ? { ...b, items: [...state.cart], heldAt: new Date().toISOString() } : b
        );

        // 2. Find next available index (#1, #2, #3...)
        let index = 1;
        while (updatedCurrentBills.some((b) => b.tabTitle === `ບິນ #${index}`)) {
          index++;
        }
        const billTitle = customTitle || `ບິນ #${index}`;
        const newBillId = `bill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        const newBill: PosBillTab = {
          id: newBillId,
          tabTitle: billTitle,
          items: [],
        };

        const nextBills = [...updatedCurrentBills, newBill];

        set({
          bills: nextBills,
          activeBillId: newBillId,
          cart: [],
          totals: INITIAL_TOTALS,
          orderDiscountFixed: 0,
          holdOrders: nextBills
            .filter((b) => b.id !== newBillId)
            .map((b) => ({
              id: b.id,
              tabTitle: b.tabTitle,
              items: b.items,
              heldAt: b.heldAt || new Date().toISOString(),
            })),
        });
        return true;
      },

      switchBill: (billId) => {
        const state = get();
        if (billId === state.activeBillId) return;

        const currentActiveId = state.activeBillId || "bill-1";
        const currentBills = state.bills && state.bills.length > 0
          ? state.bills
          : [{ id: currentActiveId, tabTitle: "ບິນ #1", items: [] }];

        // 1. Save current cart into current active bill
        const updatedBills = currentBills.map((b) =>
          b.id === currentActiveId ? { ...b, items: [...state.cart] } : b
        );

        const targetBill = updatedBills.find((b) => b.id === billId);
        if (!targetBill) return;

        const nextTotals = computePosTotals(
          targetBill.items,
          0,
          state.vatRatePercent
        );

        set({
          bills: updatedBills,
          activeBillId: billId,
          cart: [...targetBill.items],
          totals: nextTotals,
          orderDiscountFixed: 0,
          holdOrders: updatedBills
            .filter((b) => b.id !== billId)
            .map((b) => ({
              id: b.id,
              tabTitle: b.tabTitle,
              items: b.items,
              heldAt: b.heldAt || new Date().toISOString(),
            })),
        });
      },

      deleteBill: (billId) => {
        const state = get();
        const currentBills = state.bills && state.bills.length > 0
          ? state.bills
          : [{ id: "bill-1", tabTitle: "ບິນ #1", items: [] }];

        if (currentBills.length <= 1) {
          const defaultBill: PosBillTab = { id: "bill-1", tabTitle: "ບິນ #1", items: [] };
          set({
            bills: [defaultBill],
            activeBillId: "bill-1",
            cart: [],
            totals: INITIAL_TOTALS,
            orderDiscountFixed: 0,
            holdOrders: [],
          });
          return;
        }

        const nextBills = currentBills.filter((b) => b.id !== billId);

        if (billId === state.activeBillId) {
          const newActive = nextBills[nextBills.length - 1];
          const nextTotals = computePosTotals(
            newActive.items,
            0,
            state.vatRatePercent
          );
          set({
            bills: nextBills,
            activeBillId: newActive.id,
            cart: [...newActive.items],
            totals: nextTotals,
            orderDiscountFixed: 0,
            holdOrders: nextBills
              .filter((b) => b.id !== newActive.id)
              .map((b) => ({
                id: b.id,
                tabTitle: b.tabTitle,
                items: b.items,
                heldAt: b.heldAt || new Date().toISOString(),
              })),
          });
        } else {
          set({
            bills: nextBills,
            holdOrders: nextBills
              .filter((b) => b.id !== state.activeBillId)
              .map((b) => ({
                id: b.id,
                tabTitle: b.tabTitle,
                items: b.items,
                heldAt: b.heldAt || new Date().toISOString(),
              })),
          });
        }
      },

      restoreHoldOrder: (holdId) => {
        get().switchBill(holdId);
      },

      deleteHoldOrder: (holdId) => {
        get().deleteBill(holdId);
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
        bills: state.bills,
        activeBillId: state.activeBillId,
        holdOrders: state.holdOrders,
        cashier: state.cashier,
        viewMode: state.viewMode,
      }),
    }
  )
);
