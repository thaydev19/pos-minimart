"use client";

// ============================================================================
// Barcode Scanner Listener Hook - Handles Fast Hardware Scanners & Lao Trap
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { normalizeBarcodeInput, parseBarcodeMultiplier } from "@/utils/normalizeBarcodeInput";
import { parseEan13ScaleBarcode } from "@/utils/ean13Parser";
import { usePosStore } from "../stores/pos.store";

interface UseBarcodeScannerProps {
  onScanSuccess?: (productName: string) => void;
  onScanError?: (barcode: string) => void;
}

export function useBarcodeScanner({
  onScanSuccess,
  onScanError,
}: UseBarcodeScannerProps = {}) {
  const [searchInput, setSearchInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addToCart = usePosStore((s) => s.addToCart);

  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  const processBarcode = (rawInput: string) => {
    if (!rawInput || rawInput.trim().length === 0) return;

    // 1. Multiplier syntax: "5*8850029100018"
    const { quantity, barcode: cleanedBarcode } = parseBarcodeMultiplier(rawInput);
    const normalizedBarcode = normalizeBarcodeInput(cleanedBarcode);

    // Get current live catalog from Zustand store
    const currentProducts = usePosStore.getState().products;

    // 2. EAN-13 Scale Barcode: Prefix 20-29
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
        onScanSuccess?.(matchedScaleProd.name_lo);
        setSearchInput("");
        return;
      }
    }

    // 3. Standard Product Barcode lookup
    const matchedProduct = currentProducts.find((p) => {
      if (p.barcode === normalizedBarcode) return true;
      return p.units && p.units.some((u) => u.barcode === normalizedBarcode);
    });

    if (matchedProduct) {
      const matchedUnit = matchedProduct.units?.find((u) => u.barcode === normalizedBarcode);
      addToCart(matchedProduct, matchedUnit, quantity);
      onScanSuccess?.(matchedProduct.name_lo);
      setSearchInput("");
    } else {
      onScanError?.(normalizedBarcode);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Do not intercept if user is typing in standard inputs other than search
      const isInputActive =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Enter key marks end of barcode burst
      if (e.key === "Enter") {
        if (bufferRef.current.length >= 3) {
          e.preventDefault();
          processBarcode(bufferRef.current);
          bufferRef.current = "";
          return;
        }
        // If Enter pressed inside search input
        if (target === inputRef.current && searchInput.trim().length > 0) {
          e.preventDefault();
          processBarcode(searchInput);
          return;
        }
        bufferRef.current = "";
        return;
      }

      // Hardware barcode scanner keystrokes arrive with inter-keystroke timing < 50ms
      if (e.key.length === 1) {
        if (timeDiff < 50 || bufferRef.current.length > 0) {
          bufferRef.current += e.key;
        } else if (!isInputActive) {
          bufferRef.current = e.key;
        }
      }

      // Reset buffer if delay > 120ms (manual typing detected, not hardware scanner)
      if (timeDiff > 120 && bufferRef.current.length > 1) {
        bufferRef.current = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInput]);

  const handleManualSearch = (term: string) => {
    processBarcode(term);
  };

  const focusScanner = () => {
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  return {
    searchInput,
    setSearchInput,
    inputRef,
    handleManualSearch,
    focusScanner,
  };
}
