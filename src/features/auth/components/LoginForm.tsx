"use client";

// ============================================================================
// LoginForm: Enterprise Dual-Mode Authentication (Email & Touch Staff PIN)
// 100% Real Supabase Auth + Touch Numpad for Fast POS Cashier Access
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Crown,
  UserCheck,
  ShoppingCart,
  KeyRound,
  Delete,
  Users,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useStaffList } from "@/features/staff/hooks/useStaff";
import { StaffUser, STAFF_ROLES_CONFIG } from "@/features/staff/types/staff.types";
import { triggerHapticFeedback } from "@/utils/haptics";

export function LoginForm() {
  const router = useRouter();
  const { login, loginWithPin } = useAuth();
  const { data: staffList = [], isLoading: isLoadingStaff } = useStaffList();

  // Active Login Mode Tab: "email" | "pin"
  const [activeTab, setActiveTab] = useState<"email" | "pin">("email");

  // Email/Password State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Staff PIN State
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [pinDigits, setPinDigits] = useState<string>("");

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter active staff for PIN login
  const activeStaffList = staffList.filter((s) => s.is_active);

  // --------------------------------------------------------------------------
  // Email Login Handler
  // --------------------------------------------------------------------------
  const executeEmailLogin = async (targetEmail: string, targetPassword: string) => {
    setErrorMessage(null);

    const cleanEmail = targetEmail.trim();
    const cleanPassword = targetPassword.trim();
    if (!cleanEmail || !cleanPassword) {
      setErrorMessage("ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານໃຫ້ຄົບຖ້ວນ");
      return;
    }

    setIsLoading(true);

    try {
      await login({ email: cleanEmail, password: cleanPassword });
      router.push("/pos");
    } catch (err: any) {
      setErrorMessage(err.message || "ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ ກະລຸນາກວດສອບອີກຄັ້ງ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeEmailLogin(email, password);
  };

  const handleQuickLogin = async (targetEmail: string, targetPassword: string) => {
    setEmail(targetEmail);
    setPassword(targetPassword);
    await executeEmailLogin(targetEmail, targetPassword);
  };

  // --------------------------------------------------------------------------
  // Staff PIN Login Handler
  // --------------------------------------------------------------------------
  const executePinLogin = useCallback(
    async (staff: StaffUser, pinCode: string) => {
      setErrorMessage(null);
      setIsLoading(true);

      try {
        await loginWithPin(staff.id, pinCode);
        triggerHapticFeedback(50);
        router.push("/pos");
      } catch (err: any) {
        triggerHapticFeedback(100);
        setErrorMessage(err.message || "ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ ກະລຸນາກວດສອບອີກຄັ້ງ");
        setPinDigits("");
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithPin, router]
  );

  const handleNumpadPress = (num: string) => {
    if (isLoading || pinDigits.length >= 6) return;
    triggerHapticFeedback(20);
    const nextPin = pinDigits + num;
    setPinDigits(nextPin);

    // Auto verify when 6th digit is reached
    if (nextPin.length === 6 && selectedStaff) {
      executePinLogin(selectedStaff, nextPin);
    }
  };

  const handleNumpadBackspace = () => {
    if (isLoading || pinDigits.length === 0) return;
    triggerHapticFeedback(20);
    setPinDigits((prev) => prev.slice(0, -1));
  };

  const handleNumpadClear = () => {
    if (isLoading) return;
    triggerHapticFeedback(15);
    setPinDigits("");
    setErrorMessage(null);
  };

  // Physical keyboard support for PIN entry
  useEffect(() => {
    if (activeTab !== "pin" || !selectedStaff || isLoading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleNumpadPress(e.key);
      } else if (e.key === "Backspace") {
        handleNumpadBackspace();
      } else if (e.key === "Escape") {
        handleNumpadClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, selectedStaff, isLoading, pinDigits]);

  return (
    <div className="w-full max-w-md rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xl space-y-5">
      {/* 1. Header & Store Branding */}
      <div className="text-center space-y-1.5">
        <div className="flex justify-center pb-0.5">
          <Image
            src="/logo-text.svg"
            alt="QuickOne POS"
            width={190}
            height={52}
            className="h-11 w-auto object-contain mx-auto"
            priority
          />
        </div>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          ລະບົບຂາຍໜ້າຮ້ານ & ຄຸ້ມຄອງສາງສິນຄ້າ (Cloud & Offline Sync)
        </p>
      </div>

      {/* 2. Mode Tabs Switcher */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            setActiveTab("email");
            setErrorMessage(null);
            triggerHapticFeedback(15);
          }}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "email"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>ອີເມວ (Admin)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("pin");
            setErrorMessage(null);
            triggerHapticFeedback(15);
          }}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "pin"
              ? "bg-white text-emerald-700 shadow-2xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>ລະຫັດ PIN (POS)</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1 leading-snug">{errorMessage}</div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 1: EMAIL & PASSWORD LOGIN                                        */}
      {/* ==================================================================== */}
      {activeTab === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-3.5 pt-0.5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ອີເມວເຂົ້າໃຊ້ລະບົບ (Email)
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="h-10.5 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs font-semibold text-slate-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Password input with visibility toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ລະຫັດຜ່ານ (Password)
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10.5 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-xs font-semibold text-slate-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? "ເຊື່ອງລະຫັດຜ່ານ" : "ສະແດງລະຫັດຜ່ານ"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex h-10.5 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            <span>{isLoading ? "ກຳລັງກວດສອບຂໍ້ມູນ..." : "ເຂົ້າສູ່ລະບົບ (Sign In)"}</span>
          </button>

          {/* Quick Test Accounts Toolbar */}
          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
              <span>ບັນຊີເລີ່ມຕົ້ນ (Default Accounts):</span>
              <span className="text-[10px] text-slate-400 font-mono">password123</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin("admin@laochaleun.la", "password123")}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 transition-all text-center cursor-pointer active:scale-95 group disabled:opacity-50"
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <Crown className="h-3.5 w-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10.5px] font-bold text-slate-800">ເຈົ້າຂອງຮ້ານ</span>
                </div>
                <span className="text-[9px] text-slate-400 font-medium">Owner (Admin)</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin("manager@laochaleun.la", "password123")}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 transition-all text-center cursor-pointer active:scale-95 group disabled:opacity-50"
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10.5px] font-bold text-slate-800">ຜູ້ຈັດການ</span>
                </div>
                <span className="text-[9px] text-slate-400 font-medium">PIN: 123456</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin("cashier@laochaleun.la", "password123")}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 transition-all text-center cursor-pointer active:scale-95 group disabled:opacity-50"
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10.5px] font-bold text-slate-800">ເກັບເງິນ</span>
                </div>
                <span className="text-[9px] text-slate-400 font-medium">Cashier</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: FAST TOUCH STAFF PIN LOGIN                                    */}
      {/* ==================================================================== */}
      {activeTab === "pin" && (
        <div className="space-y-4 pt-1">
          {!selectedStaff ? (
            /* Step A: Select Staff Account */
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>ເລືອກພະນັກງານປະຈຳກະ (Select Cashier):</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {activeStaffList.length} ບັນຊີພ້ອມໃຊ້ງານ
                </span>
              </label>

              {isLoadingStaff ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
                  <span className="text-xs font-medium">ກຳລັງໂຫຼດລາຍຊື່...</span>
                </div>
              ) : activeStaffList.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                  ຍັງບໍ່ມີບັນຊີພະນັກງານໃນລະບົບ
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                  {activeStaffList.map((staff) => {
                    const roleConfig = STAFF_ROLES_CONFIG[staff.role];
                    const initials =
                      staff.full_name_lo
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("") || "ST";

                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setPinDigits("");
                          setErrorMessage(null);
                          triggerHapticFeedback(20);
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200/90 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer text-left group shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-100 group-hover:scale-105 transition-transform">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {staff.full_name_lo}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              @{staff.username}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold border ${roleConfig.badgeClass}`}
                          >
                            {roleConfig.label_lo}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Step B: Enter 6-Digit PIN on Touch Numpad */
            <div className="space-y-4">
              {/* Selected Staff Card with Change button */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-2xs">
                    {selectedStaff.full_name_lo
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("") || "ST"}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 leading-tight">
                      {selectedStaff.full_name_lo}
                    </div>
                    <div className="text-[10px] text-emerald-800 font-medium">
                      @{selectedStaff.username} ({STAFF_ROLES_CONFIG[selectedStaff.role].label_lo})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStaff(null);
                    setPinDigits("");
                    setErrorMessage(null);
                    triggerHapticFeedback(15);
                  }}
                  className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer shadow-2xs"
                >
                  ປ່ຽນພະນັກງານ
                </button>
              </div>

              {/* 6-Dot PIN Indicator */}
              <div className="text-center space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500">
                  ປ້ອນລະຫັດ PIN 6 ຕົວເລກ (PIN Code):
                </div>
                <div className="flex justify-center items-center gap-3 py-1">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const isFilled = index < pinDigits.length;
                    return (
                      <div
                        key={index}
                        className={`h-4 w-4 rounded-full transition-all duration-150 ${
                          isFilled
                            ? "bg-emerald-600 scale-110 shadow-xs shadow-emerald-600/40"
                            : "bg-slate-200 border border-slate-300"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Touch Numpad (3x4 Grid) */}
              <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto select-none">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleNumpadPress(num)}
                    className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 active:scale-95 transition-all text-base font-bold font-mono text-slate-800 cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}

                {/* Clear (C) */}
                <button
                  type="button"
                  disabled={isLoading || pinDigits.length === 0}
                  onClick={handleNumpadClear}
                  className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 active:scale-95 transition-all text-xs font-bold text-slate-500 cursor-pointer shadow-2xs disabled:opacity-30"
                >
                  ລຶບທັງໝົດ
                </button>

                {/* 0 */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleNumpadPress("0")}
                  className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 active:scale-95 transition-all text-base font-bold font-mono text-slate-800 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  0
                </button>

                {/* Backspace */}
                <button
                  type="button"
                  disabled={isLoading || pinDigits.length === 0}
                  onClick={handleNumpadBackspace}
                  className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 active:scale-95 transition-all text-slate-500 cursor-pointer shadow-2xs disabled:opacity-30"
                  title="ລຶບ 1 ຕົວ"
                >
                  <Delete className="h-4 w-4" />
                </button>
              </div>

              {/* Loading indicator when verifying */}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 animate-in fade-in">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>ກຳລັງກວດສອບລະຫັດ PIN...</span>
                </div>
              )}

              {/* Default test hint */}
              <div className="text-center text-[10.5px] text-slate-400 font-mono">
                ລະຫັດ PIN ເລີ່ມຕົ້ນ: 123456
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Security Footer Notice */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>ລະບົບປອດໄພດ້ວຍ Supabase Auth 256-bit Encryption</span>
      </div>
    </div>
  );
}
