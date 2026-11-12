"use client";

// ============================================================================
// useRequireAuth: Automatic Redirect Hook for Protected Routes
// ============================================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

interface RequireAuthOptions {
  requireBackoffice?: boolean;
  redirectTo?: string;
}

export function useRequireAuth(options: RequireAuthOptions = {}) {
  const { requireBackoffice = false, redirectTo = "/login" } = options;
  const router = useRouter();
  const { user, isLoading, isAuthenticated, canAccessBackoffice, isCashier } =
    useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (requireBackoffice && isCashier && !canAccessBackoffice) {
      router.replace("/pos");
    }
  }, [
    isLoading,
    isAuthenticated,
    canAccessBackoffice,
    isCashier,
    requireBackoffice,
    redirectTo,
    router,
  ]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isAuthorized: requireBackoffice ? canAccessBackoffice : isAuthenticated,
  };
}

