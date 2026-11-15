"use client";

// ============================================================================
// Customer-Facing Dual Screen Display (/customer-display)
// Fullscreen Real-Time Terminal for Minimart Shoppers (ພາສາລາວ)
// 4 Distinct Unified Steps: IDLE -> CART -> PAYMENT -> SUCCESS
// Smooth 60FPS Framer Motion Transitions + Spring Physics
// Zero Emoji - 100% Lucide Icons - Auto-scroll on Scan - Big Bold Typography
// ============================================================================

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Clock,
  ShoppingBag,
  QrCode,
  CheckCircle2,
  Package,
  Layers,
  Banknote,
  Coins,
  Receipt,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  subscribeCustomerDisplay,
  requestCustomerDisplaySync,
  getLatestCustomerDisplayPayload,
  CustomerDisplayPayload,
  DEFAULT_CUSTOMER_DISPLAY_PAYLOAD,
} from "@/features/pos/utils/customerDisplaySync";
import { formatLak } from "@/utils/formatLakCurrency";

export default function CustomerDisplayPage() {
  const [payload, setPayload] = useState<CustomerDisplayPayload>(() => {
    return getLatestCustomerDisplayPayload();
  });

  const [isConnected, setIsConnected] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [countdownSeconds, setCountdownSeconds] = useState(4);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const listBottomRef = useRef<HTMLDivElement>(null);

  // Toggle Fullscreen in Tauri Desktop Window or Web Browser
  const toggleFullscreen = async () => {
    try {
      const tauri = typeof window !== "undefined" ? (window as any).__TAURI__ : null;
      const win =
        tauri?.window?.getCurrentWindow?.() ||
        tauri?.webviewWindow?.getCurrentWebviewWindow?.();

      if (win && typeof win.isFullscreen === "function") {
        const current = await win.isFullscreen();
        await win.setFullscreen(!current);
        setIsFullscreen(!current);
        return;
      }

      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn("Fullscreen toggle error:", e);
    }
  };

  // 1. Real-time Clock
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
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Real-time Sync & Handshake across Windows / Tabs / Devices
  useEffect(() => {
    // Immediate hydration from cache
    const initial = getLatestCustomerDisplayPayload();
    if (initial) {
      setPayload(initial);
      setIsConnected(true);
    }

    // Subscribe to unified state engine
    const unsubscribe = subscribeCustomerDisplay((incoming: any) => {
      if (!incoming) return;
      setIsConnected(true);

      // If incoming is a full unified payload (has step property)
      if (incoming.step) {
        setPayload(incoming as CustomerDisplayPayload);
      }
    });

    // Proactively request latest state on mount
    requestCustomerDisplaySync();

    // Re-request sync whenever window regains focus
    const handleFocus = () => {
      requestCustomerDisplaySync();
    };
    window.addEventListener("focus", handleFocus);

    // Heartbeat ping every 5s to keep status active
    const pingInterval = setInterval(() => {
      requestCustomerDisplaySync();
    }, 5000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(pingInterval);
      unsubscribe();
    };
  }, []);

  // 3. Auto-scroll to the bottom when new item is scanned in CART or PAYMENT step
  useEffect(() => {
    if (payload.cartItems && payload.cartItems.length > 0) {
      listBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [payload.cartItems]);

  // 4. Visual 4-second Countdown Timer during SUCCESS step
  useEffect(() => {
    if (payload.step === "SUCCESS") {
      setCountdownSeconds(4);
      const timer = setInterval(() => {
        setCountdownSeconds((prev) => (prev > 1 ? prev - 1 : 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [payload.step]);

  const items = payload.cartItems || [];
  const subtotal = payload.subtotal || 0;
  const discount = payload.discount || 0;
  const total = payload.totalAmount || 0;
  const totalQuantity =
    payload.totalQuantity ||
    items.reduce((sum, item) => sum + item.quantity, 0);

  const payment = payload.payment || DEFAULT_CUSTOMER_DISPLAY_PAYLOAD.payment;
  const isQrMode = payment.method === "QR" || payment.method === "SPLIT";
  const qrAmountToPay =
    payment.qrAmount > 0 ? payment.qrAmount : total;

  return (
    <div className="flex h-full w-full min-h-0 min-w-0 flex-1 overflow-hidden bg-[#0B0F17] text-white font-sans select-none relative">
      {/* ==================================================================== */}
      {/* STEP 4: OVERLAY SUCCESS CONFIRMATION (Spring Animation)              */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {payload.step === "SUCCESS" && (
          <motion.div
            key="success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#0B0F17]/95 backdrop-blur-md p-6 sm:p-10"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 24,
              }}
              className="w-full max-w-xl rounded-3xl bg-zinc-900/90 border-2 border-emerald-500/80 p-8 sm:p-10 text-center shadow-2xl shadow-emerald-950/60 flex flex-col items-center relative overflow-hidden"
            >
              {/* Radial glow background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Bouncing checkmark badge */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                  delay: 0.1,
                }}
                className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-2xl shadow-emerald-500/50 mb-5"
              >
                <CheckCircle2 className="h-12 w-12 sm:h-14 sm:w-14" />
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                ຊຳລະເງິນສຳເລັດແລ້ວ!
              </h2>
              <p className="text-sm sm:text-base text-emerald-400 font-semibold mt-1">
                Payment Completed Successfully
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-medium">
                ຂອບໃຈທີ່ອຸດໜູນ • Thank You for Shopping!
              </p>

              {/* Transaction Summary Box */}
              <div className="w-full mt-6 space-y-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 p-5 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400 font-medium">
                    ຮູບແບບການຊຳລະ (Method):
                  </span>
                  <span className="font-bold text-white uppercase px-2.5 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs">
                    {payment.method === "QR"
                      ? "LAO QR (BCEL One)"
                      : payment.method === "SPLIT"
                      ? "ສົດ + QR (Mixed Tender)"
                      : "ເງິນສົດ (Cash)"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
                  <span className="text-sm text-zinc-400 font-medium">
                    ຍອດເງິນທີ່ຊຳລະ (Paid):
                  </span>
                  <span className="text-2xl font-black text-white tabular-nums">
                    {formatLak(total)}
                  </span>
                </div>

                {payment.changeAmount > 0 && (
                  <div className="flex items-center justify-between border-t border-emerald-900/60 pt-3 bg-emerald-950/40 -mx-5 -mb-5 p-4 rounded-b-2xl border">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Coins className="h-5 w-5" />
                      <span className="text-sm font-bold">
                        ເງິນທອນທີ່ຕ້ອງສົ່ງລູກຄ້າ (Change):
                      </span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                      {formatLak(payment.changeAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Visual Countdown Progress Bar */}
              <div className="w-full mt-6 space-y-2">
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 4, ease: "linear" }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                  <span>ກຳລັງກັບສູ່ໜ້າຫຼັກ (Returning to idle screen)...</span>
                  <span className="font-mono text-zinc-400 font-bold">
                    {countdownSeconds}s
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* STEP 1: IDLE WELCOME SCREEN (When cart is empty & not in success)   */}
      {/* ==================================================================== */}
      {payload.step === "IDLE" && (
        <motion.div
          key="step-idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col flex-1 min-w-0 h-full bg-[#0B0F17]"
        >
          {/* Header Bar */}
          <header
            data-tauri-drag-region
            className="h-14 sm:h-16 px-4 sm:px-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md shrink-0 select-none"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/40">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-wide leading-tight">
                  {payload.storeName || "ມິນິມາດ ລາວຈະເລີນ"}
                </h1>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Lao Chaleun Minimart • Customer Display System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection status badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-800/60 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ເຊື່ອມຕໍ່ກັບ POS ແລ້ວ</span>
              </div>

              {/* Real-time Clock */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-zinc-300">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                <span>{currentTime || "00:00:00"}</span>
              </div>

              {/* Fullscreen Toggle Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="h-7 sm:h-8 px-2.5 rounded-lg flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer select-none"
                title={isFullscreen ? "ອອກຈາກເຕັມຈໍ (Exit Fullscreen)" : "ເຕັມຈໍ (Fullscreen)"}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5 text-zinc-300" />
                    <span className="hidden sm:inline text-[11px]">ຫຍໍ້ລົງ</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="hidden sm:inline text-[11px]">ເຕັມຈໍ</span>
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Idle Center Hero */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative mb-6">
              <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-zinc-900/90 border-2 border-emerald-500/40 text-emerald-400 shadow-2xl shadow-emerald-950/60">
                <Store className="h-12 w-12 sm:h-14 sm:w-14" />
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              ຍິນດີຕ້ອນຮັບສູ່ {payload.storeName || "ມິນິມາດ ລາວຈະເລີນ"}
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 mt-2.5 max-w-lg font-medium">
              Welcome to Lao Chaleun Minimart
            </p>

            <div className="mt-8 flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-sm font-semibold text-zinc-200 shadow-xl max-w-md">
              <ShoppingBag className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>
                ກະລຸນາວາງສິນຄ້າເທິງເຄົາເຕີເພື່ອຄິດໄລ່ເງິນ (Please place items on the counter)
              </span>
            </div>

            {/* Supported Payment Badges */}
            <div className="mt-12 flex items-center gap-6 sm:gap-8 text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                ເງິນສົດ (Cash LAK)
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                LAO QR (BCEL OnePay / LAPNet)
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                ທຸກທະນາຄານໃນລາວ
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ==================================================================== */}
      {/* STEP 2 & STEP 3: 2-COLUMN LAYOUT (CART & PAYMENT)                    */}
      {/* ==================================================================== */}
      {(payload.step === "CART" || payload.step === "PAYMENT") && (
        <div className="flex h-full w-full min-h-0 min-w-0 flex-1 overflow-hidden">
          {/* ================================================================ */}
          {/* LEFT COLUMN (65% Width) - Scanned Items List                     */}
          {/* ================================================================ */}
          <div className="flex flex-col flex-1 min-w-0 h-full border-r border-zinc-800/80 bg-[#0B0F17]">
            {/* Header Bar */}
            <header
              data-tauri-drag-region
              className="h-14 sm:h-16 px-4 sm:px-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md shrink-0 select-none"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/30">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-white tracking-wide leading-tight">
                    {payload.storeName || "ມິນິມາດ ລາວຈະເລີນ"}
                  </h1>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Lao Chaleun Minimart • Customer Display
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Live Connection Status Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-800/60 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ເຊື່ອມຕໍ່ກັບ POS ແລ້ວ</span>
                </div>

                {/* Real-time Clock */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-zinc-300">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{currentTime || "00:00:00"}</span>
                </div>

                {/* Fullscreen Toggle Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="h-7 sm:h-8 px-2.5 rounded-lg flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer select-none"
                  title={isFullscreen ? "ອອກຈາກເຕັມຈໍ (Exit Fullscreen)" : "ເຕັມຈໍ (Fullscreen)"}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5 text-zinc-300" />
                      <span className="hidden sm:inline text-[11px]">ຫຍໍ້ລົງ</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="hidden sm:inline text-[11px]">ເຕັມຈໍ</span>
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-6 py-2.5 bg-zinc-900/80 text-xs font-bold text-zinc-400 border-b border-zinc-800/80 shrink-0">
              <div className="col-span-1 font-mono">#</div>
              <div className="col-span-5">ລາຍການສິນຄ້າ (Product)</div>
              <div className="col-span-2 text-center">ຈຳນວນ (Qty)</div>
              <div className="col-span-2 text-right">ລາຄາ (Price)</div>
              <div className="col-span-2 text-right">ລວມ (Total)</div>
            </div>

            {/* Table Rows with Framer Motion AnimatePresence */}
            <div className="flex-1 overflow-y-auto px-6 py-2 divide-y divide-zinc-800/50">
              <AnimatePresence initial={false}>
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-12 gap-3 py-3 items-center hover:bg-zinc-900/40 transition-colors"
                  >
                    {/* Index */}
                    <div className="col-span-1 text-xs font-mono font-bold text-zinc-500">
                      {index + 1}
                    </div>

                    {/* Product Thumbnail + Name + Unit Badge */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0 pr-2">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-zinc-900 border border-zinc-800 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate leading-snug">
                          {item.name}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {item.isPack ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-[11px] font-extrabold shadow-2xs">
                              <Layers className="h-3 w-3" />
                              <span>
                                {item.unitName} (x{item.packSize})
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 text-[11px] font-medium border border-zinc-700/50">
                              {item.unitName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2 flex justify-center items-center">
                      <span className="inline-block px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700/70 text-sm font-black text-white font-mono shadow-2xs">
                        x {item.quantity}
                      </span>
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2 text-right text-xs font-medium text-zinc-400 tabular-nums">
                      {formatLak(item.unitPrice)}
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-2 text-right text-base font-black text-emerald-400 tabular-nums">
                      {formatLak(item.subtotal)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={listBottomRef} />
            </div>
          </div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN (35% Width) - Summary & Dynamic Payment Area         */}
          {/* ================================================================ */}
          <div className="w-[35%] max-w-[480px] min-w-[320px] bg-zinc-900/90 border-l border-zinc-800 p-4 sm:p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
            {/* Top Section: Order Summary Header & Dynamic Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  ສະຫຼຸບຍອດຊື້ (Order Summary)
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {items.length} ລາຍການ ({totalQuantity} ຊິ້ນ)
                </span>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between text-zinc-400">
                  <span>ມູນຄ່າສິນຄ້າ (Subtotal)</span>
                  <span className="font-mono text-zinc-200 tabular-nums font-semibold">
                    {formatLak(subtotal)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>ສ່ວນຫຼຸດ (Discount)</span>
                    <span className="font-mono tabular-nums font-semibold">
                      -{formatLak(discount)}
                    </span>
                  </div>
                )}
              </div>

              {/* DYNAMIC CONTENT SWITCHER WITH FRAMER MOTION */}
              <AnimatePresence mode="wait">
                {payload.step === "PAYMENT" && isQrMode ? (
                  /* ======================================================== */
                  /* STEP 3A: LAO QR SCANNER VIEW (Permanent until confirmed)   */
                  /* ======================================================== */
                  <motion.div
                    key="payment-qr"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-2xl bg-zinc-950 border-2 border-emerald-500/60 text-center space-y-3.5 shadow-xl"
                  >
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700 text-xs font-bold text-emerald-400">
                      <QrCode className="h-3.5 w-3.5" />
                      <span>ສະແກນຊຳລະຜ່ານ LAO QR (Scan to Pay)</span>
                    </div>

                    {/* High-Contrast Pristine QR Container using /QR.png */}
                    <div className="relative mx-auto flex items-center justify-center rounded-2xl sm:rounded-3xl bg-white p-3 sm:p-4 shadow-2xl border-2 border-emerald-500 w-52 h-52 sm:w-60 sm:h-60">
                      <img
                        src="/QR.png"
                        alt="LAO QR - LAPNet Standard"
                        className="w-full h-full object-contain select-none"
                      />
                    </div>

                    {/* QR Payment Amount Highlight */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-400 block font-medium">
                        ຍອດເງິນໂອນ (Transfer Amount)
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums tracking-tight">
                        {formatLak(qrAmountToPay)}
                      </div>
                    </div>

                    {/* Breathing Waiting Status Badge */}
                    <div className="flex items-center justify-center gap-2 pt-1 text-xs text-emerald-300 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>ກຳລັງລໍຖ້າການຊຳລະເງິນ...</span>
                    </div>

                    <p className="text-[10px] text-zinc-500 leading-tight">
                      ຮອງຮັບ BCEL OnePay, LDB, JDB ແລະ ທຸກທະນາຄານ (LAPNet Standard)
                    </p>
                  </motion.div>
                ) : payload.step === "PAYMENT" && payment.method === "CASH" ? (
                  /* ======================================================== */
                  /* STEP 3B: CASH TENDER COMPARISON VIEW                     */
                  /* ======================================================== */
                  <motion.div
                    key="payment-cash"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-3.5 shadow-xl"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 px-1">
                      <Banknote className="h-4 w-4" />
                      <span>ຊຳລະດ້ວຍເງິນສົດ (Cash Payment)</span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Total Payable */}
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-medium">
                          ຍອດທີ່ຕ້ອງຊຳລະ:
                        </span>
                        <span className="text-lg font-black text-white tabular-nums">
                          {formatLak(total)}
                        </span>
                      </div>

                      {/* Cash Received */}
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-medium">
                          ເງິນທີ່ຮັບຈາກລູກຄ້າ:
                        </span>
                        <span className="text-lg font-black text-amber-300 tabular-nums">
                          {formatLak(payment.cashReceived || total)}
                        </span>
                      </div>

                      {/* Cash Change Highlight */}
                      {payment.changeAmount > 0 && (
                        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-600/70 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-emerald-300">
                            <Coins className="h-4 w-4" />
                            <span className="text-xs font-bold">
                              ເງິນທອນທີ່ຕ້ອງສົ່ງ:
                            </span>
                          </div>
                          <span className="text-2xl font-black text-emerald-400 tabular-nums">
                            {formatLak(payment.changeAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* ======================================================== */
                  /* STEP 2: CART INFO CARD (Pre-checkout scanning advice)    */
                  /* ======================================================== */
                  <motion.div
                    key="cart-info"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-center text-xs text-zinc-400 space-y-2"
                  >
                    <div className="flex items-center justify-center gap-2 text-zinc-300 font-semibold">
                      <Receipt className="h-4 w-4 text-emerald-400" />
                      <span>ກວດສອບລາຍການ ແລະ ລາຄາເທິງໜ້າຈໍ</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      ທ່ານສາມາດເລືອກຊຳລະດ້ວຍ ເງິນສົດ (Cash) ຫຼື ສະແກນ QR Code ໄດ້ສະດວກສະບາຍ
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Section: Huge Grand Total Card (Never Clipped) */}
            <div className="pt-3 sm:pt-4 shrink-0">
              <div className="bg-emerald-600 rounded-2xl p-4 sm:p-5 text-white shadow-2xl border border-emerald-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between text-xs font-bold text-emerald-100 uppercase tracking-wider">
                  <span>ຍອດລວມທັງໝົດ</span>
                  <span>TOTAL (LAK)</span>
                </div>

                <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums mt-1 text-white">
                  {formatLak(total)}
                </div>

                <p className="text-[10px] text-emerald-100/90 font-medium mt-1.5">
                  ລາຄາລວມພາສີມູນຄ່າເພີ່ມແລ້ວ (VAT Included)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
