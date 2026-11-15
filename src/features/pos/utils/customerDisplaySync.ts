// ============================================================================
// Customer Display Real-Time Synchronization - Unified State Engine
// Quad-Tier Sync: In-Memory + BroadcastChannel + LocalStorage Event + Tauri Event
// Guarantees 0ms Live Sync across:
// 1. In-App Floating Preview (Same Window)
// 2. Dual-Monitor Desktop (Tauri WebviewWindow / Multi-Screen)
// 3. Dual-Screen Hardware POS (Android Presentation / Sunmi / iMin)
// 4. Browser Popups & Tabs
// ============================================================================

import { CartItem, PosTotals } from "../types/pos.types";

export const CUSTOMER_DISPLAY_CHANNEL = "lao_minimart_customer_display";
export const STORAGE_SYNC_KEY = "lao_customer_display_sync_state";
export const STORAGE_PAYLOAD_KEY = "lao_customer_display_payload";

export type CustomerDisplayStep = "IDLE" | "CART" | "PAYMENT" | "SUCCESS";
export type CustomerPaymentMethod = "CASH" | "QR" | "SPLIT";

export interface CustomerDisplayItem {
  id: string;
  name: string;
  unitName: string;
  isPack: boolean;
  packSize: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface CustomerDisplayPaymentState {
  isOpen: boolean;
  method: CustomerPaymentMethod;
  qrPayload: string;
  qrAmount: number;
  cashReceived: number;
  changeAmount: number;
}

export interface CustomerDisplayPayload {
  step: CustomerDisplayStep;
  cartItems: CustomerDisplayItem[];
  subtotal: number;
  discount: number;
  rounding: number;
  totalAmount: number;
  totalQuantity: number;
  payment: CustomerDisplayPaymentState;
  storeName?: string;
  cashierName?: string;
  lastUpdated: number;

  // Backward compatibility fields
  type?: string;
  items?: CustomerDisplayItem[];
  subtotalAmount?: number;
  discountAmount?: number;
}

// Backward-compatible message types
export type CustomerDisplayMessageType =
  | "SYNC_CART"
  | "PAYMENT_QR"
  | "ORDER_SUCCESS"
  | "IDLE"
  | "REQUEST_INITIAL_STATE"
  | "REQUEST_CUSTOMER_DISPLAY_SYNC"
  | "CUSTOMER_DISPLAY_READY"
  | "CUSTOMER_DISPLAY_PING"
  | "CUSTOMER_DISPLAY_PONG";

export interface CustomerDisplayMessage extends Partial<CustomerDisplayPayload> {
  type: CustomerDisplayMessageType;
  timestamp?: number;
  qrCodeData?: string;
  tenderedAmount?: number;
  changeAmount?: number;
  paymentMethod?: "cash" | "lao_qr" | "mixed" | CustomerPaymentMethod;
}

// Default initial payload
export const DEFAULT_CUSTOMER_DISPLAY_PAYLOAD: CustomerDisplayPayload = {
  step: "IDLE",
  cartItems: [],
  subtotal: 0,
  discount: 0,
  rounding: 0,
  totalAmount: 0,
  totalQuantity: 0,
  payment: {
    isOpen: false,
    method: "CASH",
    qrPayload: "/QR.png",
    qrAmount: 0,
    cashReceived: 0,
    changeAmount: 0,
  },
  storeName: "ມິນິມາດ ລາວຈະເລີນ",
  cashierName: "Thu ngân",
  lastUpdated: Date.now(),
};

// 1. In-memory event bus
const payloadListeners = new Set<(payload: CustomerDisplayPayload) => void>();
const rawMessageListeners = new Set<(msg: CustomerDisplayMessage) => void>();

// Active state holder in memory
let activePayload: CustomerDisplayPayload = { ...DEFAULT_CUSTOMER_DISPLAY_PAYLOAD };
let successTimeoutRef: NodeJS.Timeout | null = null;

// Initialize activePayload from localStorage if available
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(STORAGE_PAYLOAD_KEY) || localStorage.getItem(STORAGE_SYNC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        activePayload = {
          ...DEFAULT_CUSTOMER_DISPLAY_PAYLOAD,
          ...parsed,
          payment: {
            ...DEFAULT_CUSTOMER_DISPLAY_PAYLOAD.payment,
            ...(parsed.payment || {}),
          },
        };
      }
    }
  } catch {}
}

// 2. BroadcastChannel for cross-window / cross-tab communication
let channelInstance: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  if (!channelInstance) {
    try {
      channelInstance = new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL);
    } catch (e) {
      console.warn("[CustomerDisplaySync] Could not initialize BroadcastChannel:", e);
    }
  }
  return channelInstance;
}

/**
 * Maps POS CartItem to CustomerDisplayItem with clear Pack/Base unit logic
 */
export function mapCartItemToDisplayItem(item: CartItem): CustomerDisplayItem {
  const isPack =
    !item.selectedUnit.is_base_unit && (item.selectedUnit.conversion_rate || 1) > 1;

  return {
    id: item.id,
    name: item.name,
    unitName: item.selectedUnit.unit_name || "ອັນ",
    isPack,
    packSize: item.selectedUnit.conversion_rate || 1,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.totalPrice,
    imageUrl: item.imageUrl,
  };
}

/**
 * Reads cached state from localStorage (useful for instant hydration on mount)
 */
export function getLatestCustomerDisplayPayload(): CustomerDisplayPayload {
  if (typeof window === "undefined") return activePayload;
  try {
    const raw = localStorage.getItem(STORAGE_PAYLOAD_KEY) || localStorage.getItem(STORAGE_SYNC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          ...DEFAULT_CUSTOMER_DISPLAY_PAYLOAD,
          ...parsed,
          payment: {
            ...DEFAULT_CUSTOMER_DISPLAY_PAYLOAD.payment,
            ...(parsed.payment || {}),
          },
        };
      }
    }
  } catch {}
  return activePayload;
}

export function getLatestCustomerDisplayState(): CustomerDisplayMessage | null {
  const payload = getLatestCustomerDisplayPayload();
  return {
    ...payload,
    type:
      payload.step === "PAYMENT"
        ? "PAYMENT_QR"
        : payload.step === "SUCCESS"
        ? "ORDER_SUCCESS"
        : payload.step === "CART"
        ? "SYNC_CART"
        : "IDLE",
    items: payload.cartItems,
    subtotalAmount: payload.subtotal,
    discountAmount: payload.discount,
  };
}

/**
 * Broadcasts unified payload to all subscribers (In-Memory, BroadcastChannel, LocalStorage, Tauri)
 */
export function broadcastCustomerDisplayPayload(payload: CustomerDisplayPayload) {
  activePayload = {
    ...payload,
    lastUpdated: Date.now(),
    type:
      payload.step === "PAYMENT"
        ? "PAYMENT_QR"
        : payload.step === "SUCCESS"
        ? "ORDER_SUCCESS"
        : payload.step === "CART"
        ? "SYNC_CART"
        : "IDLE",
    items: payload.cartItems,
    subtotalAmount: payload.subtotal,
    discountAmount: payload.discount,
  };

  // 1. In-memory dispatch
  payloadListeners.forEach((listener) => {
    try {
      listener(activePayload);
    } catch (err) {
      console.warn("[CustomerDisplaySync] In-memory listener error:", err);
    }
  });

  rawMessageListeners.forEach((listener) => {
    try {
      listener(activePayload as CustomerDisplayMessage);
    } catch {}
  });

  // 2. BroadcastChannel dispatch
  try {
    const ch = getBroadcastChannel();
    if (ch) {
      ch.postMessage(activePayload);
    }
  } catch (err) {
    console.warn("[CustomerDisplaySync] BroadcastChannel error:", err);
  }

  // 3. LocalStorage persistence & StorageEvent
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const jsonStr = JSON.stringify(activePayload);
      localStorage.setItem(STORAGE_PAYLOAD_KEY, jsonStr);
      localStorage.setItem(STORAGE_SYNC_KEY, jsonStr);
    } catch {}
  }

  // 4. Tauri Event dispatch (if running inside Tauri)
  if (typeof window !== "undefined") {
    try {
      const tauri = (window as any).__TAURI__;
      if (tauri?.event?.emit) {
        tauri.event.emit("customer-display-payload", activePayload);
      }
    } catch {}
  }
}

/**
 * Re-broadcasts current active state without altering any payment or step values
 */
export function broadcastCurrentCustomerDisplayState() {
  broadcastCustomerDisplayPayload(activePayload);
}

/**
 * Synchronizes cart items & totals from POS Cart.
 * CRITICAL ANTI-OVERWRITE LOGIC:
 * If Payment Modal is currently open, step remains 'PAYMENT' and payment state is retained!
 * If Success step is actively showing (< 4s), cart updates do not interrupt it.
 */
export function updateCartOnCustomerDisplay(
  cart: CartItem[],
  totals: PosTotals,
  extra?: { storeName?: string; cashierName?: string }
) {
  const displayItems = cart.map(mapCartItemToDisplayItem);
  const totalQuantity = displayItems.reduce((acc, item) => acc + item.quantity, 0);

  // If currently in SUCCESS state, do not interrupt the 4s celebration
  if (activePayload.step === "SUCCESS") {
    return;
  }

  // Determine step: if payment is open, DO NOT revert to CART or IDLE!
  let nextStep: CustomerDisplayStep = "IDLE";
  if (activePayload.payment.isOpen) {
    nextStep = "PAYMENT";
  } else if (displayItems.length > 0) {
    nextStep = "CART";
  } else {
    nextStep = "IDLE";
  }

  const nextPayload: CustomerDisplayPayload = {
    ...activePayload,
    step: nextStep,
    cartItems: displayItems,
    subtotal: totals.subtotal,
    discount: totals.totalDiscount,
    rounding: totals.finalTotal - (totals.subtotal - totals.totalDiscount + totals.vatAmount),
    totalAmount: totals.finalTotal,
    totalQuantity,
    storeName: extra?.storeName || activePayload.storeName,
    cashierName: extra?.cashierName || activePayload.cashierName,
    payment: {
      ...activePayload.payment,
      // If payment is open, ensure qrAmount matches current total if method is QR
      qrAmount:
        activePayload.payment.method === "QR"
          ? totals.finalTotal
          : activePayload.payment.qrAmount,
    },
    lastUpdated: Date.now(),
  };

  broadcastCustomerDisplayPayload(nextPayload);
}

/**
 * Triggered when Cashier opens the Payment Modal
 */
export function openPaymentOnCustomerDisplay(data: {
  method: CustomerPaymentMethod;
  qrPayload?: string;
  qrAmount: number;
  cashReceived: number;
  changeAmount: number;
  totalAmount?: number;
}) {
  if (successTimeoutRef) {
    clearTimeout(successTimeoutRef);
    successTimeoutRef = null;
  }

  const nextPayload: CustomerDisplayPayload = {
    ...activePayload,
    step: "PAYMENT",
    totalAmount: data.totalAmount !== undefined ? data.totalAmount : activePayload.totalAmount,
    payment: {
      isOpen: true,
      method: data.method,
      qrPayload: data.qrPayload || "/QR.png",
      qrAmount: data.qrAmount,
      cashReceived: data.cashReceived,
      changeAmount: data.changeAmount,
    },
    lastUpdated: Date.now(),
  };

  broadcastCustomerDisplayPayload(nextPayload);
}

/**
 * Triggered when Cashier changes payment tab, types cash amount, or toggles split tender
 */
export function updatePaymentMethodOnCustomerDisplay(
  data: Partial<CustomerDisplayPaymentState> & { totalAmount?: number }
) {
  const nextPayload: CustomerDisplayPayload = {
    ...activePayload,
    step: "PAYMENT",
    totalAmount: data.totalAmount !== undefined ? data.totalAmount : activePayload.totalAmount,
    payment: {
      ...activePayload.payment,
      isOpen: true,
      ...data,
      qrPayload: data.qrPayload || activePayload.payment.qrPayload || "/QR.png",
    },
    lastUpdated: Date.now(),
  };

  broadcastCustomerDisplayPayload(nextPayload);
}

/**
 * Triggered when Cashier closes the Payment Modal without finishing payment
 */
export function closePaymentOnCustomerDisplay() {
  const nextStep: CustomerDisplayStep =
    activePayload.cartItems.length > 0 ? "CART" : "IDLE";

  const nextPayload: CustomerDisplayPayload = {
    ...activePayload,
    step: nextStep,
    payment: {
      ...activePayload.payment,
      isOpen: false,
    },
    lastUpdated: Date.now(),
  };

  broadcastCustomerDisplayPayload(nextPayload);
}

/**
 * Triggered upon successful transaction completion.
 * Displays STEP 4 (SUCCESS) for exactly 4 seconds, then smoothly returns to STEP 1 (IDLE).
 */
export function completePaymentOnCustomerDisplay(data: {
  totalAmount: number;
  cashReceived?: number;
  changeAmount?: number;
  paymentMethod: CustomerPaymentMethod;
}) {
  if (successTimeoutRef) {
    clearTimeout(successTimeoutRef);
  }

  const nextPayload: CustomerDisplayPayload = {
    ...activePayload,
    step: "SUCCESS",
    totalAmount: data.totalAmount,
    payment: {
      isOpen: false,
      method: data.paymentMethod,
      qrPayload: "/QR.png",
      qrAmount: data.paymentMethod === "QR" ? data.totalAmount : 0,
      cashReceived: data.cashReceived || 0,
      changeAmount: data.changeAmount || 0,
    },
    lastUpdated: Date.now(),
  };

  broadcastCustomerDisplayPayload(nextPayload);

  // Automatically transition to STEP 1 (IDLE) after exactly 4 seconds
  successTimeoutRef = setTimeout(() => {
    resetCustomerDisplayToIdle();
  }, 4000);
}

/**
 * Resets the Customer Display to clean IDLE state (Welcome Screen)
 */
export function resetCustomerDisplayToIdle() {
  if (successTimeoutRef) {
    clearTimeout(successTimeoutRef);
    successTimeoutRef = null;
  }

  const idlePayload: CustomerDisplayPayload = {
    step: "IDLE",
    cartItems: [],
    subtotal: 0,
    discount: 0,
    rounding: 0,
    totalAmount: 0,
    totalQuantity: 0,
    payment: {
      isOpen: false,
      method: "CASH",
      qrPayload: "/QR.png",
      qrAmount: 0,
      cashReceived: 0,
      changeAmount: 0,
    },
    storeName: activePayload.storeName,
    cashierName: activePayload.cashierName,
    lastUpdated: Date.now(),
  };

  broadcastCustomerDisplayPayload(idlePayload);
}

/**
 * Proactively requested by Customer Display window upon mount or focus
 */
export function requestCustomerDisplaySync() {
  const reqMsg: CustomerDisplayMessage = {
    type: "REQUEST_CUSTOMER_DISPLAY_SYNC",
    timestamp: Date.now(),
  };

  // Broadcast through all channels
  try {
    const ch = getBroadcastChannel();
    if (ch) ch.postMessage(reqMsg);
  } catch {}

  rawMessageListeners.forEach((l) => {
    try {
      l(reqMsg);
    } catch {}
  });

  if (typeof window !== "undefined") {
    try {
      const tauri = (window as any).__TAURI__;
      if (tauri?.event?.emit) {
        tauri.event.emit("request-customer-display-sync", {});
      }
    } catch {}
  }
}

/**
 * Subscribes a listener to the Customer Display updates
 */
export function subscribeCustomerDisplay(
  callback: (payload: CustomerDisplayPayload | CustomerDisplayMessage) => void
): () => void {
  const payloadCallback = (p: CustomerDisplayPayload) => callback(p);
  const rawCallback = (m: CustomerDisplayMessage) => callback(m);

  payloadListeners.add(payloadCallback);
  rawMessageListeners.add(rawCallback);

  // 1. BroadcastChannel listener
  const ch = getBroadcastChannel();
  const bcHandler = (event: MessageEvent<any>) => {
    if (event.data && typeof event.data === "object") {
      if (event.data.step) {
        activePayload = { ...event.data };
        callback(event.data);
      } else if (event.data.type) {
        callback(event.data);
      }
    }
  };

  if (ch) {
    ch.addEventListener("message", bcHandler);
  }

  // 2. StorageEvent listener
  const storageHandler = (event: StorageEvent) => {
    if (
      (event.key === STORAGE_PAYLOAD_KEY || event.key === STORAGE_SYNC_KEY) &&
      event.newValue
    ) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed.step) {
          activePayload = { ...parsed };
          callback(parsed);
        } else {
          callback(parsed);
        }
      } catch {}
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", storageHandler);
  }

  // 3. Tauri Event listener
  let unlistenTauri: (() => void) | null = null;
  if (typeof window !== "undefined") {
    try {
      const tauri = (window as any).__TAURI__;
      if (tauri?.event?.listen) {
        tauri.event
          .listen("customer-display-payload", (event: { payload: CustomerDisplayPayload }) => {
            if (event.payload && event.payload.step) {
              activePayload = { ...event.payload };
              callback(event.payload);
            }
          })
          .then((unlisten: any) => {
            unlistenTauri = unlisten;
          });
      }
    } catch {}
  }

  return () => {
    payloadListeners.delete(payloadCallback);
    rawMessageListeners.delete(rawCallback);
    if (ch) {
      ch.removeEventListener("message", bcHandler);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", storageHandler);
    }
    if (unlistenTauri) {
      unlistenTauri();
    }
  };
}

// ============================================================================
// Backward-Compatibility Helpers
// ============================================================================

export function broadcastToCustomerDisplay(msg: CustomerDisplayMessage) {
  if (msg.type === "REQUEST_INITIAL_STATE" || msg.type === "REQUEST_CUSTOMER_DISPLAY_SYNC") {
    broadcastCurrentCustomerDisplayState();
    return;
  }
  if (msg.type === "IDLE") {
    resetCustomerDisplayToIdle();
    return;
  }
  if (msg.type === "CUSTOMER_DISPLAY_READY" || msg.type === "CUSTOMER_DISPLAY_PING") {
    broadcastCurrentCustomerDisplayState();
    return;
  }

  rawMessageListeners.forEach((l) => {
    try {
      l(msg);
    } catch {}
  });

  const ch = getBroadcastChannel();
  if (ch) {
    try {
      ch.postMessage(msg);
    } catch {}
  }
}

export function broadcastCartState(
  cart: CartItem[],
  totals: PosTotals,
  type: CustomerDisplayMessageType = "SYNC_CART",
  extra?: Partial<CustomerDisplayMessage>
) {
  if (type === "ORDER_SUCCESS") {
    completePaymentOnCustomerDisplay({
      totalAmount: extra?.totalAmount || totals.finalTotal,
      cashReceived: extra?.tenderedAmount || 0,
      changeAmount: extra?.changeAmount || 0,
      paymentMethod:
        extra?.paymentMethod === "lao_qr"
          ? "QR"
          : extra?.paymentMethod === "mixed"
          ? "SPLIT"
          : "CASH",
    });
    return;
  }

  if (type === "PAYMENT_QR") {
    openPaymentOnCustomerDisplay({
      method: "QR",
      qrPayload: "/QR.png",
      qrAmount: extra?.totalAmount || totals.finalTotal,
      cashReceived: 0,
      changeAmount: 0,
      totalAmount: extra?.totalAmount || totals.finalTotal,
    });
    return;
  }

  updateCartOnCustomerDisplay(cart, totals, {
    storeName: extra?.storeName,
    cashierName: extra?.cashierName,
  });
}

export function requestInitialCustomerDisplayState() {
  requestCustomerDisplaySync();
}
