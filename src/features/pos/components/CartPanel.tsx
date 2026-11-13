"use client";

// ============================================================================
// Cart Panel: Compact Density (p-2.5, space-y-1.5, h-11 CTA)
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { usePosStore } from "../stores/pos.store";
import { formatLak } from "@/utils/formatLakCurrency";
import { lo } from "@/constants/locales/lo";
import { CartItemRow } from "./CartItemRow";
import { PaymentModal } from "./PaymentModal";
import { ConfirmPinDialog } from "@/components/ConfirmPinDialog";

export function CartPanel() {
  const cart = usePosStore((s) => s.cart);
  const clearCart = usePosStore((s) => s.clearCart);
  
  // Stable cached totals selector from store state
  const totals = usePosStore((s) => s.totals);
  const { subtotal, totalDiscount, vatAmount, finalTotal, totalItemCount } = totals;

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinActionTarget, setPinActionTarget] = useState<"clear_cart" | "discount">("clear_cart");

  const handleClearCartClick = () => {
    if (cart.length === 0) return;
    if (cart.length >= 3) {
      setPinActionTarget("clear_cart");
      setIsPinDialogOpen(true);
    } else {
      clearCart();
    }
  };

  const handlePinSuccess = () => {
    setIsPinDialogOpen(false);
    if (pinActionTarget === "clear_cart") {
      clearCart();
    }
  };

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {/* 1. Cart Title Header (Compact py-2.5) */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 select-none">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <ShoppingCart className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-800">
            {lo.pos.cartTitle}
          </h2>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[11px] font-bold text-slate-700 tabular-nums">
            {totalItemCount}
          </span>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={handleClearCartClick}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="ລ້າງກະຕ່າ (F4)"
          >
            <Trash2 className="h-3 w-3" />
            <span>{lo.pos.clearCartBtn} (F4)</span>
          </button>
        )}
      </div>

      {/* 2. Cart Items Scroll Area (space-y-1 for compact multi-item view) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-4 text-slate-400 select-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-2 border border-slate-100">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              {lo.pos.cartEmpty}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px] leading-relaxed">
              {lo.pos.cartEmptySubtitle}
            </p>
          </div>
        ) : (
          cart.map((item) => <CartItemRow key={item.id} item={item} />)
        )}
      </div>

      {/* 3. Totals Calculation & Compact Checkout CTA */}
      <div className="border-t border-slate-200/90 bg-slate-50/50 p-3 select-none">
        <div className="space-y-1 mb-2.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>{lo.pos.subtotal}</span>
            <span className="font-semibold tabular-nums text-slate-900">
              {formatLak(subtotal)}
            </span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>{lo.pos.discount}</span>
              <span className="font-semibold tabular-nums">
                -{formatLak(totalDiscount)}
              </span>
            </div>
          )}

          {vatAmount > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>{lo.pos.vat}</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {formatLak(vatAmount)}
              </span>
            </div>
          )}

          <div className="flex items-baseline justify-between border-t border-slate-200 pt-1.5">
            <span className="text-sm font-extrabold text-slate-900">
              {lo.pos.total}
            </span>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              {formatLak(finalTotal)}
            </span>
          </div>
        </div>

        <motion.button
          type="button"
          disabled={cart.length === 0}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsPaymentOpen(true)}
          className="flex h-11 sm:h-12 w-full items-center justify-between rounded-xl bg-emerald-600 px-4 font-bold text-white shadow-xs hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-emerald-700/80 px-1.5 py-0.5 text-[10px] font-mono font-bold">
              F8
            </span>
            <span className="text-xs sm:text-sm">{lo.pos.checkoutBtn}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold tabular-nums">
            <span>{formatLak(finalTotal)}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </motion.button>
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />

      <ConfirmPinDialog
        isOpen={isPinDialogOpen}
        onClose={() => setIsPinDialogOpen(false)}
        onSuccess={handlePinSuccess}
        actionTitle="ການອະນຸມັດລ້າງກະຕ່າສິນຄ້າ (Clear Cart Override)"
      />
    </div>
  );
}
