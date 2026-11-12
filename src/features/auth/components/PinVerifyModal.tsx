"use client";

// ============================================================================
// PinVerifyModal: Real Manager PIN Verification Modal for Privileged Overrides
// Zero Hardcoded PINs - Direct DB Check & Automatic Audit Logging
// ============================================================================

import React, { useState } from "react";
import { X, Lock, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "../stores/auth.store";
import { authApi } from "../api/auth.api";

export function PinVerifyModal() {
  const user = useAuthStore((s) => s.user);
  const isPinModalOpen = useAuthStore((s) => s.isPinModalOpen);
  const pinReason = useAuthStore((s) => s.pinReason);
  const closePinModal = useAuthStore((s) => s.closePinModal);
  const onPinSuccessCallback = useAuthStore((s) => s.onPinSuccessCallback);

  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isPinModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPin = pin.trim();
    if (!cleanPin) {
      setErrorMessage("ກະລຸນາປ້ອນລະຫັດ PIN");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authApi.verifyManagerPin(
        cleanPin,
        user?.store_id,
        "MANAGER_OVERRIDE_AUTH",
        user?.id
      );

      if (result.valid) {
        if (onPinSuccessCallback) {
          onPinSuccessCallback();
        }
        closePinModal();
        setPin("");
      } else {
        setErrorMessage(result.error || "ລະຫັດ PIN ຜູ້ຈັດການບໍ່ຖືກຕ້ອງ");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "ກວດສອບ PIN ບໍ່ສຳເລັດ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isLoading && closePinModal()}
      />

      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl z-10 overflow-hidden space-y-4 animate-in zoom-in-95 duration-200 border border-zinc-200">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">
                ຢືນຢັນສິດຜູ້ຈັດການ (Manager Override)
              </h3>
              <p className="text-[10px] text-slate-500 leading-snug">
                {pinReason || "ຕ້ອງການລະຫັດ PIN ຜູ້ຈັດການເພື່ອດຳເນີນການ"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closePinModal}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {errorMessage && (
            <div className="flex items-start gap-1.5 rounded-xl bg-rose-50 border border-rose-200 p-2 text-[11px] text-rose-700 font-semibold animate-in fade-in duration-150">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">
              ປ້ອນລະຫັດ PIN ຜູ້ຈັດການ / ເຈົ້າຂອງຮ້ານ (4-6 ຕົວເລກ)
            </label>
            <input
              type="password"
              maxLength={6}
              required
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              className="h-11 w-full rounded-xl border border-slate-200 text-center font-mono font-extrabold text-xl tracking-[0.3em] text-slate-900 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={closePinModal}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isLoading || !pin}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              <span>ຢືນຢັນ PIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
