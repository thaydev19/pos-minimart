"use client";

// ============================================================================
// TouchNumpad: High-Density On-Screen Keypad for POS Cash & Quantity Entry
// Large Touch Targets (>= 56px), Tactile Haptics, Standard Lao Kip Denominations
// Prevents Android virtual keyboard from obstructing the POS screen
// ============================================================================

import React from "react";
import { Delete, RotateCcw, Check, Sparkles } from "lucide-react";
import { formatLak } from "@/utils/formatLakCurrency";
import { triggerHapticFeedback } from "@/utils/haptics";

interface TouchNumpadProps {
  value: number;
  onChange: (newValue: number) => void;
  exactAmount?: number;
  onEnter?: () => void;
  showDenominations?: boolean;
}

function getFastDenominations(exactAmount?: number): number[] {
  if (!exactAmount || exactAmount <= 0) {
    return [10000, 20000, 50000, 100000, 200000, 500000];
  }

  const suggestions = new Set<number>();
  const rounded = Math.round(exactAmount);

  // 1. Next nearest 10,000 ₭ (e.g. 53.000 ₭ -> 60.000 ₭)
  if (rounded % 10000 !== 0) {
    const next10k = Math.ceil(rounded / 10000) * 10000;
    if (next10k > rounded) suggestions.add(next10k);
  }

  // 2. Next nearest 20,000 ₭
  if (rounded % 20000 !== 0) {
    const next20k = Math.ceil(rounded / 20000) * 20000;
    if (next20k > rounded) suggestions.add(next20k);
  }

  // 3. Next nearest 50,000 ₭
  if (rounded % 50000 !== 0) {
    const next50k = Math.ceil(rounded / 50000) * 50000;
    if (next50k > rounded) suggestions.add(next50k);
  }

  // 4. Standard physical banknotes strictly greater than total
  const standardBanknotes = [10000, 20000, 50000, 100000, 200000, 500000];
  for (const note of standardBanknotes) {
    if (note > rounded) {
      suggestions.add(note);
    }
  }

  // Large bill handling
  if (rounded >= 500000) {
    suggestions.add(Math.ceil(rounded / 500000) * 500000);
    suggestions.add(Math.ceil(rounded / 1000000) * 1000000);
  }

  return Array.from(suggestions)
    .filter((amt) => amt > rounded)
    .sort((a, b) => a - b)
    .slice(0, 5);
}

export function TouchNumpad({
  value,
  onChange,
  exactAmount,
  onEnter,
  showDenominations = true,
}: TouchNumpadProps) {
  const handleDigit = (digit: string) => {
    triggerHapticFeedback(20);
    const currentStr = value === 0 ? "" : value.toString();

    if (digit === "000") {
      if (!currentStr || currentStr === "0") return;
      const nextVal = parseInt(currentStr + "000", 10);
      onChange(isNaN(nextVal) ? 0 : nextVal);
      return;
    }

    const nextVal = parseInt(currentStr + digit, 10);
    onChange(isNaN(nextVal) ? 0 : nextVal);
  };

  const handleBackspace = () => {
    triggerHapticFeedback(25);
    const currentStr = value.toString();
    if (currentStr.length <= 1) {
      onChange(0);
    } else {
      const nextVal = parseInt(currentStr.slice(0, -1), 10);
      onChange(isNaN(nextVal) ? 0 : nextVal);
    }
  };

  const handleClear = () => {
    triggerHapticFeedback(35);
    onChange(0);
  };

  const handleSetAmount = (amount: number) => {
    triggerHapticFeedback(30);
    onChange(amount);
  };

  const fastDenominations = getFastDenominations(exactAmount);

  return (
    <div className="flex flex-col gap-2.5 select-none touch-manipulation">
      {/* 1. Quick Lao Kip Banknote Chips (Only >= payable amount) */}
      {showDenominations && (
        <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
          {exactAmount !== undefined && exactAmount > 0 && (
            <button
              type="button"
              onClick={() => handleSetAmount(exactAmount)}
              className={`flex-1 min-w-[110px] h-12 flex items-center justify-center gap-1.5 rounded-xl px-3 font-black text-xs transition-all active:scale-95 cursor-pointer border ${
                value === exactAmount
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                  : "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <Check className="h-4 w-4" />
              <span>ພໍດີ ({formatLak(exactAmount)})</span>
            </button>
          )}

          {fastDenominations.map((denom) => (
            <button
              key={denom}
              type="button"
              onClick={() => handleSetAmount(denom)}
              className={`h-12 min-w-[70px] flex-1 flex items-center justify-center rounded-xl font-extrabold text-xs transition-all active:scale-95 cursor-pointer border ${
                value === denom
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {formatLak(denom)}
            </button>
          ))}
        </div>
      )}

      {/* 2. Main 3x4 Touch Grid (Buttons min 56px height) */}
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-14 sm:h-16 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-xl sm:text-2xl font-black text-slate-900 shadow-xs hover:bg-slate-50 active:scale-95 active:bg-emerald-50 active:border-emerald-500 transition-all cursor-pointer font-mono"
          >
            {digit}
          </button>
        ))}

        {/* Bottom Row: Clear, 0, 000, Backspace */}
        <button
          type="button"
          onClick={handleClear}
          className="h-14 sm:h-16 flex items-center justify-center gap-1 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-sm active:scale-95 hover:bg-rose-100 transition-all cursor-pointer"
          title="ລຶບທັງໝົດ (Clear)"
        >
          <RotateCcw className="h-5 w-5" />
          <span className="text-xs">ລ້າງ</span>
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="h-14 sm:h-16 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-xl sm:text-2xl font-black text-slate-900 shadow-xs hover:bg-slate-50 active:scale-95 active:bg-emerald-50 active:border-emerald-500 transition-all cursor-pointer font-mono"
        >
          0
        </button>

        <button
          type="button"
          onClick={() => handleDigit("000")}
          className="h-14 sm:h-16 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-base sm:text-lg font-black text-slate-800 shadow-xs hover:bg-slate-100 active:scale-95 active:bg-emerald-50 active:border-emerald-500 transition-all cursor-pointer font-mono"
        >
          000
        </button>
      </div>

      {/* 3. Action bar: Backspace & Enter (if provided) */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleBackspace}
          className="h-12 flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm active:scale-95 hover:bg-slate-200 transition-all cursor-pointer"
        >
          <Delete className="h-5 w-5 text-slate-500" />
          <span>ລຶບ (Backspace)</span>
        </button>

        {onEnter && (
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(40);
              onEnter();
            }}
            className="h-12 flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-extrabold text-sm shadow-md active:scale-95 hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <Check className="h-5 w-5" />
            <span>ຕົກລົງ (OK)</span>
          </button>
        )}
      </div>
    </div>
  );
}
