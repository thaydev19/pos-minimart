"use client";

// ============================================================================
// AuthGuard: Route Protection & Role-Based Access Control (RBAC)
// Client-side execution for Next.js Static Export (Tauri, Capacitor, Web)
// Supports Offline POS Resilience
// ============================================================================

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight, ScanBarcode, Lock, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireBackoffice?: boolean;
}

export function AuthGuard({ children, requireBackoffice = false }: AuthGuardProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, canAccessBackoffice, isCashier } =
    useAuth();

  // If unauthenticated and finished loading, automatically redirect to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2.5">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-semibold text-slate-500">
            ກຳລັງກວດສອບສິດການໃຊ້ງານ...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in fallback screen
  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-4 bg-slate-50 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mb-3 shadow-xs">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ (Authentication Required)
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
          ທ່ານຕ້ອງເຂົ້າສູ່ລະບົບດ້ວຍບັນຊີພະນັກງານເພື່ອເຂົ້າເຖິງລະບົບ POS Minimart
        </p>
        <Link
          href="/login"
          className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all cursor-pointer"
        >
          <span>ໄປທີ່ໜ້າເຂົ້າສູ່ລະບົບ</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Cashier role trying to access restricted Backoffice modules
  if (requireBackoffice && isCashier && !canAccessBackoffice) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center min-h-[70vh]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-3 border border-amber-200 shadow-xs">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
          ບໍ່ມີສິດເຂົ້າເຖິງພາກສ່ວນນີ້ (Access Denied)
        </h2>
        <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
          ບັນຊີຂອງທ່ານ (<strong>{user.full_name_lo}</strong>) ແມ່ນສິດພະນັກງານຂາຍໜ້າຮ້ານ (Cashier).
          ພາກສ່ວນຈັດການຫຼັງຮ້ານນີ້ອະນຸຍາດສະເພາະເຈົ້າຂອງຮ້ານ ແລະ ຜູ້ຈັດການເທົ່ານັ້ນ.
        </p>

        <Link
          href="/pos"
          className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all cursor-pointer"
        >
          <ScanBarcode className="h-4 w-4" />
          <span>ກັບໄປທີ່ໜ້າຂາຍໜ້າຮ້ານ (POS Terminal)</span>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
