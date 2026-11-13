"use client";

// ============================================================================
// Backoffice Shell Layout: Collapsible AppSidebar + Sticky Topbar + Dynamic Pages
// Protected by 100% Real Supabase RBAC AuthGuard
// ============================================================================

import React, { useState } from "react";
import Link from "next/link";
import { Menu, ScanBarcode } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NetworkSyncBadge } from "@/components/NetworkSyncBadge";
import { AuthGuard, UserProfileMenu } from "@/features/auth";

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <AuthGuard requireBackoffice={true}>
      <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] select-none text-slate-900 font-sans">
        {/* 1. Left Navigation Sidebar (Collapsible Desktop + Mobile Drawer) */}
        <AppSidebar
          mode="collapsible"
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* 2. Main Work Area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Topbar: Mobile Toggle + Title + Sync Status + POS Quick Link + User */}
          <header className="flex h-13 w-full items-center justify-between border-b border-zinc-200/80 bg-white px-3 sm:px-5 shadow-2xs shrink-0 gap-3">
            {/* Left: Mobile Menu Trigger + Breadcrumb */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 md:hidden transition-colors cursor-pointer shadow-2xs"
                title="ເມນູລະບົບ (Menu)"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500">ລະບົບຫຼັງຮ້ານ</span>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-slate-800">
                  Back-Office Management
                </span>
              </div>
            </div>

            {/* Right: Quick POS Jump + Network Status + Real User Menu */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Quick POS Launch Button */}
              <Link
                href="/pos"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
              >
                <ScanBarcode className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ຂາຍໜ້າຮ້ານ (POS)</span>
              </Link>

              <NetworkSyncBadge />
              

              {/* Real Staff Profile Card & Signout */}
              <UserProfileMenu />
            </div>
          </header>

          {/* Dynamic Route Content */}
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-5">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
