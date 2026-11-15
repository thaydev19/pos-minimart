"use client";

// ============================================================================
// Cart Panel: Compact Density (p-2.5, space-y-1.5, h-11 CTA)
// Smart Clear Cart Logic: Role Exemption, Threshold Checks & Void Audit Logging
// ============================================================================

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { usePosStore } from "../stores/pos.store";
import { formatLak } from "@/utils/formatLakCurrency";
import { lo } from "@/constants/locales/lo";
import { CartItemRow } from "./CartItemRow";
import { PaymentModal } from "./PaymentModal";
import { ConfirmPinDialog } from "@/components/ConfirmPinDialog";
import { useAuth } from "@/features/auth";

interface ManagerConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalItems: number;
  totalAmount: number;
}

function ManagerConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  totalItems,
  totalAmount,
}: ManagerConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-3 border border-rose-100">
            <Trash2 className="h-6 w-6" />
          </div>
          <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold mb-2">
            ສິດຜູ້ຈັດການ (Manager Mode) • ບໍ່ຕ້ອງໃສ່ PIN
          </span>
          <h3 className="text-base font-bold text-slate-900">
            ຢືນຢັນການລ້າງກະຕ່າສິນຄ້າ?
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            ທ່ານກຳລັງຈະລ້າງສິນຄ້າ {totalItems} ລາຍການ (ມູນຄ່າ {formatLak(totalAmount)}).
            ກົດ Enter ເພື່ອຢືນຢັນ ຫຼື Esc ເພື່ອຍົກເລີກ.
          </p>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            ຍົກເລີກ (Esc)
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-700 active:scale-95 shadow-sm transition-all cursor-pointer"
          >
            ຢືນຢັນລ້າງ (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}

export function CartPanel() {
  const { user } = useAuth();
  const cart = usePosStore((s) => s.cart);
  const clearCart = usePosStore((s) => s.clearCart);
  const hasAttemptedCheckout = usePosStore((s) => s.hasAttemptedCheckout);
  const recordVoidLog = usePosStore((s) => s.recordVoidLog);
  
  // Stable cached totals selector from store state
  const totals = usePosStore((s) => s.totals);
  const { subtotal, totalDiscount, vatAmount, finalTotal, totalItemCount } = totals;

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isManagerConfirmOpen, setIsManagerConfirmOpen] = useState(false);
  const [pinOverrideReason, setPinOverrideReason] = useState("");

  const isManagerOrAbove =
    user?.role === "owner" ||
    user?.role === "super_admin" ||
    user?.role === "store_manager" ||
    (user?.role as string) === "admin" ||
    (user?.role as string) === "manager";

  const handleClearCartClick = () => {
    if (cart.length === 0) return;

    // 1. Manager / Owner / Admin: Exempt from PIN -> simple confirmation dialog (Enter confirms)
    if (isManagerOrAbove) {
      setIsManagerConfirmOpen(true);
      return;
    }

    // 2. Cashier Role: Check 3 security conditions
    // Condition 1: Total items in cart >= 5
    // Condition 2: Total cart value >= 100,000 Kip
    // Condition 3: Cart has previously opened checkout modal (hasAttemptedCheckout)
    const exceedsItemThreshold = totalItemCount >= 5 || cart.length >= 5;
    const exceedsAmountThreshold = finalTotal >= 100000;
    const requiresManagerPin =
      exceedsItemThreshold || exceedsAmountThreshold || hasAttemptedCheckout;

    if (requiresManagerPin) {
      let reason = "ການອະນຸມັດລ້າງກະຕ່າສິນຄ້າ (Manager Authorization)";
      if (hasAttemptedCheckout) {
        reason = "ບິນນີ້ເຄີຍເປີດໜ້າຊຳລະເງິນແລ້ວ (ກວດສອບຄວາມປອດໄພ)";
      } else if (exceedsAmountThreshold) {
        reason = "ຍອດເງິນສິນຄ້າ ≥ 100.000 ₭ (ເກີນຂອບເຂດກຳນົດ)";
      } else if (exceedsItemThreshold) {
        reason = "ຈຳນວນສິນຄ້າໃນກະຕ່າ ≥ 5 ລາຍການ";
      }

      setPinOverrideReason(reason);
      setIsPinDialogOpen(true);
    } else {
      // 3. Small cashier scanning mistake (1-4 small items, < 100k, never opened checkout)
      // Allow fast clearance without PIN, but automatically record to voidLogs
      recordVoidLog("Cashier quick clear (under threshold)", cart, finalTotal);
      clearCart();
      toast.success("ລ້າງກະຕ່າສຳເລັດແລ້ວ (ບັນທຶກປະຫວັດການຍົກເລີກ)");
    }
  };

  const handleManagerConfirmSuccess = () => {
    setIsManagerConfirmOpen(false);
    recordVoidLog(
      "Manager confirmed cart clear",
      cart,
      finalTotal,
      user?.full_name_lo || user?.username || "Manager"
    );
    clearCart();
    toast.success("ລ້າງກະຕ່າສຳເລັດແລ້ວ");
  };

  const handlePinSuccess = () => {
    setIsPinDialogOpen(false);
    recordVoidLog(
      `Manager PIN override authorized: ${pinOverrideReason}`,
      cart,
      finalTotal,
      "Manager PIN"
    );
    clearCart();
    toast.success("ຜູ້ຈັດການອະນຸມັດລ້າງກະຕ່າແລ້ວ");
  };

  // Listen for F4 trigger event from global shortcuts
  useEffect(() => {
    const handleTrigger = () => {
      handleClearCartClick();
    };
    window.addEventListener("pos:trigger-clear-cart", handleTrigger);
    return () => window.removeEventListener("pos:trigger-clear-cart", handleTrigger);
  }, [cart, totalItemCount, finalTotal, hasAttemptedCheckout, isManagerOrAbove]);

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
          <motion.span
            key={totalItemCount}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.18 }}
            className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[11px] font-bold text-slate-700 tabular-nums"
          >
            {totalItemCount}
          </motion.span>
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
          <AnimatePresence initial={false} mode="popLayout">
            {cart.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </AnimatePresence>
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

          <motion.div
            key={finalTotal}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold tabular-nums"
          >
            <span>{formatLak(finalTotal)}</span>
            <ArrowRight className="h-4 w-4" />
          </motion.div>
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
        actionTitle={pinOverrideReason || "ການອະນຸມັດລ້າງກະຕ່າສິນຄ້າ (Clear Cart Override)"}
      />

      <ManagerConfirmDialog
        isOpen={isManagerConfirmOpen}
        onClose={() => setIsManagerConfirmOpen(false)}
        onConfirm={handleManagerConfirmSuccess}
        totalItems={totalItemCount}
        totalAmount={finalTotal}
      />
    </div>
  );
}
