"use client";

// ============================================================================
// Header Refresh & Clear Cache Button (Icon-Only Clean Design)
// Clears React Query cache & refetches all fresh data from Supabase when online
// Zero Emojis - Enterprise Reliability & Clean Lucide Icons
// ============================================================================

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { clearCacheAndRefetchAll } from "@/constants/queryKeys";
import { toast } from "sonner";
import { triggerHapticFeedback } from "@/utils/haptics";

interface HeaderRefreshButtonProps {
  className?: string;
  variant?: "topbar" | "page";
  title?: string;
}

export function HeaderRefreshButton({
  className = "",
  title = "ລ້າງ Cache ແລະ ໂຫຼດຂໍ້ມູນລ່າສຸດ (Refresh)",
}: HeaderRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    triggerHapticFeedback(15);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.warning(
        "ກຳລັງຢູ່ໃນໂໝດອອບລາຍ: ບໍ່ສາມາດລ້າງ Cache ໄດ້, ລະບົບກຳລັງໃຊ້ຂໍ້ມູນໃນເຄື່ອງ",
        { id: "offline-refresh-warn", duration: 3500 }
      );
      return;
    }

    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await clearCacheAndRefetchAll(queryClient);
      toast.success("ໄດ້ໂຫຼດຂໍ້ມູນລ່າສຸດ ແລະ ລ້າງ Cache ສຳເລັດແລ້ວ", {
        id: "refresh-success",
        duration: 2500,
      });
    } catch (err: any) {
      console.warn("Refresh failed:", err);
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ: " + (err?.message || ""));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title={title}
      aria-label="Refresh and clear cache"
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-50 shrink-0 ${className}`}
    >
      <RefreshCw
        className={`h-4 w-4 text-emerald-600 ${
          isRefreshing ? "animate-spin" : ""
        }`}
      />
    </button>
  );
}
