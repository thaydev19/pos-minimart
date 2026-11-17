"use client";

// ============================================================================
// Brand Splash Loading Screen (Lao Minimart POS)
// Displays during initial app startup, auth hydration & catalog loading
// Smooth 60FPS Framer Motion fade-out to prevent any visual flickering
// Zero Emoji - 100% Lucide Icons - Clean Luxury Slate Theme (#F8FAFC)
// ============================================================================

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

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
      style={{ fontFamily: "'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8FAFC] select-none text-center p-6 overflow-hidden pointer-events-none"
    >
      {/* Subtle radial ambient glow */}
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Icon Box with Smooth Rotating Spinner Ring */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Outer glowing spinner ring */}
        <div className="absolute -inset-3 rounded-[32px] border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />

        {/* Inner secondary pulse ring */}
        <div className="absolute -inset-1.5 rounded-[28px] border border-emerald-400/30 animate-pulse" />

        {/* Main Brand Logo Icon */}
        <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-white p-3.5 shadow-2xl shadow-emerald-600/20 border border-slate-200/90">
          <Image
            src="/logo.svg"
            alt="QuickOne Icon"
            width={72}
            height={72}
            className="h-full w-full object-contain"
            priority
          />
        </div>
      </div>

      {/* Store Brand Typography with logo-text */}
      <div className="flex flex-col items-center space-y-1">
        <Image
          src="/logo-text.svg"
          alt="QuickOne POS"
          width={220}
          height={65}
          className="h-11 sm:h-12 w-auto object-contain"
          priority
        />
        <p
          style={{ fontFamily: "'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif" }}
          className="text-xs sm:text-sm font-semibold text-slate-500"
        >
          Enterprise Retail POS • ປາກຊອງ, ຈຳປາສັກ
        </p>
      </div>

      {/* Real-time Status Badge */}
      <div className="mt-8 flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-xs border border-slate-200/90">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span
          style={{ fontFamily: "'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif" }}
          className="text-[11px] font-semibold text-slate-600"
        >
          {message}
        </span>
      </div>

      {/* Bottom Footer Attribution */}
      <div
        style={{ fontFamily: "'Noto Sans Lao', 'Plus Jakarta Sans', sans-serif" }}
        className="absolute bottom-6 text-[10px] text-slate-400 font-medium"
      >
        QuickOne Retail POS Solution • ພາສາລາວ (LAK)
      </div>
    </motion.div>
  );
}
