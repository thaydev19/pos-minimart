// ============================================================================
// POS Haptic & Vibration Feedback Service
// Provides instant tactile response on touchscreens and Android tablets
// ============================================================================

import { registerPlugin } from "@capacitor/core";

interface PosHardwarePluginContract {
  triggerVibration(options?: { durationMs?: number }): Promise<{ success: boolean }>;
}

const NativePosHardware = registerPlugin<PosHardwarePluginContract>("PosHardware");

/**
 * Triggers a crisp tactile haptic feedback tick
 * @param durationMs Milliseconds to vibrate (default 25ms for button clicks)
 */
export function triggerHapticFeedback(durationMs: number = 25): void {
  if (typeof window === "undefined") return;

  // 1. Try Native Android Capacitor plugin
  try {
    if (Boolean((window as any).Capacitor?.isNativePlatform?.())) {
      NativePosHardware.triggerVibration({ durationMs }).catch(() => {});
      return;
    }
  } catch {}

  // 2. Standard Web Vibration API
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(durationMs);
    }
  } catch {}
}
