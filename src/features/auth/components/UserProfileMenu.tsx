"use client";

// ============================================================================
// UserProfileMenu: Cashier / Admin User Status & Signout Component
// ============================================================================

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ShieldCheck, Store, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { formatRoleLabel, getRoleBadgeClass } from "../utils/auth.util";
import { LogoutConfirmModal } from "./LogoutConfirmModal";

interface UserProfileMenuProps {
  compact?: boolean;
}

export function UserProfileMenu({ compact = false }: UserProfileMenuProps) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
      setIsConfirmOpen(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        disabled={isLoggingOut}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0"
        title="ອອກຈາກລະບົບ (Logout)"
      >
        {isLoggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
      </button>

      <LogoutConfirmModal
        isOpen={isConfirmOpen}
        isLoggingOut={isLoggingOut}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}

