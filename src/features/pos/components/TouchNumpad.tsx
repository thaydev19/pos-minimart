"use client";

// ============================================================================
// TouchNumpad: Ergonomic 4-Column Retail POS Keypad (Square / Stripe Style)
// Digits on Left (3 cols), Action Keys (Backspace, Clear, Exact) on Right
// ============================================================================

import React from "react";
import { Delete, RotateCcw, Check } from "lucide-react";
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
    return [10000, 20000, 50000, 100000];
  }

  const suggestions = new Set<number>();
  const rounded = Math.round(exactAmount);

  if (rounded % 10000 !== 0) {
    const next10k = Math.ceil(rounded / 10000) * 10000;
    if (next10k > rounded) suggestions.add(next10k);
  }
  if (rounded % 20000 !== 0) {
    const next20k = Math.ceil(rounded / 20000) * 20000;
    if (next20k > rounded) suggestions.add(next20k);
  }
  if (rounded % 50000 !== 0) {
    const next50k = Math.ceil(rounded / 50000) * 50000;
    if (next50k > rounded) suggestions.add(next50k);
  }

  const standardBanknotes = [10000, 20000, 50000, 100000, 200000, 500000];
  for (const note of standardBanknotes) {
    if (note > rounded) suggestions.add(note);
  }

  if (rounded >= 500000) {
    suggestions.add(Math.ceil(rounded / 500000) * 500000);
    suggestions.add(Math.ceil(rounded / 1000000) * 1000000);
  }

  return Array.from(suggestions)
    .filter((amt) => amt > rounded)
    .sort((a, b) => a - b)
    .slice(0, 4);
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

    if (/^0+$/.test(digit) && (!currentStr || currentStr === "0")) {
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
  const digitKeyClass =
    "h-9 sm:h-11 lg:h-14 flex items-center justify-center rounded-xl bg-white border border-slate-300 text-base sm:text-lg lg:text-xl font-bold text-slate-900 shadow-xs hover:bg-slate-50 active:scale-95 active:bg-emerald-50 active:border-emerald-500 transition-all cursor-pointer font-mono";

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 select-none touch-manipulation">
      {/* 1. Single-Row Quick Banknote Suggestions */}
      {showDenominations && fastDenominations.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {fastDenominations.map((denom) => (
            <button
              key={denom}
              type="button"
              onClick={() => handleSetAmount(denom)}
              className={`h-8 sm:h-9 lg:h-10 flex items-center justify-center rounded-xl px-1.5 sm:px-2 font-bold text-[11px] sm:text-xs whitespace-nowrap transition-all active:scale-95 cursor-pointer border ${
                value === denom
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-slate-50 text-slate-800 border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-800"
              }`}
            >
              {formatLak(denom)}
            </button>
          ))}
        </div>
      )}

      {/* 2. Ergonomic 4-Column POS Keypad */}
      <div className="grid grid-cols-4 gap-1.5 lg:gap-2">
        {/* Row 1 */}
        {["1", "2", "3"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className={digitKeyClass}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleBackspace}
          className="h-9 sm:h-11 lg:h-14 flex items-center justify-center gap-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs active:scale-95 hover:bg-slate-200 transition-all cursor-pointer"
          title="ລຶບ 1 ໂຕເລກ (Backspace)"
        >
          <Delete className="h-4 sm:h-5 w-4 sm:w-5 text-slate-700" />
        </button>

        {/* Row 2 */}
        {["4", "5", "6"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className={digitKeyClass}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="h-9 sm:h-11 lg:h-14 flex flex-col items-center justify-center gap-0.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 font-bold text-[10px] sm:text-[11px] active:scale-95 hover:bg-rose-100 transition-all cursor-pointer"
          title="ລ້າງທັງໝົດ (Clear)"
        >
          <RotateCcw className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          <span>ລ້າງ</span>
        </button>

        {/* Row 3 */}
        {["7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className={digitKeyClass}
          >
            {digit}
          </button>
        ))}

        {/* Exact Amount Key (Spans 2 rows on right) */}
        {exactAmount !== undefined && exactAmount > 0 ? (
          <button
            type="button"
            onClick={() => handleSetAmount(exactAmount)}
            className={`row-span-2 flex flex-col items-center justify-center gap-1 rounded-xl border font-bold text-xs transition-all active:scale-95 cursor-pointer px-1 text-center ${
              value === exactAmount
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
            }`}
          >
            <Check className="h-5 w-5 shrink-0" />
            <span>ພໍດີ</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(30);
              onEnter?.();
            }}
            className="row-span-2 flex flex-col items-center justify-center gap-1 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm active:scale-95 hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <Check className="h-5 w-5" />
            <span>OK</span>
          </button>
        )}

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => handleDigit("0")}
          className={digitKeyClass}
        >
          0
        </button>
        {["00", "000"].map((zeros) => (
          <button
            key={zeros}
            type="button"
            onClick={() => handleDigit(zeros)}
            className="h-9 sm:h-11 lg:h-14 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-300 text-sm sm:text-base font-extrabold text-slate-800 shadow-xs hover:bg-slate-200 active:scale-95 active:bg-emerald-50 active:border-emerald-500 transition-all cursor-pointer font-mono"
          >
            {zeros}
          </button>
        ))}
      </div>
    </div>
  );
}
