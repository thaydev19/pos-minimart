"use client";

// ============================================================================
// CatalogBarcodeSearchInput: Barcode-Safe Search Input with Global Auto-Focus
// - Decodes hardware scanner Digit/Numpad keys via KeyboardEvent.code (immune
//   to Shift/CapsLock/Vietnamese/Lao/Thai layout traps like "**%$^(*))%)%)")
// - Normalizes shifted/IME artifacts on change/paste
// - Listens globally when unfocused and no modal is open, auto-focusing and
//   filtering the catalog immediately on scan
// ============================================================================

import React, { useEffect, useRef } from "react";
import { ScanBarcode, X } from "lucide-react";
import {
  normalizeBarcodeInput,
  getHardwareBarcodeChar,
} from "@/utils/normalizeBarcodeInput";

interface CatalogBarcodeSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  globalEnabled?: boolean;
}

const ARTIFACT_REGEX =
  /[!@#$%^&*()_+~`|\\/[\]{}<>]|[\u0E39\u0E3F\u0E55\u0E54\u0E53\u0E56\u0E57]|[\u0ECC\u0EBC]/;

export function CatalogBarcodeSearchInput({
  value,
  onChange,
  placeholder = "ຄົ້ນຫາຊື່ສິນຄ້າ, ບາໂຄດ...",
  className = "",
  globalEnabled = true,
}: CatalogBarcodeSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const latestValueRef = useRef<string>(value);
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Keep latestValueRef synced with controlled prop
  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  // Global hardware scanner listener when input is NOT focused
  useEffect(() => {
    if (!globalEnabled) {
      bufferRef.current = "";
      return;
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;

      // Do not intercept when user is inside a modal/dialog
      const isInsideModal = Boolean(
        activeEl?.closest('[role="dialog"]') || activeEl?.closest(".modal-container")
      );
      if (isInsideModal) return;

      // If this search input is already focused, let its own handlers process it
      if (activeEl === inputRef.current) return;

      const isOtherInput = Boolean(
        activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "TEXTAREA" ||
            activeEl.tagName === "SELECT" ||
            activeEl.isContentEditable)
      );

      const now = performance.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter") {
        if (bufferRef.current.length >= 2) {
          e.preventDefault();
          e.stopPropagation();
          const clean = normalizeBarcodeInput(bufferRef.current);
          bufferRef.current = "";
          if (clean) {
            latestValueRef.current = clean;
            onChange(clean);
            inputRef.current?.focus();
            setTimeout(() => inputRef.current?.select(), 0);
          }
          return;
        }
        bufferRef.current = "";
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const char = getHardwareBarcodeChar(e);
      if (char === null) return;

      if (timeDiff < 55) {
        bufferRef.current += char;
      } else if (!isOtherInput) {
        bufferRef.current = char;
      }

      if (timeDiff > 100 && bufferRef.current.length > 1) {
        bufferRef.current = "";
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
    };
  }, [globalEnabled, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter") {
      e.preventDefault();
      const current = latestValueRef.current;
      const clean = ARTIFACT_REGEX.test(current)
        ? normalizeBarcodeInput(current)
        : current.trim();
      if (clean !== current) {
        latestValueRef.current = clean;
        onChange(clean);
      }
      e.currentTarget.select();
      return;
    }

    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Decode physical Digit/Numpad keys directly so Shift/IME never turns "8" into "*"
    if (e.code.startsWith("Digit") || e.code.startsWith("Numpad")) {
      const char = getHardwareBarcodeChar(e.nativeEvent);
      if (char !== null) {
        e.preventDefault();
        const input = e.currentTarget;
        const prev = latestValueRef.current;
        let nextVal: string;
        if (prev === input.value) {
          const start = input.selectionStart ?? prev.length;
          const end = input.selectionEnd ?? prev.length;
          nextVal = prev.slice(0, start) + char + prev.slice(end);
        } else {
          // Rapid scanner burst before React flushed previous keystroke
          nextVal = prev + char;
        }
        latestValueRef.current = nextVal;
        onChange(nextVal);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const next = ARTIFACT_REGEX.test(raw) ? normalizeBarcodeInput(raw) : raw;
    latestValueRef.current = next;
    onChange(next);
  };

  return (
    <div className={`relative flex-1 max-w-md ${className}`}>
      <ScanBarcode className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
      <input
        ref={inputRef}
        type="text"
        data-scanner-input="true"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-8 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            latestValueRef.current = "";
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
