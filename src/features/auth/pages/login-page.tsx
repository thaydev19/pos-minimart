"use client";

// ============================================================================
// LoginPage: Full Page Container for Supabase Auth Authentication
// ============================================================================

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  // If already logged in, redirect directly to POS Terminal
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace("/pos");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-100 via-[#F8F9FA] to-emerald-50/40 p-4 select-none">
      <LoginForm />
    </div>
  );
}
