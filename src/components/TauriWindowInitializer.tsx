"use client";

// ============================================================================
// Tauri Window Initializer
// Safe on Desktop (Tauri), Android (Capacitor), and Web Browser
// ============================================================================

import { useEffect } from "react";
import { showTauriMainWindow } from "@/utils/tauri";

export function TauriWindowInitializer() {
  useEffect(() => {
    showTauriMainWindow();
  }, []);

  return null;
}
