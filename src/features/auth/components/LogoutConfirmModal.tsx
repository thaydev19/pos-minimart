"use client";

// ============================================================================
// LogoutConfirmModal: Modern Confirmation Dialog Replacing Native window.confirm
// Fully Localized in Lao & English with Haptic & Touch Feedback
// ============================================================================

import React from "react";
import { LogOut, X, Loader2 } from "lucide-react";
import { triggerHapticFeedback } from "@/utils/haptics";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  isLoggingOut: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({
  isOpen,
  isLoggingOut,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    triggerHapticFeedback(30);
    onConfirm();
  };

  const handleClose = () => {
    if (isLoggingOut) return;
    triggerHapticFeedback(15);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-sm rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoggingOut}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Warning Icon Container */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-xs border border-rose-100">
          <LogOut className="h-7 w-7" />
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-extrabold text-slate-900">
          ອອກຈາກລະບົບ (Sign Out)
        </h3>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການອອກຈາກລະບົບ? ລະບົບຈະບັນທຶກຂໍ້ມູນທັງໝົດ ແລະ ກັບຄືນສູ່ໜ້າເຂົ້າສູ່ລະບົບຫຼັກ.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoggingOut}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            ຍົກເລີກ (Cancel)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-95 transition-all cursor-pointer disabled:opacity-60 shadow-xs shadow-rose-600/20"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>ກຳລັງອອກ...</span>
              </>
            ) : (
              <>
                <LogOut className="h-3.5 w-3.5" />
                <span>ອອກຈາກລະບົບ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
