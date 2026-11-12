"use client";

// ============================================================================
// Network & Offline Sync Status Badge
// ============================================================================

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { syncEngine } from "@/apis/sync-engine";
import { lo } from "@/constants/locales/lo";

export function NetworkSyncBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state) => {
      setIsOnline(state.isOnline);
      setPendingCount(state.pendingCount);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    try {
      await syncEngine.processQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleManualSync}
        title={isOnline ? lo.app.onlineNotice : lo.app.offlineNotice}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
          isOnline
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
        }`}
      >
        {isOnline ? (
          <Wifi className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-amber-600" />
        )}

        <span>{isOnline ? "Online" : "Offline"}</span>

        {pendingCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-200/80 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
            <RefreshCw
              className={`h-2.5 w-2.5 ${isSyncing ? "animate-spin" : ""}`}
            />
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
}

