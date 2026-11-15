"use client";

// ============================================================================
// Tauri Window Initializer
// Safe on Desktop (Tauri), Android (Capacitor), and Web Browser
// ============================================================================

import { useEffect } from "react";
import { showTauriMainWindow } from "@/utils/tauri";

export function TauriWindowInitializer() {
  useEffect(() => {
    // 1. Pre-warm local Lao fonts into GPU cache to prevent any DokChampa fallback flickers
    if (typeof document !== "undefined" && "fonts" in document) {
      try {
        document.fonts.load('13px "Noto Sans Lao"');
        document.fonts.load('bold 13px "Noto Sans Lao"');
        document.fonts.load('14px "Noto Sans Lao"');
        document.fonts.load('bold 14px "Noto Sans Lao"');
        document.fonts.load('16px "Noto Sans Lao"');
        document.fonts.load('bold 16px "Noto Sans Lao"');
        document.fonts.load('bold 24px "Noto Sans Lao"');
        document.fonts.load('800 28px "Noto Sans Lao"');
      } catch (err) {
        console.debug("[Font] Font pre-warm notice:", err);
      }
    }

    // 2. Wait for the first two paint frames so the Brand Splash Screen
    // and styles are fully composited by the GPU before revealing the window.
    // This eliminates the 2s blank white screen completely.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        showTauriMainWindow();
      });
    });
  }, []);

  return null;
}
