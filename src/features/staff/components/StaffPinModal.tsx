"use client";

// ============================================================================
// StaffPinModal: Touch-Screen 6-Digit PIN Pad for Fast Staff Password Updates
// ============================================================================

import React, { useState } from "react";
import { KeyRound, X, Delete, CheckCircle2, ShieldCheck } from "lucide-react";
import { StaffUser, STAFF_ROLES_CONFIG } from "../types/staff.types";
import { triggerHapticFeedback } from "@/utils/haptics";

interface StaffPinModalProps {
  staff: StaffUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePin: (staffId: string, newPin: string) => Promise<void>;
}

export function StaffPinModal({
  staff,
  isOpen,
  onClose,
  onSavePin,
}: StaffPinModalProps) {
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !staff) return null;

  const roleConfig = STAFF_ROLES_CONFIG[staff.role];

  const handleDigit = (digit: string) => {
    triggerHapticFeedback(20);
    setError(null);
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    triggerHapticFeedback(30);
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    triggerHapticFeedback(40);
    setError(null);
    setPin("");
  };

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      setError("ກະລຸນາປ້ອນລະຫັດ PIN ໃຫ້ຄົບ 6 ຕົວເລກ");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSavePin(staff.id, pin);
      onClose();
    } catch (err: any) {
      setError(err.message || "ປ່ຽນລະຫັດ PIN ບໍ່ສຳເລັດ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ປ່ຽນລະຫັດ PIN
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {staff.full_name_lo} ({staff.username})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="flex items-center justify-center">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${roleConfig.badgeClass}`}
          >
            <ShieldCheck className="h-3 w-3" />
            <span>{roleConfig.label_lo}</span>
          </span>
        </div>

        <p className="text-xs text-slate-500 text-center">
          ກະລຸນາປ້ອນລະຫັດ PIN ໃໝ່ 6 ຕົວເລກສຳລັບການປົດລັອກໜ້າ POS
        </p>

        {/* PIN Dots Display */}
        <div className="flex justify-center gap-3 py-2">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`h-4 w-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? "scale-110 bg-emerald-600 shadow-xs shadow-emerald-600/30 ring-2 ring-emerald-200"
                    : "bg-slate-200 border border-slate-300"
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-rose-500 text-center font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
            {error}
          </p>
        )}

        {/* Large Touch Numpad */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDigit(digit)}
              className="min-h-[50px] h-13 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-800 text-xl font-bold font-mono transition-all active:scale-95 shadow-2xs flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClear}
            className="min-h-[50px] h-13 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            ລຶບໝົດ
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleDigit("0")}
            className="min-h-[50px] h-13 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-emerald-800 text-xl font-bold font-mono transition-all active:scale-95 shadow-2xs flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleBackspace}
            className="min-h-[50px] h-13 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[44px] h-11 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pin.length !== 6 || isSubmitting}
            className="min-h-[44px] h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSubmitting ? "ກຳລັງບັນທຶກ..." : "ຢືນຢັນ PIN ໃໝ່"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
