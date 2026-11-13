"use client";

// ============================================================================
// ProductUnitBuilder: Strict 2-Tier Minimart Packaging (Base Unit & 1 Pack Unit)
// 100% type="button" - Zero emoji - Lucide vector icons only
// Includes Pack Cost Price, Pack Selling Price, Realtime Sync with Base Cost
// ============================================================================

import React, { useState } from "react";
import {
  Package,
  Sparkles,
  Percent,
  ScanBarcode,
} from "lucide-react";
import { ProductUnitFormData } from "../types/product.types";
import { calculateUnitSavings } from "../utils/product.util";
import { formatLak } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";

interface ProductUnitBuilderProps {
  baseUnit: string;
  basePrice: number;
  baseCostPrice: number;
  baseBarcode: string;
  isWeighing?: boolean;
  units: ProductUnitFormData[];
  onChange: (updatedUnits: ProductUnitFormData[]) => void;
  onCostChange: (newBaseCost: number) => void;
  disabled?: boolean;
}

export function ProductUnitBuilder({
  baseUnit,
  basePrice,
  baseCostPrice,
  baseBarcode,
  isWeighing = false,
  units,
  onChange,
  onCostChange,
  disabled = false,
}: ProductUnitBuilderProps) {
  // Rule: Weighing items (per kg/100g) do NOT have wholesale packaging
  if (isWeighing) {
    return null;
  }

  // Find existing pack unit if any (non-base unit)
  const existingPackUnit = units.find((u) => !u.is_base_unit);

  // Switch state: ON if pack unit exists
  const [hasPackUnit, setHasPackUnit] = useState<boolean>(() => Boolean(existingPackUnit));

  // Sync internal state with props
  const packMultiplier = existingPackUnit?.conversion_rate || 6;
  const packSellingPrice =
    existingPackUnit?.selling_price !== undefined
      ? existingPackUnit.selling_price
      : basePrice > 0
      ? basePrice * packMultiplier
      : 0;
  const packBarcode = existingPackUnit?.barcode || "";

  // Pack Cost Price (computed from baseCostPrice * multiplier by default)
  const packCostPrice = baseCostPrice > 0 ? baseCostPrice * packMultiplier : 0;

  /**
   * Helper to notify parent with exactly [baseUnitRow, ...(hasPack ? [packRow] : [])]
   */
  const emitUnitsChange = (
    enabled: boolean,
    multiplier: number,
    price: number,
    barcode: string
  ) => {
    const currentBase = units.find((u) => u.is_base_unit) || {
      id: "base-unit-row",
      unit_name: baseUnit || "ອັນ",
      conversion_rate: 1,
      selling_price: basePrice || 0,
      barcode: baseBarcode || "",
      is_base_unit: true,
    };

    const updatedBase: ProductUnitFormData = {
      ...currentBase,
      unit_name: baseUnit || "ອັນ",
      selling_price: basePrice || 0,
      barcode: baseBarcode || "",
      is_base_unit: true,
    };

    if (!enabled) {
      onChange([updatedBase]);
      return;
    }

    const packRow: ProductUnitFormData = {
      id: existingPackUnit?.id || crypto.randomUUID(),
      unit_name: "ແພັກ",
      conversion_rate: Math.max(2, multiplier),
      selling_price: Math.max(0, price),
      barcode: barcode.trim(),
      is_base_unit: false,
    };

    onChange([updatedBase, packRow]);
  };

  /**
   * Toggle Switch: Enable or Disable Pack Unit
   */
  const handleToggleSwitch = (enabled: boolean) => {
    setHasPackUnit(enabled);
    if (!enabled) {
      emitUnitsChange(false, 6, 0, "");
    } else {
      const defaultMultiplier = 6;
      const defaultPrice = basePrice > 0 ? basePrice * defaultMultiplier : 0;
      const defaultBarcode = baseBarcode ? `${baseBarcode}-P${defaultMultiplier}` : "";
      emitUnitsChange(true, defaultMultiplier, defaultPrice, defaultBarcode);
    }
  };

  /**
   * Quick Preset Click (x6, x10, x12, x24)
   */
  const handleApplyPreset = (multiplier: number) => {
    const suggestedPrice = basePrice > 0 ? basePrice * multiplier : packSellingPrice;
    const barcodeSuffix = baseBarcode ? `${baseBarcode}-P${multiplier}` : packBarcode;
    emitUnitsChange(true, multiplier, suggestedPrice, barcodeSuffix);
  };

  /**
   * When Pack Cost is edited directly (e.g. 48,000 Kip for 12 bottles)
   * Automatically compute 1 unit cost: 48,000 / 12 = 4,000 Kip -> calls onCostChange
   */
  const handlePackCostChange = (newPackCost: number) => {
    if (packMultiplier > 0) {
      const unitCost = Math.round(newPackCost / packMultiplier);
      onCostChange(unitCost);
    }
  };

  /**
   * Auto-generate internal Pack Barcode
   */
  const handleGeneratePackBarcode = () => {
    const generated = baseBarcode
      ? `${baseBarcode}-P${packMultiplier}`
      : `PACK-${Date.now().toString().slice(-6)}`;
    emitUnitsChange(true, packMultiplier, packSellingPrice, generated);
  };

  const savingsPercent = calculateUnitSavings(
    basePrice,
    packSellingPrice,
    packMultiplier
  );

  return (
    <div className="space-y-2.5">
      {/* 1. Header with Single Switch */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Package className="h-4 w-4 text-emerald-600" />
            <span>2. ຕັ້ງຄ່າແພັກ / ຍົກລັອກ (Pack Settings)</span>
          </div>
          <p className="text-[10px] text-slate-500">
            ມີຂາຍເປັນແພັກ (ກຳນົດຂາຍຍົກຊຸດ/ລັອກ ພ້ອມລາຄາຊື້ ແລະ ລາຄາຂາຍ)
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={hasPackUnit}
            onChange={(e) => handleToggleSwitch(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* 2. Single Pack Configuration Box */}
      {hasPackUnit && (
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/20 p-3 space-y-2.5 animate-in fade-in duration-150">
          {/* Quick Preset Selector Buttons & Formula: 1 ແພັກ = [X] [ຕຸກ] */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-extrabold text-slate-800 border border-slate-200">
                1 ແພັກ
              </span>
              <span className="text-xs font-bold text-slate-400">=</span>
              <input
                type="number"
                min="2"
                value={packMultiplier === 0 ? "" : packMultiplier}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value, 10) || 0);
                  const suggestedPrice = basePrice > 0 ? basePrice * val : packSellingPrice;
                  emitUnitsChange(true, val, suggestedPrice, packBarcode);
                }}
                disabled={disabled}
                placeholder="6"
                className="h-7 w-14 rounded-lg border border-slate-200 bg-white px-1 text-center text-xs font-black text-emerald-800 outline-none focus:border-emerald-600 tabular-nums"
              />
              <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-100 whitespace-nowrap">
                {baseUnit || "ອັນ"}
              </span>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-1">
              {[6, 10, 12, 24].map((mult) => {
                const isActive = packMultiplier === mult;
                return (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => handleApplyPreset(mult)}
                    disabled={disabled}
                    className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-2xs scale-102"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300"
                    }`}
                  >
                    x{mult}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Row: [ຕົ້ນທຶນຊື້ 1 ແພັກ (₭)] and [ລາຄາຂາຍ 1 ແພັກ (₭) *] */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Pack Cost Price -> Automatically divides into base unit cost */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                ຕົ້ນທຶນຊື້ 1 ແພັກ (₭)
              </label>
              <KipCurrencyInput
                value={packCostPrice}
                onValueChange={handlePackCostChange}
                disabled={disabled}
                placeholder="0"
                className="h-8.5 text-xs font-bold text-slate-800 bg-white"
              />
              <p className="text-[9.5px] text-emerald-700 font-medium mt-0.5">
                = {formatLak(baseCostPrice)} / 1 {baseUnit || "ອັນ"} (ຫານ {packMultiplier} ອັດຕະໂນມັດ)
              </p>
            </div>

            {/* 2. Pack Selling Price */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                ລາຄາຂາຍ 1 ແພັກ (₭) <span className="text-rose-500">*</span>
              </label>
              <KipCurrencyInput
                required
                value={packSellingPrice}
                onValueChange={(val) => {
                  emitUnitsChange(true, packMultiplier, val, packBarcode);
                }}
                disabled={disabled}
                placeholder="0"
                className="h-8.5 text-xs font-extrabold border-emerald-500 text-emerald-950 bg-white focus:ring-2 focus:ring-emerald-500/20"
              />
              {savingsPercent > 0 && (
                <p className="text-[9.5px] text-emerald-700 font-bold mt-0.5 flex items-center gap-0.5">
                  <Percent className="h-2.5 w-2.5" />
                  <span>ປະຢັດກວ່າຊື້ຍ່ອຍ {savingsPercent}%</span>
                </p>
              )}
            </div>
          </div>

          {/* Optional Barcode Row */}
          <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 border border-slate-200">
            <div className="flex items-center gap-1 text-slate-400 pl-1 shrink-0">
              <ScanBarcode className="h-3.5 w-3.5" />
              <span className="text-[10.5px] font-semibold text-slate-600">
                ບາໂຄດແພັກ (ຖ້າມີ):
              </span>
            </div>
            <input
              type="text"
              value={packBarcode}
              onChange={(e) => {
                emitUnitsChange(true, packMultiplier, packSellingPrice, e.target.value);
              }}
              disabled={disabled}
              placeholder="ຍິງບາໂຄດເທິງແພັກ..."
              className="h-7 flex-1 rounded-lg border border-slate-200 px-2 text-xs font-mono font-medium text-slate-800 outline-none focus:border-emerald-600"
            />
            <button
              type="button"
              onClick={handleGeneratePackBarcode}
              disabled={disabled}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer shrink-0 active:scale-95"
              title="ສ້າງລະຫັດບາໂຄດແພັກອັດຕະໂນມັດ"
            >
              <Sparkles className="h-3 w-3" />
              <span>ສ້າງ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
