// ============================================================================
// Tauri Window Automation & Fallback Popup for Dual-Screen POS
// Manages Customer Display Window (/customer-display) on Windows Multi-Monitor
// ============================================================================

let customerDisplayPopupRef: Window | null = null;

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
      // Handle both Tauri v2 (@tauri-apps/api/webviewWindow) and Tauri v1 (@tauri-apps/api/window)
      const webviewModule = tauri?.webviewWindow || tauri?.window;

      if (webviewModule && webviewModule.WebviewWindow) {
        const WebviewWindow = webviewModule.WebviewWindow;

        // Check if window already exists
        let existingWin = null;
        if (typeof WebviewWindow.getByLabel === "function") {
          existingWin = await WebviewWindow.getByLabel("customer-display");
        }

        if (existingWin) {
          if (typeof existingWin.show === "function") await existingWin.show();
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
            width: Math.min(width, 1280),
            height: Math.min(height, 800),
            fullscreen: false,
            decorations: true,
            resizable: true,
            alwaysOnTop: false,
            skipTaskbar: false,
          });

          newWin.once("tauri://error", (err: any) => {
            console.warn("[TauriWindow] Secondary screen webview error:", err);
          });

          return true;
        } else {
          // Single monitor in Tauri (Windowed mode with OS titlebar for dragging)
          const newWin = new WebviewWindow("customer-display", {
            url: targetUrl,
            title: "Lao Minimart - Customer Display (ຈໍລູກຄ້າ)",
            width: 1200,
            height: 800,
            fullscreen: false,
            decorations: true,
            resizable: true,
            center: true,
            alwaysOnTop: false,
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

    const popupWidth = 1024;
    const popupHeight = 768;
    // Calculate position: right side of the screen if available
    const left =
      window.screen && window.screen.availWidth > 1200
        ? Math.max(0, window.screen.availWidth - popupWidth - 40)
        : 100;
    const top = 60;

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
