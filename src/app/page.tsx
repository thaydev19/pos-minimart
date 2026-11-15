"use client";

// ============================================================================
// Root Entry Route (/)
// Defaults straight to POS Terminal for all authenticated users (Zero Redirect Flicker)
// Seamless Brand Splash Loading with 60FPS Framer Motion fade-out
// ============================================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { PosTerminalPage } from "@/features/pos";
import { LoginPage } from "@/features/auth";
import { BrandSplashScreen } from "@/components/BrandSplashScreen";
import { AnimatePresence } from "framer-motion";

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Brief timer to allow underlying DOM & images to stabilize before fading out splash
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <main className="h-full w-full overflow-hidden relative bg-[#F8FAFC]">
      {/* Underlying Page: POS Terminal when authenticated, LoginPage when not */}
      {isAuthenticated && user ? (
        <div className="h-full w-full overflow-hidden">
          <PosTerminalPage />
        </div>
      ) : (
        !isLoading && (
          <div className="h-full w-full overflow-hidden">
            <LoginPage />
          </div>
        )
      )}

      {/* Brand Splash Overlay - Cross-fades smoothly over the ready interface */}
      <AnimatePresence>
        {showSplash && (
          <BrandSplashScreen
            key="brand-splash-overlay"
            message={
              isAuthenticated && user
                ? "ກຳລັງເປີດລະບົບຂາຍໜ້າຮ້ານ POS..."
                : "ກຳລັງໂຫຼດຂໍ້ມູນລະບົບ..."
            }
          />
        )}
      </AnimatePresence>
    </main>
  );
}
