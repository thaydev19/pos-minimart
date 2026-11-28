"use client";

// ============================================================================
// POS Terminal Header: Streamlined Touch Bar
// Direct Icon Buttons on Header: Cash Drawer (F10) & Customer Display
// Zero Emojis - Lucide Icons Exclusively
// ============================================================================

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Clock,
  Menu,
  Monitor,
  Maximize2,
  Minimize2,
  LockOpen,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { NetworkSyncBadge } from "@/components/NetworkSyncBadge";
import { HeaderRefreshButton } from "@/components/HeaderRefreshButton";
import { DEFAULT_STORE } from "../constants/pos.constants";
import { HoldOrdersTabs } from "./HoldOrdersTabs";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth, UserProfileMenu } from "@/features/auth";
import {
  useShiftStore,
  OpenShiftDialog,
  CloseShiftBlindDialog,
  formatShiftDuration,
} from "@/features/shifts";
import { isCustomerDisplayWindowOpenAsync } from "../utils/tauriWindow";
import {
  initCustomerDisplay,
  closeCustomerDisplay,
} from "../utils/dualScreenManager";
import {
  subscribeCustomerDisplay,
  broadcastCurrentCustomerDisplayState,
} from "../utils/customerDisplaySync";
import { HardwareService } from "../services/hardware.service";
import { ConfirmPinDialog } from "@/components/ConfirmPinDialog";
import { usePosStore } from "../stores/pos.store";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";

export function PosHeader() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCustomerDisplayActive, setIsCustomerDisplayActive] = useState(false);
  const [isDrawerKicking, setIsDrawerKicking] = useState(false);
  const [isPinDialogOpenForDrawer, setIsPinDialogOpenForDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Floating Customer Display State
  const isCustomerDisplayFloatingOpen = usePosStore(
    (s) => s.isCustomerDisplayFloatingOpen
  );
  const setCustomerDisplayFloatingOpen = usePosStore(
    (s) => s.setCustomerDisplayFloatingOpen
  );
  const closingDisplayUntilRef = useRef(0);

  // Shift Store
  const activeShift = useShiftStore((s) => s.activeShift);
  const openOpenShiftModal = useShiftStore((s) => s.openOpenShiftModal);
  const openCloseShiftModal = useShiftStore((s) => s.openCloseShiftModal);

  // Clock interval
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

  const resolveCurrentTauriWindow = async () => {
    if (typeof window === "undefined") return null;
    const tauri = (window as any).__TAURI__;
    const fromGlobal =
      tauri?.window?.getCurrentWindow?.() ||
      tauri?.webviewWindow?.getCurrentWebviewWindow?.();
    if (fromGlobal) return fromGlobal;

    const isTauriEnv = Boolean(
      tauri ||
        (window as any).__TAURI_INTERNALS__ ||
        (window as any).__TAURI_METADATA__
    );
    if (!isTauriEnv) return null;

    try {
      const mod = await import("@tauri-apps/api/window");
      return mod.getCurrentWindow();
    } catch {
      return null;
    }
  };

  // Sync POS window fullscreen state on mount & resize
  useEffect(() => {
    let active = true;

    const syncFullscreenState = async () => {
      try {
        const win = await resolveCurrentTauriWindow();
        if (win && typeof win.isFullscreen === "function") {
          const fs = await win.isFullscreen();
          if (active) setIsFullscreen(Boolean(fs));
          return;
        }
        if (active) setIsFullscreen(Boolean(document.fullscreenElement));
      } catch {
        if (active) setIsFullscreen(Boolean(document.fullscreenElement));
      }
    };

    syncFullscreenState();
    window.addEventListener("resize", syncFullscreenState);
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      active = false;
      window.removeEventListener("resize", syncFullscreenState);
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    triggerHapticFeedback(25);
    try {
      const win = await resolveCurrentTauriWindow();
      if (win && typeof win.isFullscreen === "function" && typeof win.setFullscreen === "function") {
        const current = await win.isFullscreen();
        const next = !current;
        await win.setFullscreen(next);
        if (!next && typeof win.maximize === "function") {
          await win.maximize().catch(() => {});
        }
        setIsFullscreen(next);
        return;
      }

      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("[PosHeader] Fullscreen toggle error:", err);
      toast.error("ບໍ່ສາມາດສະຫຼັບໂໝດເຕັມຈໍໄດ້");
    }
  };

  // Monitor Customer Display state
  useEffect(() => {
    let lastHeartbeat = 0;

    const unsubscribe = subscribeCustomerDisplay((msg) => {
      if (Date.now() < closingDisplayUntilRef.current) return;
      if (
        msg.type === "CUSTOMER_DISPLAY_READY" ||
        msg.type === "CUSTOMER_DISPLAY_PING" ||
        msg.type === "REQUEST_CUSTOMER_DISPLAY_SYNC"
      ) {
        lastHeartbeat = Date.now();
        setIsCustomerDisplayActive(true);
      } else if (msg.type === "CUSTOMER_DISPLAY_CLOSED") {
        lastHeartbeat = 0;
        setIsCustomerDisplayActive(false);
      }
    });

    const syncWindowState = async () => {
      if (Date.now() < closingDisplayUntilRef.current) return;
      const winOpen = await isCustomerDisplayWindowOpenAsync();
      if (winOpen) {
        setIsCustomerDisplayActive(true);
        return;
      }
      const floatingOpen = usePosStore.getState().isCustomerDisplayFloatingOpen;
      if (!floatingOpen && Date.now() - lastHeartbeat > 6500) {
        setIsCustomerDisplayActive(false);
      }
    };

    syncWindowState();
    const checkInterval = setInterval(syncWindowState, 1500);

    return () => {
      unsubscribe();
      clearInterval(checkInterval);
    };
  }, []);

  // Sync when Floating Customer Display is closed via its own X button
  const prevFloatingOpenRef = useRef(isCustomerDisplayFloatingOpen);
  useEffect(() => {
    if (prevFloatingOpenRef.current && !isCustomerDisplayFloatingOpen) {
      setIsCustomerDisplayActive(false);
    }
    prevFloatingOpenRef.current = isCustomerDisplayFloatingOpen;
  }, [isCustomerDisplayFloatingOpen]);

  // Execute actual opening of Cash Drawer via ESC/POS
  const executeOpenDrawer = async () => {
    setIsDrawerKicking(true);
    triggerHapticFeedback(50);
    try {
      const res = await HardwareService.openCashDrawer();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "ເກີດຂໍ້ຜິດພາດໃນການໄຂລິ້ນຊັກເງິນ");
    } finally {
      setIsDrawerKicking(false);
    }
  };

  // Trigger cash drawer with role/PIN verification
  const handleTriggerDrawer = () => {
    triggerHapticFeedback(30);

    // If user is cashier, require Manager PIN override
    if (user?.role === "cashier") {
      setIsPinDialogOpenForDrawer(true);
    } else {
      // Owner or Store Manager can open directly
      executeOpenDrawer();
    }
  };

  // Keyboard shortcut F10 listener for Cash Drawer
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F10") {
        e.preventDefault();
        handleTriggerDrawer();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [user]);

  // Toggle Customer Display
  const handleToggleCustomerDisplay = async () => {
    triggerHapticFeedback(30);

    if (isCustomerDisplayActive || isCustomerDisplayFloatingOpen) {
      closingDisplayUntilRef.current = Date.now() + 2000;
      setIsCustomerDisplayActive(false);
      setCustomerDisplayFloatingOpen(false);
      await closeCustomerDisplay();
      toast.info("ໄດ້ປິດຈໍລູກຄ້າແລ້ວ (Customer Display Closed)");
      return;
    }

    closingDisplayUntilRef.current = 0;
    const opened = await initCustomerDisplay();
    if (opened) {
      setIsCustomerDisplayActive(true);
      toast.success("ໄດ້ເປີດຈໍລູກຄ້າແລ້ວ (Customer Display Active)");
    } else {
      // No secondary hardware display connected (e.g. testing on WSA, single tablet, single monitor)
      // Automatically fall back to the In-App Floating Preview so the user can test everything!
      setCustomerDisplayFloatingOpen(true);
      setIsCustomerDisplayActive(true);
      broadcastCurrentCustomerDisplayState();
      toast.success("ອຸປະກອນມີ 1 ໜ້າຈໍ: ໄດ້ເປີດຈໍລູກຄ້າຈຳລອງ (Floating Preview)");
    }
  };

  const shiftDuration = activeShift
    ? formatShiftDuration(activeShift.opening_time)
    : "";

  return (
    <>
      <header className="flex h-12 w-full items-center justify-between border-b border-slate-200/90 bg-white px-2.5 sm:px-4 shadow-2xs select-none gap-2 shrink-0 touch-manipulation">
        {/* 1. Left: Menu Drawer Trigger + Store Identity */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(20);
              setIsMenuOpen(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
            title="ເມນູລະບົບ (Menu)"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop & Tablet: Sleek, well-proportioned QuickOne logo with text */}
            <div className="hidden sm:flex items-center">
              <Image
                src="/logo-text.svg"
                alt="QuickOne POS"
                width={150}
                height={40}
                className="h-7.5 sm:h-8 w-auto object-contain"
                priority
              />
            </div>

            {/* Mobile: Clean standalone logo icon */}
            <div className="flex sm:hidden items-center justify-center">
              <Image
                src="/logo.svg"
                alt="QuickOne"
                width={32}
                height={32}
                className="h-7.5 w-7.5 object-contain"
                priority
              />
            </div>

            {/* Online / Offline Icon Indicator at the end of Logo (Frameless & Borderless) */}
            <NetworkSyncBadge showText={false} />
          </div>
        </div>

        {/* 2. Center: Bill / Hold Order Tabs (ບິນປັດຈຸບັນ & ພັກບິນ) */}
        <div className="flex items-center justify-center flex-1 max-w-xl mx-auto overflow-hidden">
          <HoldOrdersTabs />
        </div>

        {/* 3. Right: Exactly 5 Streamlined Elements */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* ELEMENT 1: Smart Shift Control Button (Single Button) - FIRST IN LINE */}
          {!activeShift ? (
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                openOpenShiftModal();
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-2 sm:px-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
              title="ກົດເພື່ອເປີດກະຂາຍໃໝ່ (Open Shift)"
            >
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="whitespace-nowrap">ເປີດກະຂາຍ</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                openCloseShiftModal();
              }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2 sm:px-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
              title="ກວດສອບ ຫຼື ປິດກະຂາຍ (Click to view or close shift)"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">
                ປິດກະ{" "}
                <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                  ({shiftDuration})
                </span>
              </span>
            </button>
          )}

          {/* ELEMENT 2: Direct Cash Drawer Button (Icon Only, F10) */}
          <button
            type="button"
            disabled={isDrawerKicking}
            onClick={handleTriggerDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0 disabled:opacity-60"
            title="ໄຂລີ້ນຊັກເກັບເງິນ (F10)"
            aria-label="ໄຂລີ້ນຊັກເກັບເງິນ"
          >
            {isDrawerKicking ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
            ) : (
              <LockOpen className="h-4 w-4 shrink-0" />
            )}
          </button>

          {/* ELEMENT 3: Direct Customer Display Toggle Button (Icon Only) */}
          <button
            type="button"
            onClick={handleToggleCustomerDisplay}
            className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 ${
              isCustomerDisplayActive || isCustomerDisplayFloatingOpen
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
            }`}
            title={
              isCustomerDisplayActive || isCustomerDisplayFloatingOpen
                ? "ຈໍລູກຄ້າ (ກຳລັງເປີດ • ກົດເພື່ອປິດ)"
                : "ຈໍລູກຄ້າ (ກົດເພື່ອເປີດ)"
            }
            aria-label="ຈໍລູກຄ້າ"
          >
            <Monitor className="h-4 w-4 shrink-0" />
            {(isCustomerDisplayActive || isCustomerDisplayFloatingOpen) && (
              <span
                style={{ position: "absolute", top: 5, right: 5 }}
                className="flex h-2 w-2 pointer-events-none"
              >
                <span className="animate-ping absolute inset-0 inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </button>

          {/* ELEMENT 3B: POS Fullscreen Toggle Button (Icon Only, Emerald Highlight when Active) */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 ${
              isFullscreen
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/25"
                : "border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
            }`}
            title={
              isFullscreen
                ? "ອອກຈາກໂໝດເຕັມຈໍ (Exit Fullscreen)"
                : "ເປີດໂໝດເຕັມຈໍ (Fullscreen)"
            }
            aria-label={isFullscreen ? "ອອກຈາກໂໝດເຕັມຈໍ" : "ເປີດໂໝດເຕັມຈໍ"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 shrink-0" />
            ) : (
              <Maximize2 className="h-4 w-4 shrink-0" />
            )}
            {isFullscreen && (
              <span
                style={{ position: "absolute", top: 5, right: 5 }}
                className="inline-flex h-2 w-2 rounded-full bg-emerald-500 pointer-events-none"
              />
            )}
          </button>

          {/* Refresh & Clear Cache Button (Right After Hardware, Before Logout) */}
          <HeaderRefreshButton />

          {/* ELEMENT 4: Logout / Exit Button */}
          <UserProfileMenu compact={true} />

          {/* ELEMENT 5: Clock at Far Right */}
          <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 h-9 text-xs font-bold text-slate-700 shadow-2xs font-mono shrink-0">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer for POS Terminal */}
      <AppSidebar
        mode="drawer"
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Manager PIN Override Dialog for Cashier opening Cash Drawer */}
      <ConfirmPinDialog
        isOpen={isPinDialogOpenForDrawer}
        onClose={() => setIsPinDialogOpenForDrawer(false)}
        onSuccess={() => {
          setIsPinDialogOpenForDrawer(false);
          executeOpenDrawer();
        }}
        actionTitle="ຢືນຢັນສິດທິຜູ້ຈັດການເພື່ອໄຂລິ້ນຊັກເງິນ"
      />

      {/* Shift Dialogs */}
      <OpenShiftDialog />
      <CloseShiftBlindDialog />
    </>
  );
}
