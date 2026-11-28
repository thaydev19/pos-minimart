"use client";

// ============================================================================
// Master POS Terminal Page: Compact Density (100vh Locked)
// Unified Control Bar (Search + Category + View Toggle) with Dynamic Supabase & Dexie
// Responsive: Mobile Floating Cart Bar & Slide-Over Drawer (< 768px)
// ============================================================================

import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Database,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { syncEngine } from "@/apis/sync-engine";
import { PosHeader } from "../components/PosHeader";
import { CatalogControlBar } from "../components/CatalogControlBar";
import { ProductCatalogGrid } from "../components/ProductCatalogGrid";
import { CartPanel } from "../components/CartPanel";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { useGlobalBarcodeScanner } from "../hooks/useGlobalBarcodeScanner";
import { usePosStore } from "../stores/pos.store";
import { formatLak } from "@/utils/formatLakCurrency";
import {
  subscribeCustomerDisplay,
  broadcastCurrentCustomerDisplayState,
} from "../utils/customerDisplaySync";
import { FloatingCustomerDisplay } from "../components/FloatingCustomerDisplay";

export function PosTerminalPage() {
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const { isOnline, pendingCount } = useOnlineStatus();

  const cart = usePosStore((s) => s.cart);
  const totals = usePosStore((s) => s.totals);
  const clearCart = usePosStore((s) => s.clearCart);
  const holdCurrentOrder = usePosStore((s) => s.holdCurrentOrder);
  const loadCatalog = usePosStore((s) => s.loadCatalog);
  const isCustomerDisplayFloatingOpen = usePosStore(
    (s) => s.isCustomerDisplayFloatingOpen
  );
  const setCustomerDisplayFloatingOpen = usePosStore(
    (s) => s.setCustomerDisplayFloatingOpen
  );

  // Automatically fetch fresh catalog from Supabase / Local DB on mount
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Dual-Screen Customer Display Synchronization Listener
  useEffect(() => {
    // Respond to Customer Display requests for state sync (preserves active payment/QR)
    const unsubscribe = subscribeCustomerDisplay((msg: any) => {
      if (
        msg.type === "REQUEST_INITIAL_STATE" ||
        msg.type === "REQUEST_CUSTOMER_DISPLAY_SYNC" ||
        msg.type === "CUSTOMER_DISPLAY_READY" ||
        msg.type === "CUSTOMER_DISPLAY_PING"
      ) {
        broadcastCurrentCustomerDisplayState();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 1. Focused Input Barcode Search Handler
  const {
    searchInput,
    setSearchInput,
    inputRef,
    handleManualSearch,
    focusScanner,
  } = useBarcodeScanner({
    onScanSuccess: (prodName) => {
      setScanMessage(`+ ໄດ້ເພີ່ມ: ${prodName}`);
      setScanError(null);
      setSearchInput("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setTimeout(() => setScanMessage(null), 2500);
    },
    onScanError: (barcode) => {
      setScanError(`ບໍ່ພົບສິນຄ້າບາໂຄດ: ${barcode}`);
      setScanMessage(null);
      setSearchInput("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setTimeout(() => setScanError(null), 3500);
    },
  });

  // 2. Global Hardware Barcode Gun Listener (Works from anywhere on screen)
  useGlobalBarcodeScanner({
    onScanSuccess: (prodName, qty) => {
      setScanMessage(`+ ໄດ້ເພີ່ມ (${qty}): ${prodName}`);
      setScanError(null);
      setSearchInput("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setTimeout(() => setScanMessage(null), 2500);
    },
    onScanError: (barcode) => {
      setScanError(`ບໍ່ພົບສິນຄ້າບາໂຄດ: ${barcode}`);
      setScanMessage(null);
      setSearchInput("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setTimeout(() => setScanError(null), 3500);
    },
  });

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        focusScanner();
      } else if (e.key === "F2") {
        e.preventDefault();
        if (cart.length > 0) {
          holdCurrentOrder();
        }
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) {
          window.dispatchEvent(new CustomEvent("pos:trigger-clear-cart"));
        }
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [cart, holdCurrentOrder, clearCart, focusScanner]);

  const handleBarcodeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      handleManualSearch(searchInput);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#F8F9FA] select-none text-slate-900 font-sans">
      <PosHeader />

      {/* Network Offline / Pending Sync Status Bar */}
      {!isOnline && (
        <div className="shrink-0 mx-2.5 sm:mx-3 mt-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs text-amber-900 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-200/90 text-amber-800 shrink-0">
              <WifiOff className="h-3 w-3" />
            </div>
            <div className="truncate">
              <span className="font-extrabold text-amber-950">ໂໝດຂາຍອອບລາຍ (Offline):</span>{" "}
              <span className="text-amber-800 font-medium">
                ບໍ່ມີສັນຍານອິນເຕີເນັດ. ທ່ານຍັງສາມາດຍິງບາໂຄດ, ຂາຍເງິນສົດ, ພິມໃບບິນ ແລະ ຕັດສະຕັອກໄດ້ປົກກະຕິ.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/90 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                <Database className="h-3 w-3" />
                {pendingCount} ບິນລໍຖ້າຊິ້ງ
              </span>
            )}
          </div>
        </div>
      )}

      {isOnline && pendingCount > 0 && (
        <div className="shrink-0 mx-2.5 sm:mx-3 mt-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-1.5 text-xs text-sky-900 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-200/90 text-sky-800 shrink-0">
              <RefreshCw className="h-3 w-3 animate-spin" />
            </div>
            <div className="truncate">
              <span className="font-extrabold text-sky-950">ກຳລັງຊິ້ງຂໍ້ມູນບິນອອບລາຍ:</span>{" "}
              <span className="text-sky-800 font-medium">
                ພົບ {pendingCount} ບິນທີ່ບັນທຶກໄວ້ໃນເຄື່ອງ, ກຳລັງນຳສົ່ງຂຶ້ນ Cloud ອັດຕະໂນມັດ...
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => syncEngine.processQueue()}
            className="inline-flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-0.5 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            <span>ຊິ້ງດຽວນີ້</span>
          </button>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden p-2.5 sm:p-3 gap-2.5 sm:gap-3 min-h-0">
        {/* Left Area: Unified Control Bar + Product Catalog Grid */}
        <section className="flex flex-1 flex-col overflow-hidden gap-2.5 min-w-0 min-h-0">
          <div className="relative shrink-0">
            <CatalogControlBar
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearchSubmit={handleBarcodeFormSubmit}
              inputRef={inputRef}
              onCameraBarcodeScanned={(barcode) => handleManualSearch(barcode)}
            />
          </div>

          <div className="relative flex-1 min-h-0">
            <ProductCatalogGrid
              searchFilter={searchInput}
              onClearSearch={() => setSearchInput("")}
            />
          </div>
        </section>

        {/* Top-Centered Floating Toast Notification for Barcode Scan & Cart Actions */}
        {(scanMessage || scanError) && (
          <div
            style={{
              position: "fixed",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
            }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300"
          >
            <div
              style={{
                backgroundColor: scanMessage ? "#059669" : "#e11d48",
                color: "#ffffff",
                borderColor: scanMessage ? "#047857" : "#be123c",
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold tracking-tight animate-in fade-in zoom-in-95 duration-200 ${
                scanMessage
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-rose-600 text-white border-rose-700"
              }`}
            >
              {scanMessage ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-white" />
              )}
              <span className="leading-snug">{scanMessage || scanError}</span>
            </div>
          </div>
        )}

        {/* Right Area: Cart & Payment Sidebar (Desktop & POS Small Screen >= 520px) */}
        <aside className="hidden min-[520px]:flex w-[260px] sm:w-[310px] md:w-[380px] lg:w-[440px] xl:w-[480px] shrink-0 flex-col overflow-hidden">
          <CartPanel />
        </aside>
      </main>

      {/* Floating Bottom Cart Bar (Mobile Only: < 520px when cart has items) */}
      {totals.totalItemCount > 0 && !isMobileCartOpen && (
        <div className="fixed bottom-3 left-3 right-3 z-40 min-[520px]:hidden">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full flex items-center justify-between rounded-xl bg-slate-900 text-white px-3.5 py-2.5 shadow-xl active:scale-[0.99] transition-all cursor-pointer border border-slate-800"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-xs">
                <ShoppingBag className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-2xs">
                  {totals.totalItemCount}
                </span>
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-300 font-medium leading-none">
                  ກະຕ່າສິນຄ້າ ({totals.totalItemCount} ລາຍການ)
                </div>
                <div className="text-sm font-extrabold text-white tabular-nums leading-tight mt-0.5">
                  {formatLak(totals.finalTotal)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 transition-all">
              <span>ເບິ່ງກະຕ່າ</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer Sheet (< 520px) */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 min-[520px]:hidden flex flex-col bg-black/65">
          <div
            className="absolute inset-0"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="relative mt-auto h-[90vh] w-full rounded-t-2xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                  <ShoppingBag className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  ກະຕ່າສິນຄ້າ ({totals.totalItemCount} ລາຍການ)
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200/80 text-slate-600 hover:bg-slate-300 transition-all cursor-pointer"
                title="ປິດ"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Cart Panel Inside Drawer */}
            <div className="flex-1 overflow-hidden p-2">
              <CartPanel />
            </div>
          </div>
        </div>
      )}

      {/* Floating In-App Customer Display (Single-screen WSA / Tablet / PC fallback) */}
      <FloatingCustomerDisplay
        isOpen={isCustomerDisplayFloatingOpen}
        onClose={() => setCustomerDisplayFloatingOpen(false)}
      />
    </div>
  );
}
