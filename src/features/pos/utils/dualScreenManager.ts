// ============================================================================
// Cross-Platform Dual-Screen POS Manager (Tauri Windows + Capacitor Android + Web)
// Unified Orchestration for Customer Display (/customer-display)
// Synchronized Real-Time via BroadcastChannel ('lao_minimart_customer_display')
// ============================================================================

import { registerPlugin } from "@capacitor/core";
import {
  openCustomerDisplayWindow,
  closeCustomerDisplayWindow,
  isTauriEnvironment,
} from "./tauriWindow";
import { notifyCustomerDisplayClosed } from "./customerDisplaySync";

export type PosRuntimePlatform = "tauri" | "capacitor" | "web";

export interface CustomerDisplayPluginContract {
  openCustomerDisplay(options?: { path?: string }): Promise<{
    success: boolean;
    displayId?: number;
    displayName?: string;
    displaysCount?: number;
    message?: string;
  }>;
  closeCustomerDisplay(): Promise<{ success: boolean }>;
  getDisplaysCount(): Promise<{
    displaysCount: number;
    hasSecondaryDisplay: boolean;
  }>;
}

// Register native Capacitor plugin (calls CustomerDisplayPlugin.kt on Android)
export const NativeCustomerDisplay = registerPlugin<CustomerDisplayPluginContract>(
  "CustomerDisplay"
);

let webPopupRef: Window | null = null;

/**
 * Detects the active execution environment
 */
export function getRuntimePlatform(): PosRuntimePlatform {
  if (typeof window === "undefined") return "web";

  // 1. Tauri Windows Desktop
  if (isTauriEnvironment()) {
    return "tauri";
  }

  // 2. Capacitor Android (Sunmi, iMin, Telpo, etc.)
  if (
    Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
    Boolean((window as any).Capacitor?.getPlatform?.() === "android")
  ) {
    return "capacitor";
  }

  // 3. Fallback to standard web browser
  return "web";
}

/**
 * Universal Dual-Screen Launcher:
 * - On Windows (Tauri): Enumerate monitors, move/fullscreen on Monitor #2.
 * - On Android POS (Capacitor): Launches native Android Presentation on secondary hardware display.
 * - On Web Browser (Dev/Test): Opens 1024x768 popup window for live dual testing.
 */
export async function initCustomerDisplay(
  path: string = "/customer-display"
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const platform = getRuntimePlatform();

  // 1. Android POS Terminal (Sunmi / iMin Dual-Screen Presentation)
  if (platform === "capacitor") {
    try {
      const result = await NativeCustomerDisplay.openCustomerDisplay({ path });
      if (result && result.success) {
        return true;
      }
      console.info("[DualScreenManager] Capacitor presentation result:", result);
      return Boolean(result?.success);
    } catch (androidErr) {
      console.warn("[DualScreenManager] Native Android display error:", androidErr);
      return false;
    }
  }

  // 2. Windows PC (Tauri Multi-Monitor API)
  if (platform === "tauri") {
    try {
      return await openCustomerDisplayWindow();
    } catch (tauriErr) {
      console.warn("[DualScreenManager] Tauri window launcher error:", tauriErr);
      return false;
    }
  }

  // 3. Web Browser Fallback (Popup window)
  try {
    if (webPopupRef && !webPopupRef.closed) {
      webPopupRef.focus();
      return true;
    }

    const popupWidth = window.screen?.availWidth || 1280;
    const popupHeight = window.screen?.availHeight || 800;
    const left = (window.screen as any)?.availLeft ?? 0;
    const top = (window.screen as any)?.availTop ?? 0;

    webPopupRef = window.open(
      path,
      "LaoCustomerDisplayPopup",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );

    if (webPopupRef) {
      webPopupRef.focus();
      return true;
    }
  } catch (webErr) {
    console.warn("[DualScreenManager] Web popup blocked or failed:", webErr);
  }

  return false;
}

/**
 * Universal Customer Display Closes
 */
export async function closeCustomerDisplay(): Promise<boolean> {
  const platform = getRuntimePlatform();

  if (platform === "capacitor") {
    try {
      const res = await NativeCustomerDisplay.closeCustomerDisplay();
      return Boolean(res?.success);
    } catch (err) {
      console.warn("[DualScreenManager] Failed to close Android presentation:", err);
      return false;
    }
  }

  if (platform === "tauri") {
    return await closeCustomerDisplayWindow();
  }

  if (webPopupRef && !webPopupRef.closed) {
    webPopupRef.close();
    webPopupRef = null;
    notifyCustomerDisplayClosed();
    return true;
  }

  return await closeCustomerDisplayWindow();
}
