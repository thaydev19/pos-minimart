"use client";

// ============================================================================
// Network & Offline Sync Status Indicator (Frameless, Borderless Icon)
// Zero Emojis - Enterprise Reliability & Clean Lucide Icons
// ============================================================================

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { syncEngine } from "@/apis/sync-engine";
import { toast } from "sonner";

interface NetworkSyncBadgeProps {
  className?: string;
  showText?: boolean;
}

export function NetworkSyncBadge({
  className = "",
  showText = false,
}: NetworkSyncBadgeProps) {
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

  const handleClick = async () => {
    if (!isOnline) {
      toast.info(
        "ກຳລັງຢູ່ໃນໂໝດອອບລາຍ: ຂໍ້ມູນທຸກບິນຖືກບັນທຶກໄວ້ໃນເຄື່ອງຢ່າງປອດໄພ ແລະ ຈະຊິ້ງອັດຕະໂນມັດເມື່ອມີເນັດ",
        { duration: 4000 }
      );
      return;
    }

    if (pendingCount > 0) {
      if (isSyncing) return;
      setIsSyncing(true);
      try {
        await syncEngine.processQueue();
        toast.success("ຊິ້ງຂໍ້ມູນທັງໝົດກັບ Cloud ສຳເລັດແລ້ວ", {
          duration: 3000,
        });
      } catch (err) {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການຊິ້ງຂໍ້ມູນ ກະລຸນາລອງໃໝ່", {
          duration: 3000,
        });
      } finally {
        setIsSyncing(false);
      }
    } else {
      toast.success("ລະບົບອອນລາຍ: ເຊື່ອມຕໍ່ Cloud ປົກກະຕິ", {
        duration: 3000,
      });
    }
  };

  // Modern Frameless Icon-Only Mode (Seamless beside logo, no border, no background box)
  if (!showText) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={
          isOnline
            ? pendingCount > 0
              ? `ອອນລາຍ: ມີ ${pendingCount} ບິນລໍຖ້າຊິ້ງ (ກົດເພື່ອຊິ້ງດຽວນີ້)`
              : "ລະບົບອອນລາຍ (Online): ເຊື່ອມຕໍ່ Cloud ປົກກະຕິ"
            : "ໂໝດອອບລາຍ (Offline): ບໍ່ມີສັນຍານອິນເຕີເນັດ, ຂໍ້ມູນບັນທຶກໃນເຄື່ອງ"
        }
        aria-label={isOnline ? "Online network status" : "Offline network status"}
        className={`relative inline-flex items-center justify-center p-0.5 bg-transparent border-0 outline-none shadow-none focus:outline-none focus:ring-0 hover:scale-110 active:scale-90 transition-all cursor-pointer shrink-0 ${className}`}
      >
        {!isOnline ? (
          <WifiOff
            className="h-4.5 w-4.5 text-rose-500 hover:text-rose-600 transition-colors shrink-0"
            strokeWidth={2.2}
          />
        ) : pendingCount > 0 ? (
          <RefreshCw
            className={`h-4.5 w-4.5 text-sky-600 shrink-0 ${
              isSyncing ? "animate-spin" : ""
            }`}
            strokeWidth={2.2}
          />
        ) : (
          <Wifi
            className="h-4.5 w-4.5 text-emerald-500 hover:text-emerald-600 transition-colors shrink-0"
            strokeWidth={2.2}
          />
        )}

        {/* Small badge count if there are pending offline orders */}
        {pendingCount > 0 && (
          <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-white shadow-xs">
            {pendingCount}
          </span>
        )}
      </button>
    );
  }

  // Optional Badge with Text (for compact secondary toolbars)
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        title={
          isOnline
            ? pendingCount > 0
              ? `ມີ ${pendingCount} ບິນລໍຖ້າຊິ້ງ - ກົດເພື່ອຊິ້ງດຽວນີ້`
              : "ລະບົບເຊື່ອມຕໍ່ Cloud ປົກກະຕິ"
            : "ໂໝດອອບລາຍ - ຂາຍ ແລະ ພິມບິນໄດ້ປົກກະຕິ"
        }
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
          !isOnline
            ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 shadow-2xs"
            : pendingCount > 0
            ? "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 shadow-2xs"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        {!isOnline ? (
          <WifiOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        ) : pendingCount > 0 ? (
          <RefreshCw
            className={`h-3.5 w-3.5 text-sky-600 shrink-0 ${
              isSyncing ? "animate-spin" : ""
            }`}
          />
        ) : (
          <Wifi className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        )}

        <span>
          {!isOnline
            ? "ອອບລາຍ"
            : pendingCount > 0
            ? isSyncing
              ? "ກຳລັງຊິ້ງ..."
              : "ລໍຖ້າຊິ້ງ"
            : "ອອນລາຍ"}
        </span>

        {pendingCount > 0 && (
          <span
            className={`flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              !isOnline
                ? "bg-amber-200 text-amber-900"
                : "bg-sky-200 text-sky-900"
            }`}
          >
            {pendingCount} ບິນ
          </span>
        )}
      </button>
    </div>
  );
}
