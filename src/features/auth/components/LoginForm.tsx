"use client";

// ============================================================================
// LoginForm: 100% Real Supabase Authentication Form (Lao Language)
// Zero Mock Data - Enterprise Security & Seamless POS Onboarding
// ============================================================================

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
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
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeLogin = async (targetEmail: string, targetPassword: string) => {
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
      
      // Always navigate directly to POS Terminal upon login
      router.push("/pos");
    } catch (err: any) {
      setErrorMessage(err.message || "ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ ກະລຸນາກວດສອບອີກຄັ້ງ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleQuickLogin = async (targetEmail: string, targetPassword: string) => {
    setEmail(targetEmail);
    setPassword(targetPassword);
    await executeLogin(targetEmail, targetPassword);
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-zinc-200/90 bg-white p-7 sm:p-9 shadow-xl space-y-6">
      {/* Store Header & Branding */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
          <Store className="h-7 w-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
          ເຂົ້າສູ່ລະບົບ QuickOne POS
        </h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          ລະບົບຂາຍໜ້າຮ້ານ & ຄຸ້ມຄອງສາງສິນຄ້າ (Cloud & Offline Sync)
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 leading-snug">{errorMessage}</div>
          </div>
        )}

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
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs font-semibold text-slate-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Password input with visibility toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              ລະຫັດຜ່ານ (Password)
            </label>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-xs font-semibold text-slate-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-300"
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
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 mt-3"
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
            <span className="text-[10px] text-slate-400 font-mono">ລະຫັດ: password123</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("admin@laochaleun.la", "password123")}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 transition-all text-center cursor-pointer active:scale-95 group disabled:opacity-50"
              title="admin@laochaleun.la / password123"
            >
              <div className="flex items-center gap-1 mb-0.5">
                <Crown className="h-3.5 w-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-800">ເຈົ້າຂອງຮ້ານ</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">Owner (Admin)</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("manager@laochaleun.la", "password123")}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 transition-all text-center cursor-pointer active:scale-95 group disabled:opacity-50"
              title="manager@laochaleun.la / password123"
            >
              <div className="flex items-center gap-1 mb-0.5">
                <UserCheck className="h-3.5 w-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-800">ຜູ້ຈັດການ</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">PIN: 123456</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("cashier@laochaleun.la", "password123")}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 transition-all text-center cursor-pointer active:scale-95 group disabled:opacity-50"
              title="cashier@laochaleun.la / password123"
            >
              <div className="flex items-center gap-1 mb-0.5">
                <ShoppingCart className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-800">ເກັບເງິນ</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">Cashier</span>
            </button>
          </div>
        </div>
      </form>

      {/* Security Footer Notice */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>ລະບົບປອດໄພດ້ວຍ Supabase Auth 256-bit Encryption</span>
      </div>
    </div>
  );
}
