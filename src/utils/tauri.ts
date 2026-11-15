// ============================================================================
// Tauri Window Automation & Lifecycle Utilities
// Safe on Desktop (Tauri), Android (Capacitor), and Web Browser
// ============================================================================

export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).__TAURI__ ||
      (window as any).__TAURI_INTERNALS__ ||
      (window as any).__TAURI_METADATA__
  );
}

/**
 * Ensures Tauri main window is revealed and focused.
 * Invokes native Rust command for 0ms visual reveal, eliminating all white flash.
 */
export async function showTauriMainWindow(): Promise<void> {
  if (typeof window === "undefined" || !isTauri()) return;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("show_main_window");
  } catch {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      if (win) {
        if (typeof win.show === "function") await win.show();
        if (typeof win.setFocus === "function") await win.setFocus();
      }
    } catch (err) {
      console.debug("[Tauri] showTauriMainWindow info:", err);
    }
  }
}
