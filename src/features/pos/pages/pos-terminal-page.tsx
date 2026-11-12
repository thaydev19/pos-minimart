"use client";

// ============================================================================
// Master POS Terminal Page: Compact Density (100vh Locked)
// Unified Control Bar (Search + Category + View Toggle) with Dynamic Supabase & Dexie
// Responsive: Mobile Floating Cart Bar & Slide-Over Drawer (< 768px)
// ============================================================================

import React, { useEffect, useState } from "react";
import { ShoppingBag, ChevronUp, X } from "lucide-react";
import { PosHeader } from "../components/PosHeader";
import { CatalogControlBar } from "../components/CatalogControlBar";
import { ProductCatalogGrid } from "../components/ProductCatalogGrid";
import { CartPanel } from "../components/CartPanel";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { useGlobalBarcodeScanner } from "../hooks/useGlobalBarcodeScanner";
import { usePosStore } from "../stores/pos.store";
import { formatLak } from "@/utils/formatLakCurrency";

export function PosTerminalPage() {
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const cart = usePosStore((s) => s.cart);
  const totals = usePosStore((s) => s.totals);
  const clearCart = usePosStore((s) => s.clearCart);
  const holdCurrentOrder = usePosStore((s) => s.holdCurrentOrder);
  const loadCatalog = usePosStore((s) => s.loadCatalog);

  // Automatically fetch fresh catalog from Supabase / Local DB on mount
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // 1. Global Hardware Barcode Gun Listener (Works from anywhere on screen)
  useGlobalBarcodeScanner({
    onScanSuccess: (prodName, qty) => {
      setScanMessage(`+ ໄດ້ເພີ່ມ (${qty}): ${prodName}`);
      setScanError(null);
      setTimeout(() => setScanMessage(null), 2500);
    },
    onScanError: (barcode) => {
      setScanError(`ບໍ່ພົບສິນຄ້າບາໂຄດ: ${barcode}`);
      setScanMessage(null);
      setTimeout(() => setScanError(null), 3500);
    },
  });

  // 2. Focused Input Barcode Search Handler
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
      setTimeout(() => setScanMessage(null), 2500);
    },
    onScanError: (barcode) => {
      setScanError(`ບໍ່ພົບສິນຄ້າບາໂຄດ: ${barcode}`);
      setScanMessage(null);
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
        if (cart.length > 0) holdCurrentOrder();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) clearCart();
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

      <main className="flex flex-1 overflow-hidden p-2.5 sm:p-3 gap-2.5 sm:gap-3">
        {/* Left Area (60%): Unified Control Bar + Product Catalog Grid */}
        <section className="flex flex-[3] flex-col overflow-hidden gap-2.5 min-w-0">
          <div className="relative">
            <CatalogControlBar
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearchSubmit={handleBarcodeFormSubmit}
              inputRef={inputRef}
            />

            {scanMessage && (
              <div className="absolute top-full mt-1.5 left-0 z-20 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-md animate-in fade-in slide-in-from-top-1">
                {scanMessage}
              </div>
            )}
            {scanError && (
              <div className="absolute top-full mt-1.5 left-0 z-20 rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-md animate-in fade-in slide-in-from-top-1">
                {scanError}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <ProductCatalogGrid searchFilter={searchInput} />
          </div>
        </section>

        {/* Right Area (40%): Cart & Payment (Desktop & Tablet) */}
        <aside className="hidden md:flex flex-[2] flex-col overflow-hidden min-w-[340px] max-w-[440px]">
          <CartPanel />
        </aside>
      </main>

      {/* Floating Bottom Cart Bar (Mobile Only: < 768px when cart has items) */}
      {totals.totalItemCount > 0 && !isMobileCartOpen && (
        <div className="fixed bottom-3 left-3 right-3 z-40 md:hidden">
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

      {/* Mobile Cart Drawer Sheet (< 768px) */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
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
    </div>
  );
}
