"use client";

// ============================================================================
// Auth Hook: Live Session, Roles & Permission Verifiers
// ============================================================================

import { useEffect } from "react";
import { useAuthStore } from "../stores/auth.store";
import { canAccessBackoffice } from "../utils/auth.util";
import { authApi } from "../api/auth.api";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initAuth = useAuthStore((s) => s.initAuth);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const requireManagerPin = useAuthStore((s) => s.requireManagerPin);

  useEffect(() => {
    if (!isInitialized) {
      initAuth();
    }
  }, [isInitialized, initAuth]);

  // Subscribe to live auth changes (Token refresh, remote signin)
  useEffect(() => {
    const { data: subscription } = authApi.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (!user && session?.user) {
          initAuth();
        }
      }
    });

    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, [initAuth, user]);

  const role = user?.role;
  const isOwner = role === "owner" || role === "super_admin";
  const isManager = role === "owner" || role === "store_manager" || role === "super_admin";
  const isCashier = role === "cashier";

  return {
    user,
    role,
    isLoading: isLoading || !isInitialized,
    isAuthenticated: Boolean(user),
    isOwner,
    isManager,
    isCashier,
    canAccessBackoffice: canAccessBackoffice(role),
    login,
    logout,
    requireManagerPin,
  };
}
