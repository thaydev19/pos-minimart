"use client";

// ============================================================================
// POS Terminal Layout: Protected by AuthGuard (Supports Offline POS Resilience)
// ============================================================================

import React from "react";
import { AuthGuard } from "@/features/auth";

export default function PosTerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard requireBackoffice={false}>{children}</AuthGuard>;
}

