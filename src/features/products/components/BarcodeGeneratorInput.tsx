"use client";

// ============================================================================
// BarcodeGeneratorInput: Input with Auto-Generate Barcode & PLU Scale Support
// ============================================================================

import React from "react";
import { ScanBarcode, Sparkles, Scale, X } from "lucide-react";
import { generateInternalBarcode } from "../utils/product.util";
import {
  normalizeBarcodeInput,
  getHardwareBarcodeChar,
} from "@/utils/normalizeBarcodeInput";

interface BarcodeGeneratorInputProps {
  value: string;
  onChange: (value: string) => void;
  isWeighing?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function BarcodeGeneratorInput({
  value,
  onChange,
  isWeighing = false,
  disabled = false,
  error,
  placeholder = "ຍິງບາໂຄດ ຫຼື ສ້າງອັດຕະໂນມັດ...",
  label = "ບາໂຄດສິນຄ້າ (Barcode)",
  required = true,
}: BarcodeGeneratorInputProps) {
  const handleGenerate = () => {
    const code = generateInternalBarcode(isWeighing);
    onChange(code);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
          {isWeighing && (
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 ml-1">
              <Scale className="h-2.5 w-2.5" />
              <span>PLU ຕາຊັ່ງ</span>
            </span>
          )}
        </label>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 active:scale-95 transition-all cursor-pointer"
          title="ສ້າງບາໂຄດພາຍໃນອັດຕະໂນມັດ"
        >
          <Sparkles className="h-3 w-3" />
          <span>ສ້າງບາໂຄດອັດຕະໂນມັດ</span>
        </button>
      </div>

      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
          <ScanBarcode className="h-4 w-4" />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(normalizeBarcodeInput(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter") {
              e.preventDefault();
              onChange(normalizeBarcodeInput(value));
              return;
            }
            if (!e.ctrlKey && !e.altKey && !e.metaKey) {
              const char = getHardwareBarcodeChar(e.nativeEvent);
              if (char !== null) {
                e.preventDefault();
                const input = e.currentTarget;
                const start = input.selectionStart ?? input.value.length;
                const end = input.selectionEnd ?? input.value.length;
                const nextVal = normalizeBarcodeInput(
                  input.value.slice(0, start) + char + input.value.slice(end)
                );
                onChange(nextVal);
              }
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`h-9 w-full rounded-xl border bg-white pl-9 pr-8 text-xs font-mono font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-2 ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
              : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-600/10"
          }`}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-500">{error}</p>
      ) : (
        <p className="text-[10px] text-slate-400">
          {isWeighing
            ? "ສິນຄ້າຊັ່ງນ້ຳໜັກຈະໃຊ້ເລກນຳໜ້າ '20' ສຳລັບຕາຊັ່ງເຄື່ອງພິມສະຕິກເກີ"
            : "ສາມາດຍິງບາໂຄດຈາກເຄື່ອງສະແກນ ຫຼື ກົດປຸ່ມສ້າງບາໂຄດ (EAN-13) ໄດ້ເລີຍ"}
        </p>
      )}
    </div>
  );
}

