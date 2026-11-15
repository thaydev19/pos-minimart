"use client";

// ============================================================================
// Brand Splash Loading Screen (Lao Minimart POS)
// Displays during initial app startup, auth hydration & catalog loading
// Smooth 60FPS Framer Motion fade-out to prevent any visual flickering
// Zero Emoji - 100% Lucide Icons - Clean Luxury Slate Theme (#F8FAFC)
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import { Store } from "lucide-react";

interface BrandSplashScreenProps {
  message?: string;
}

export function BrandSplashScreen({
  message = "ກຳລັງໂຫຼດຂໍ້ມູນລະບົບ (Loading System Data)...",
}: BrandSplashScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8FAFC] select-none text-center p-6 overflow-hidden pointer-events-none"
    >
      {/* Subtle radial ambient glow */}
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Icon Box with Smooth Rotating Spinner Ring */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Outer glowing spinner ring */}
        <div className="absolute -inset-3 rounded-[32px] border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />

        {/* Inner secondary pulse ring */}
        <div className="absolute -inset-1.5 rounded-[28px] border border-emerald-400/30 animate-pulse" />

        {/* Main Brand Logo Icon */}
        <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-2xl shadow-emerald-600/35 border border-emerald-500">
          <Store className="h-10 w-10 sm:h-12 sm:w-12" />
        </div>
      </div>

      {/* Store Brand Typography */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          ມິນິມາດ ລາວຈະເລີນ
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-500">
          Lao Minimart POS • Enterprise Terminal
        </p>
      </div>

      {/* Real-time Status Badge */}
      <div className="mt-8 flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-xs border border-slate-200/90">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-medium text-slate-600">{message}</span>
      </div>

      {/* Bottom Footer Attribution */}
      <div className="absolute bottom-6 text-[10px] text-slate-400 font-medium">
        Lao Minimart Retail POS Solution • ພາສາລາວ (LAK)
      </div>
    </motion.div>
  );
}
