"use client";

// ============================================================================
// Global TanStack Query Provider
// Caches queries with 30-second staleTime & auto-refetch on window focus
// Zero Emojis - Enterprise Reliability
// ============================================================================

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds staleTime: fast tab switching without serving 5-minute stale data
            refetchOnWindowFocus: true, // Automatically pull fresh data when user focuses window
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
