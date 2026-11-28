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
            staleTime: 1000 * 60 * 5, // 5 minutes: instant tab switching with cached data
            gcTime: 1000 * 60 * 30, // Keep cache in memory for 30 minutes
            refetchOnWindowFocus: false, // Avoid jarring refetches every time POS regains focus
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
