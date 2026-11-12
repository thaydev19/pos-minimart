"use client";

// ============================================================================
// Network Online/Offline Status Hook
// ============================================================================

import { useState, useEffect } from "react";
import { syncEngine } from "@/apis/sync-engine";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state) => {
      setIsOnline(state.isOnline);
      setPendingCount(state.pendingCount);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isOnline, pendingCount };
}

