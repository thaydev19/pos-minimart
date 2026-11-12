"use client";

// ============================================================================
// KipCurrencyInput: Standard Lao Kip (LAK) Currency Input Component
// Real-time dot (.) thousand separator formatting, pure integer number output,
// 'k' shortcut (*1,000), mobile numeric keyboard, right-aligned '₭' suffix.
// ============================================================================

import React, { forwardRef, useState } from "react";
import { cn } from "cn";

export interface KipCurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  /**
   * Numeric value in Lao Kip (always integer)
   */
  value: number;

  /**
   * Primary callback when the numeric value changes
   */
  onValueChange?: (val: number) => void;

  /**
   * Backward-compatible alias for onValueChange
   */
  onChange?: (val: number) => void;

  /**
   * Currency suffix displayed inside the input (default: '₭')
   */
  suffix?: string;

  /**
   * Whether to show the currency suffix
   */
  showSuffix?: boolean;

  /**
   * Additional class name for outer wrapper
   */
  containerClassName?: string;
}

/**
 * Formats integer to Lao Kip string with dot (.) thousand separators
 * e.g. 15000 -> "15.000"
 */
function formatKipDots(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return "0";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export const KipCurrencyInput = forwardRef<
  HTMLInputElement,
  KipCurrencyInputProps
>(
  (
    {
      value,
      onValueChange,
      onChange,
      suffix = "₭",
      showSuffix = true,
      containerClassName = "",
      className = "",
      placeholder = "0",
      disabled = false,
      onKeyDown,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const safeValue =
      typeof value === "number" && !isNaN(value)
        ? Math.max(0, Math.round(value))
        : 0;

    // Notify parent with pure integer number
    const triggerChange = (newVal: number) => {
      const sanitized = Math.max(0, Math.round(newVal));
      if (onValueChange) {
        onValueChange(sanitized);
      }
      if (onChange) {
        onChange(sanitized);
      }
    };

    // Calculate display text: show '0' when unfocused and 0, empty with placeholder '0' when focused
    const displayValue =
      safeValue === 0 ? (isFocused ? "" : "0") : formatKipDots(safeValue);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawText = e.target.value;

      // 1. Shortcut: If user types 'k' or 'K' (e.g. "15k" -> 15.000)
      if (rawText.toLowerCase().includes("k")) {
        const digits = rawText.replace(/\D/g, "");
        const base = digits ? parseInt(digits, 10) : 0;
        triggerChange(base * 1000);
        return;
      }

      // 2. Extract digits only
      const digits = rawText.replace(/\D/g, "");
      if (!digits) {
        triggerChange(0);
        return;
      }

      // 3. Strip leading zeros to avoid "05" -> "5"
      const cleanDigits = digits.replace(/^0+(?=\d)/, "");
      const parsed = parseInt(cleanDigits, 10) || 0;
      triggerChange(parsed);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // 1. Shortcut 'k' or 'K' -> multiply current value by 1,000
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        if (safeValue > 0) {
          triggerChange(safeValue * 1000);
        }
        return;
      }

      onKeyDown?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (safeValue === 0) {
        e.target.select();
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div
        className={cn(
          "relative flex items-center w-full group",
          containerClassName
        )}
      >
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition-all tabular-nums",
            "focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20",
            "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
            showSuffix && "pr-8",
            className
          )}
          {...props}
        />
        {showSuffix && (
          <span className="pointer-events-none absolute right-3 select-none text-xs font-bold text-zinc-400 group-focus-within:text-emerald-600 transition-colors">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);

KipCurrencyInput.displayName = "KipCurrencyInput";
export default KipCurrencyInput;

