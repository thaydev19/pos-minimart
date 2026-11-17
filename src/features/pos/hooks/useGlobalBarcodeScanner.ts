"use client";

// ============================================================================
// Global Hardware Barcode Scanner Hook for Retail POS Terminal (Laos)
// Detects high-speed barcode gun bursts (< 35ms/char + Enter)
// Web Audio API feedback (Success Beep & Error Buzz)
// ============================================================================

import { useEffect, useRef } from "react";
import {
  normalizeBarcodeInput,
  parseBarcodeMultiplier,
  getHardwareBarcodeChar,
} from "@/utils/normalizeBarcodeInput";
import { parseEan13ScaleBarcode } from "@/utils/ean13Parser";
import { usePosStore } from "../stores/pos.store";

/**
 * Native Web Audio synthesizer for instant POS hardware sound feedback
 * Works 100% offline without external audio files
 */
class PosAudioBeep {
  private static ctx: AudioContext | null = null;

  private static getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Crisp, high-frequency pleasant beep (1200Hz, ~85ms)
   */
  static playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.085);
    } catch {}
  }

  /**
   * Low-frequency double warning buzz (220Hz saw, ~180ms)
   */
  static playError() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }
}

interface UseGlobalBarcodeScannerProps {
  onScanSuccess?: (productName: string, qty: number) => void;
  onScanError?: (barcode: string) => void;
  enabled?: boolean;
}

export function useGlobalBarcodeScanner({
  onScanSuccess,
  onScanError,
  enabled = true,
}: UseGlobalBarcodeScannerProps = {}) {
  const addToCart = usePosStore((s) => s.addToCart);

  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  const processScannedBarcode = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed || trimmed.length < 2) return;

    // 1. Multiplier syntax support: e.g. "6*8850029100018"
    const { quantity, barcode: cleanedBarcode } = parseBarcodeMultiplier(trimmed);
    const normalizedBarcode = normalizeBarcodeInput(cleanedBarcode);

    const currentProducts = usePosStore.getState().products;

    // 2. Fresh / Weighing scale EAN-13 barcode: Prefix 20-29
    const scaleInfo = parseEan13ScaleBarcode(normalizedBarcode);
    if (scaleInfo.isScaleBarcode) {
      const matchedScaleProd = currentProducts.find(
        (p) => p.is_weighing && (p.barcode === scaleInfo.itemPlu || p.barcode.endsWith(scaleInfo.itemPlu))
      );

      if (matchedScaleProd) {
        if (scaleInfo.weightKg) {
          addToCart(matchedScaleProd, undefined, scaleInfo.weightKg);
        } else if (scaleInfo.priceLak) {
          const calculatedQty = scaleInfo.priceLak / matchedScaleProd.selling_price;
          addToCart(matchedScaleProd, undefined, parseFloat(calculatedQty.toFixed(3)), scaleInfo.priceLak);
        }
        PosAudioBeep.playSuccess();
        onScanSuccess?.(matchedScaleProd.name_lo, scaleInfo.weightKg || 1);
        return;
      }
    }

    // 3. Regular barcode lookup in Catalog (primary barcode or secondary packaging unit barcodes)
    const matchedProduct = currentProducts.find((p) => {
      if (p.barcode === normalizedBarcode) return true;
      return p.units && p.units.some((u) => u.barcode === normalizedBarcode);
    });

    if (matchedProduct) {
      const matchedUnit = matchedProduct.units?.find((u) => u.barcode === normalizedBarcode);
      addToCart(matchedProduct, matchedUnit, quantity);
      PosAudioBeep.playSuccess();
      onScanSuccess?.(matchedProduct.name_lo, quantity);
    } else {
      // Barcode not found in inventory
      PosAudioBeep.playError();
      onScanError?.(normalizedBarcode);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;

      // Check if user is actively typing in a modal or non-POS input
      // If activeElement is an input inside a modal/dialog (role="dialog" or has [data-modal]), ignore
      const isInsideModal = Boolean(activeEl?.closest('[role="dialog"]') || activeEl?.closest(".modal-container"));
      if (isInsideModal) {
        // Cashier is interacting with a dialog (e.g. setting price, typing notes)
        return;
      }

      // If typing in another normal input that is NOT the main POS search, ignore
      const isOtherInput =
        activeEl &&
        (activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable ||
          (activeEl.tagName === "INPUT" && activeEl.getAttribute("data-scanner-input") !== "true"));

      const currentTime = performance.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Handle Enter (Hardware barcode gun end burst character)
      if (e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter") {
        if (bufferRef.current.length >= 2) {
          e.preventDefault();
          e.stopPropagation();
          const clean = normalizeBarcodeInput(bufferRef.current);
          processScannedBarcode(clean);
          bufferRef.current = "";
          return;
        }
        bufferRef.current = "";
        return;
      }

      // Ignore modifier combinations (Ctrl/Alt/Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      // Decode physical key position (immune to keyboard language, Shift or CapsLock)
      const char = getHardwareBarcodeChar(e);
      if (char === null) {
        return;
      }

      // Hardware Barcode Scanner burst detection: interval between keystrokes < 55ms (supports wireless 2.4G / Bluetooth)
      if (timeDiff < 55) {
        bufferRef.current += char;
      } else if (!isOtherInput) {
        // Start new scan burst if outside input fields
        bufferRef.current = char;
      }

      // Safety reset: if delay > 100ms and buffer has more than 1 char, it was slow human typing -> clear buffer
      if (timeDiff > 100 && bufferRef.current.length > 1) {
        bufferRef.current = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, addToCart]);

  return {
    processScannedBarcode,
    playSuccessSound: () => PosAudioBeep.playSuccess(),
    playErrorSound: () => PosAudioBeep.playError(),
  };
}

