"use client";

// ============================================================================
// AppSidebar: Modern Retail POS Universal Sidebar (Lao Language)
// Supports Collapsible Mode (Backoffice) & Overlay Drawer Mode (POS Terminal)
// Strict Single Active Item Selection
// ============================================================================

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ScanBarcode,
  LayoutDashboard,
  Package,
  Boxes,
  Receipt,
  Settings,
  Tags,
  ChevronLeft,
  ChevronRight,
  X,
  Store,
  User,
  ShieldCheck,
  LogOut,
  Loader2,
} from "lucide-react";
import { DEFAULT_STORE } from "@/features/pos/constants/pos.constants";
import { useAuth, formatRoleLabel, getRoleBadgeClass } from "@/features/auth";

export interface NavItem {
  name: string;
  subname: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  isSpecial?: boolean;
}

export const BACKOFFICE_NAV_ITEMS: NavItem[] = [
  {
    name: "ຂາຍໜ້າຮ້ານ (POS)",
    subname: "ຈຸດຂາຍດ່ວນ",
    href: "/pos",
    icon: ScanBarcode,
    isSpecial: true,
  },
  {
    name: "ພາບລວມ (Dashboard)",
    subname: "ສະຖິຕິ & ຍອດຂາຍ",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "ສິນຄ້າ & ຫົວໜ່ວຍ",
    subname: "ລາຍການສິນຄ້າ & ລາຄາ",
    href: "/products",
    icon: Package,
  },
  {
    name: "ໝວດໝູ່ສິນຄ້າ",
    subname: "ຈັດການໝວດ & ໄອຄອນ",
    href: "/categories",
    icon: Tags,
  },
  {
    name: "ສາງສິນຄ້າ & FEFO",
    subname: "ຈັດການສະຕັອກ & ວັນໝົດອາຍຸ",
    href: "/inventory",
    icon: Boxes,
  },
  {
    name: "ປະຫວັດບິນ & ກະ",
    subname: "ລາຍການບິນ & ປິດກະຂາຍ",
    href: "/orders",
    icon: Receipt,
  },
  {
    name: "ຕັ້ງຄ່າ & ພະນັກງານ",
    subname: "ລະບົບ & ຜູ້ໃຊ້ງານ",
    href: "/settings",
    icon: Settings,
  },
];

interface AppSidebarProps {
  mode?: "collapsible" | "drawer";
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({
  mode = "collapsible",
  isOpen = false,
  onClose,
  collapsed: externalCollapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    const confirmLogout = window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການອອກຈາກລະບົບ? (Logout)");
    if (!confirmLogout) return;

    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isControlled = typeof externalCollapsed === "boolean";
  const isCollapsed = isControlled ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // Helper for Nav Items with Strict Single Active Highlight
  const renderNavList = (collapsedState: boolean) => (
    <nav className="flex-1 space-y-1 px-2 py-2.5 overflow-y-auto no-scrollbar">
      {BACKOFFICE_NAV_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/pos" && (pathname.startsWith(item.href + "/") || pathname === item.href));

        // 1. Special POS Button (Quick Action to Cashier Terminal)
        // When user is in Backoffice, this is a neutral quick action button (NOT active, NO green background)
        // Only becomes active when user is actually on /pos
        if (item.isSpecial) {
          return (
            <React.Fragment key={item.href}>
              <div className="px-0.5 pb-1">
                <Link
                  href={item.href}
                  onClick={onClose}
                  title={collapsedState ? item.name : undefined}
                  className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "border border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-300 font-semibold"
                  } ${collapsedState ? "justify-center px-1.5" : ""}`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white border border-zinc-200 text-zinc-600 group-hover:text-zinc-900 shadow-2xs"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {!collapsedState && (
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-bold leading-tight ${
                          isActive ? "text-white" : "text-zinc-800"
                        }`}
                      >
                        {item.name}
                      </div>
                      <div
                        className={`text-[10px] leading-none mt-0.5 ${
                          isActive ? "text-emerald-100" : "text-zinc-400"
                        }`}
                      >
                        {item.subname}
                      </div>
                    </div>
                  )}

                  {!collapsedState && !isActive && (
                    <span className="text-[9px] font-mono font-bold text-zinc-500 bg-white px-1.5 py-0.5 rounded border border-zinc-200 shrink-0">
                      POS
                    </span>
                  )}
                </Link>
              </div>
              {/* Subtle separator below POS quick action */}
              <div className="border-b border-zinc-200/80 my-1.5 mx-1" />
            </React.Fragment>
          );
        }

        // 2. Regular Backoffice Menu Item (Strictly ONE item active at a time)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            title={collapsedState ? item.name : undefined}
            className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all cursor-pointer select-none ${
              isActive
                ? "bg-emerald-50 text-emerald-900 font-bold border-l-4 border-emerald-600 shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 font-medium border-l-4 border-transparent"
            } ${collapsedState ? "justify-center px-1.5 border-l-0" : ""}`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-zinc-400 group-hover:text-zinc-700 group-hover:bg-zinc-100"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>

            {!collapsedState && (
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs leading-tight ${
                    isActive ? "text-emerald-900 font-bold" : "text-zinc-700 font-semibold"
                  }`}
                >
                  {item.name}
                </div>
                <div
                  className={`text-[10px] leading-none mt-0.5 truncate ${
                    isActive ? "text-emerald-700/80 font-medium" : "text-zinc-400"
                  }`}
                >
                  {item.subname}
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );

  // Helper for Store Header
  const renderHeader = (collapsedState: boolean, showCloseBtn: boolean) => (
    <div className="flex h-14 items-center justify-between border-b border-zinc-200/80 px-3.5 select-none shrink-0">
      <div className={`flex items-center gap-2.5 min-w-0 ${collapsedState ? "justify-center w-full" : ""}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
          <Store className="h-5 w-5" />
        </div>

        {!collapsedState && (
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-extrabold text-slate-900 leading-snug truncate">
              {user?.store_name_lo || DEFAULT_STORE.name_lo}
            </h2>
            <p className="text-[10px] text-slate-500 font-medium truncate leading-none mt-0.5">
              {user?.store_branch || DEFAULT_STORE.branch}
            </p>
          </div>
        )}
      </div>

      {showCloseBtn && (
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          title="ປິດເມນູ"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  // Helper for Cashier / User Profile Footer
  const renderFooter = (collapsedState: boolean, showCollapseToggle: boolean) => (
    <div className="border-t border-zinc-200/80 bg-zinc-50/50 p-2.5 shrink-0 select-none">
      {/* Current Real Staff Info */}
      <div
        className={`flex items-center gap-2 rounded-xl p-1.5 transition-colors ${
          collapsedState ? "justify-center" : "bg-white border border-zinc-200/60 shadow-2xs"
        }`}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
          <User className="h-4 w-4" />
        </div>

        {!collapsedState && (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {user?.full_name_lo || "ພະນັກງານ"}
                </span>
                <span
                  className={`flex items-center gap-0.5 rounded px-1 py-0.2 text-[8px] font-bold border ${getRoleBadgeClass(
                    user?.role
                  )}`}
                >
                  <ShieldCheck className="h-2.5 w-2.5" />
                  <span>{formatRoleLabel(user?.role)}</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5 truncate">
                {user?.email || user?.username || "offline"}
              </p>
            </div>

            {/* Logout Action Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
              title="ອອກຈາກລະບົບ (Logout)"
            >
              {isLoggingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Collapse Toggle Button for Desktop */}
      {showCollapseToggle && (
        <button
          type="button"
          onClick={toggleCollapse}
          className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer ${
            collapsedState ? "px-0" : "px-2"
          }`}
          title={collapsedState ? "ຂະຫຍາຍເມນູ" : "ຫຍໍ້ເມນູ"}
        >
          {collapsedState ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>ຫຍໍ້ແຖບເມນູ</span>
            </>
          )}
        </button>
      )}
    </div>
  );

  // ==========================================================================
  // MODE 1: DRAWER OVERLAY (Used in POS terminal or Mobile Drawer)
  // ==========================================================================
  if (mode === "drawer") {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Slide-out Drawer Panel */}
        <aside className="relative flex h-full w-[260px] flex-col bg-white border-r border-zinc-200/90 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
          {renderHeader(false, true)}
          {renderNavList(false)}
          {renderFooter(false, false)}
        </aside>
      </div>
    );
  }

  // ==========================================================================
  // MODE 2: COLLAPSIBLE SIDEBAR (Used in Backoffice Layout)
  // ==========================================================================
  return (
    <>
      {/* 1. Desktop / Tablet Collapsible Static Aside */}
      <aside
        className={`hidden md:flex flex-col h-full bg-white border-r border-zinc-200/80 transition-all duration-300 select-none shrink-0 ${
          isCollapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        {renderHeader(isCollapsed, false)}
        {renderNavList(isCollapsed)}
        {renderFooter(isCollapsed, true)}
      </aside>

      {/* 2. Mobile Responsive Drawer (< 768px) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative flex h-full w-[260px] flex-col bg-white border-r border-zinc-200/90 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderHeader(false, true)}
            {renderNavList(false)}
            {renderFooter(false, false)}
          </aside>
        </div>
      )}
    </>
  );
}
