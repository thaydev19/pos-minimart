"use client";

// ============================================================================
// UserProfileMenu: Cashier / Admin User Status & Signout Component
// ============================================================================

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ShieldCheck, Store, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { formatRoleLabel, getRoleBadgeClass } from "../utils/auth.util";

interface UserProfileMenuProps {
  compact?: boolean;
}

export function UserProfileMenu({ compact = false }: UserProfileMenuProps) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    const confirmLogout = window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການອອກຈາກລະບົບ? (Logout)");
    if (!confirmLogout) return;

    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
        title="ອອກຈາກລະບົບ (Logout)"
      >
        {isLoggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* User Info Badge */}
      {/* <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-1.5 border border-slate-200">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
          <User className="h-4 w-4" />
        </div>
        <div className="text-left min-w-0 flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
            {user.full_name_lo}
          </span>
          <div className="mt-0.5">
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold border leading-none ${getRoleBadgeClass(
                user.role
              )}`}
            >
              {formatRoleLabel(user.role)}
            </span>
          </div>
        </div>
      </div> */}

      {/* Logout Trigger */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-2xs"
        title="ອອກຈາກລະບົບ (Logout)"
      >
        {isLoggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

