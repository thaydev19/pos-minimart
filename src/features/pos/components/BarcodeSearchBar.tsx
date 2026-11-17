"use client";

// ============================================================================
// Barcode Search & Fast Scanner Bar: Compact h-9 (36px) Density
// ============================================================================

import React, { useRef } from "react";
import { ScanBarcode, Search, X } from "lucide-react";
import { lo } from "@/constants/locales/lo";
import {
  normalizeBarcodeInput,
  getHardwareBarcodeChar,
} from "@/utils/normalizeBarcodeInput";

interface BarcodeSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function BarcodeSearchBar({
  value,
  onChange,
  onSubmit,
  inputRef,
}: BarcodeSearchBarProps) {
  const lastKeyTimeRef = useRef<number>(0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentTime = performance.now();
    const timeDiff = currentTime - lastKeyTimeRef.current;
    lastKeyTimeRef.current = currentTime;

    // Intercept hardware scanner fast burst (< 55ms) to prevent OS keyboard language corruption
    if (timeDiff < 55 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const char = getHardwareBarcodeChar(e.nativeEvent);
      if (char !== null) {
        e.preventDefault();
        const input = e.currentTarget;
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const nextVal = input.value.slice(0, start) + char + input.value.slice(end);
        onChange(nextVal);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Auto-normalize if string starts with shifted barcode artifacts or layout traps
    if (/^(\*{2}|[%$^*)(!]{3,}|[๕๔๓ู]{3,}|[678໌ຼ]{4,})/.test(raw)) {
      onChange(normalizeBarcodeInput(raw));
    } else {
      onChange(raw);
    }
  };

  return (
    <form onSubmit={onSubmit} className="relative w-full select-none">
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
          <ScanBarcode className="h-4 w-4 text-emerald-600" />
        </div>

        <input
          ref={inputRef}
          type="text"
          data-scanner-input="true"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={lo.pos.scanOrSearchPlaceholder}
          className="h-9 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-24 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}

          <div className="flex items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] font-bold text-slate-600">
            <span>F1</span>
          </div>

          <button
            type="submit"
            className="flex h-7 items-center justify-center rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Search className="h-3 w-3 mr-1" />
            <span>ຄົ້ນຫາ</span>
          </button>
        </div>
      </div>
    </form>
  );
}
