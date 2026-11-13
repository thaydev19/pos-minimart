"use client";

// ============================================================================
// POS Terminal Header: Compact h-12 (48px) Bar with Sharp Badges & Realtime Status
// Includes Drawer Menu Trigger for Instant Access to Backoffice Modules
// ============================================================================

import React, { useEffect, useState } from "react";
import { Store, User, Clock, Menu } from "lucide-react";
import { NetworkSyncBadge } from "@/components/NetworkSyncBadge";
import { usePosStore } from "../stores/pos.store";
import { DEFAULT_STORE } from "../constants/pos.constants";
import { HoldOrdersTabs } from "./HoldOrdersTabs";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth, formatRoleLabel, UserProfileMenu } from "@/features/auth";
import {
  ActiveShiftBadge,
  OpenShiftDialog,
  CloseShiftBlindDialog,
} from "@/features/shifts";

export function PosHeader() {
  const cashier = usePosStore((s) => s.cashier);
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="flex h-12 w-full items-center justify-between border-b border-slate-200/90 bg-white px-3 sm:px-4 shadow-2xs select-none gap-2 shrink-0">
        {/* 1. Left: Menu Drawer Trigger + Compact Store Identity */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors shadow-2xs cursor-pointer"
            title="ເມນູລະບົບ (Menu)"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              {user?.store_name_lo || DEFAULT_STORE.name_lo}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              {user?.store_branch || DEFAULT_STORE.branch}
            </p>
          </div>
        </div>

        {/* 2. Center: Bill / Hold Order Tabs (ບິນປັດຈຸບັນ & ພັກບິນ) */}
        <div className="flex items-center justify-center flex-1 max-w-xl mx-auto overflow-hidden">
          <HoldOrdersTabs />
        </div>

        {/* 3. Right: Clock + Network Badge + Active Shift + Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Real-time Clock */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-200 text-xs font-semibold text-slate-700">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="tabular-nums font-mono">{currentTime || "00:00:00"}</span>
          </div>

          <NetworkSyncBadge />

          {/* Active Shift Status & Quick Close Action */}
          <ActiveShiftBadge />

          {/* Quick Logout Button Only */}
          <UserProfileMenu compact={true} />
        </div>
      </header>

      {/* Slide-out Navigation Drawer for POS Terminal */}
      <AppSidebar
        mode="drawer"
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Shift Dialogs */}
      <OpenShiftDialog />
      <CloseShiftBlindDialog />
    </>
  );
}
