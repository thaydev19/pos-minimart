// ============================================================================
// Tauri Window Automation & Fallback Popup for Dual-Screen POS
// Manages Customer Display Window (/customer-display) on Windows Multi-Monitor
// ============================================================================

import { notifyCustomerDisplayClosed } from "./customerDisplaySync";

let customerDisplayPopupRef: Window | null = null;
let customerDisplayTauriWinRef: any = null;

async function resolveTauriWebviewWindow(): Promise<any> {
  const tauri = (window as any).__TAURI__;
  const fromGlobal = (tauri?.webviewWindow || tauri?.window)?.WebviewWindow;
  if (fromGlobal) return fromGlobal;
  try {
    const mod = await import("@tauri-apps/api/webviewWindow");
    return mod.WebviewWindow;
  } catch {
    return null;
  }
}

/**
 * Checks if running inside Tauri desktop environment
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).__TAURI__ ||
      (window as any).__TAURI_INTERNALS__ ||
      (window as any).__TAURI_METADATA__
  );
}

/**
 * Checks whether the customer display window is currently open (browser popup mode)
 */
export function isCustomerDisplayWindowOpen(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(customerDisplayPopupRef && !customerDisplayPopupRef.closed);
}

/**
 * Checks whether the customer display window is currently open in either Tauri or Browser
 */
export async function isCustomerDisplayWindowOpenAsync(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (isTauriEnvironment()) {
    try {
      const WebviewWindow = await resolveTauriWebviewWindow();
      if (WebviewWindow?.getByLabel) {
        const win = await WebviewWindow.getByLabel("customer-display");
        return Boolean(win);
      }
      return Boolean(customerDisplayTauriWinRef);
    } catch {
      return false;
    }
  }

  return isCustomerDisplayWindowOpen();
}

/**
 * Closes the Customer Display window in Tauri or Browser popup mode
 */
export async function closeCustomerDisplayWindow(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (isTauriEnvironment()) {
    try {
      const WebviewWindow = await resolveTauriWebviewWindow();
      const win =
        (WebviewWindow?.getByLabel
          ? await WebviewWindow.getByLabel("customer-display")
          : null) || customerDisplayTauriWinRef;

      if (win) {
        if (typeof win.destroy === "function") {
          await win.destroy().catch(async () => {
            if (typeof win.close === "function") await win.close();
          });
        } else if (typeof win.close === "function") {
          await win.close();
        }
      }
    } catch (err) {
      console.warn("[TauriWindow] Error closing customer display window:", err);
    }
    customerDisplayTauriWinRef = null;
    notifyCustomerDisplayClosed();
    return true;
  }

  if (customerDisplayPopupRef && !customerDisplayPopupRef.closed) {
    customerDisplayPopupRef.close();
    customerDisplayPopupRef = null;
  }
  notifyCustomerDisplayClosed();
  return true;
}

/**
 * Opens or focuses the Customer Display window.
 * - In Tauri: detects monitors, positions on Monitor #2 if present, fullscreen with decorations disabled.
 * - In Web Browser: opens popup window (1024x768) for side-by-side developer preview.
 */
export async function openCustomerDisplayWindow(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const targetUrl = "/customer-display";

  // 1. Tauri Desktop Window Execution
  if (isTauriEnvironment()) {
    try {
      const tauri = (window as any).__TAURI__;
      const webviewModule = tauri?.webviewWindow || tauri?.window;
      const WebviewWindow = await resolveTauriWebviewWindow();

      if (WebviewWindow) {
        // Check if window already exists
        let existingWin = null;
        if (typeof WebviewWindow.getByLabel === "function") {
          existingWin = await WebviewWindow.getByLabel("customer-display");
        }

        if (existingWin) {
          customerDisplayTauriWinRef = existingWin;
          if (typeof existingWin.show === "function") await existingWin.show();
          if (typeof existingWin.setFullscreen === "function") {
            await existingWin.setFullscreen(true).catch(() => {});
          }
          if (typeof existingWin.setFocus === "function") await existingWin.setFocus();
          return true;
        }

        // Enumerate monitors on Windows
        let monitors: any[] = [];
        if (typeof webviewModule.availableMonitors === "function") {
          monitors = await webviewModule.availableMonitors();
        } else if (typeof tauri?.window?.availableMonitors === "function") {
          monitors = await tauri.window.availableMonitors();
        }

        // Secondary monitor detected (> 1 display)
        if (monitors && monitors.length > 1) {
          const secondary = monitors[1];
          const posX = secondary?.position?.x ?? 1920;
          const posY = secondary?.position?.y ?? 0;
          const width = secondary?.size?.width ?? 1280;
          const height = secondary?.size?.height ?? 800;

          const newWin = new WebviewWindow("customer-display", {
            url: targetUrl,
            title: "Lao Minimart - Customer Display (ຈໍລູກຄ້າ)",
            x: posX,
            y: posY,
            width,
            height,
            fullscreen: true,
            decorations: false,
            resizable: true,
            alwaysOnTop: false,
            skipTaskbar: false,
          });

          customerDisplayTauriWinRef = newWin;
          newWin.once("tauri://created", async () => {
            try {
              if (typeof newWin.setFullscreen === "function") {
                await newWin.setFullscreen(true);
              }
            } catch {}
          });
          newWin.once("tauri://error", (err: any) => {
            console.warn("[TauriWindow] Secondary screen webview error:", err);
          });
          newWin.once("tauri://close-requested", () => {
            customerDisplayTauriWinRef = null;
            notifyCustomerDisplayClosed();
          });
          newWin.once("tauri://destroyed", () => {
            customerDisplayTauriWinRef = null;
            notifyCustomerDisplayClosed();
          });

          return true;
        } else {
          // Single monitor in Tauri: open directly in fullscreen
          const newWin = new WebviewWindow("customer-display", {
            url: targetUrl,
            title: "Lao Minimart - Customer Display (ຈໍລູກຄ້າ)",
            width: 1280,
            height: 800,
            fullscreen: true,
            decorations: false,
            resizable: true,
            center: true,
            alwaysOnTop: false,
          });

          customerDisplayTauriWinRef = newWin;
          newWin.once("tauri://created", async () => {
            try {
              if (typeof newWin.setFullscreen === "function") {
                await newWin.setFullscreen(true);
              }
            } catch {}
          });
          newWin.once("tauri://close-requested", () => {
            customerDisplayTauriWinRef = null;
            notifyCustomerDisplayClosed();
          });
          newWin.once("tauri://destroyed", () => {
            customerDisplayTauriWinRef = null;
            notifyCustomerDisplayClosed();
          });

          return true;
        }
      }
    } catch (tauriErr) {
      console.warn("[TauriWindow] Tauri window initialization error:", tauriErr);
    }
  }

  // 2. Web Browser Fallback (Popup window)
  try {
    if (customerDisplayPopupRef && !customerDisplayPopupRef.closed) {
      customerDisplayPopupRef.focus();
      return true;
    }

    const popupWidth = window.screen?.availWidth || 1280;
    const popupHeight = window.screen?.availHeight || 800;
    const left = (window.screen as any)?.availLeft ?? 0;
    const top = (window.screen as any)?.availTop ?? 0;

    customerDisplayPopupRef = window.open(
      targetUrl,
      "LaoCustomerDisplayWindow",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`
    );

    if (customerDisplayPopupRef) {
      customerDisplayPopupRef.focus();
      return true;
    }
  } catch (browserErr) {
    console.warn("[TauriWindow] Browser popup blocked or failed:", browserErr);
  }

  return false;
}
