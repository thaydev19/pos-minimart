"use client";

// ============================================================================
// ProductUnitBuilder: Simplified Natural-Sentence Multi-Unit Wholesale Packaging
// Rule-based UX: 1 [ແພັກ] = [6] [ຕຸກ] -> ລາຄາຂາຍ: [28,000] ₭
// 100% type="button" - Zero form submission side effects - Automatic price suggest
// ============================================================================

import React, { useState } from "react";
import { Plus, Trash2, Layers, Percent, ArrowRight } from "lucide-react";
import { ProductUnitFormData } from "../types/product.types";
import { calculateUnitSavings, generateInternalBarcode } from "../utils/product.util";
import { formatLak } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";

interface ProductUnitBuilderProps {
  baseUnit: string;
  basePrice: number;
  baseBarcode: string;
  isWeighing?: boolean;
  units: ProductUnitFormData[];
  onChange: (units: ProductUnitFormData[]) => void;
  disabled?: boolean;
}

export function ProductUnitBuilder({
  baseUnit,
  basePrice,
  baseBarcode,
  isWeighing = false,
  units,
  onChange,
  disabled = false,
}: ProductUnitBuilderProps) {
  // Rule 2: Weighing items (vegetables, meat, fruits sold per kg/100g) do NOT have wholesale packaging
  if (isWeighing) {
    return null;
  }

  // Extract secondary units only (non-base units)
  const secondaryUnits = units.filter((u) => !u.is_base_unit);

  // Switch state: automatically ON if there are secondary units
  const [hasMultiUnit, setHasMultiUnit] = useState<boolean>(
    () => secondaryUnits.length > 0
  );

  const updateUnitsList = (newSecondary: ProductUnitFormData[]) => {
    // Preserve base unit
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

    onChange([updatedBase, ...newSecondary]);
  };

  /**
   * Fast preset adding: automatically enables switch & appends row
   */
  const handleAddPreset = (packageType: string, multiplier: number, suffix: string) => {
    setHasMultiUnit(true);

    const calculatedPrice = basePrice > 0 ? basePrice * multiplier : 0;
    const barcodeSuffix = baseBarcode ? `${baseBarcode}-${suffix}${multiplier}` : "";

    const newUnit: ProductUnitFormData = {
      id: crypto.randomUUID(),
      unit_name: packageType,
      conversion_rate: multiplier,
      selling_price: calculatedPrice,
      barcode: barcodeSuffix,
      is_base_unit: false,
    };

    updateUnitsList([...secondaryUnits, newUnit]);
  };

  /**
   * Add custom generic unit row
   */
  const handleAddCustomUnit = () => {
    setHasMultiUnit(true);

    const defaultMultiplier = 6;
    const calculatedPrice = basePrice > 0 ? basePrice * defaultMultiplier : 0;
    const barcodeSuffix = baseBarcode ? `${baseBarcode}-P${defaultMultiplier}` : "";

    const newUnit: ProductUnitFormData = {
      id: crypto.randomUUID(),
      unit_name: "ແພັກ",
      conversion_rate: defaultMultiplier,
      selling_price: calculatedPrice,
      barcode: barcodeSuffix,
      is_base_unit: false,
    };

    updateUnitsList([...secondaryUnits, newUnit]);
  };

  /**
   * Toggle multi-unit packaging switch
   */
  const handleToggleSwitch = (enabled: boolean) => {
    setHasMultiUnit(enabled);
    if (!enabled) {
      // Clear secondary units when switch is turned off
      updateUnitsList([]);
    } else if (secondaryUnits.length === 0) {
      // Auto-add initial pack of 6 when turned on
      handleAddPreset("ແພັກ", 6, "P");
    }
  };

  /**
   * Update specific field of a secondary unit row
   */
  const handleUpdateUnit = (
    id: string | undefined,
    field: keyof ProductUnitFormData,
    value: any
  ) => {
    const updated = secondaryUnits.map((u) => {
      if (u.id === id) {
        return { ...u, [field]: value };
      }
      return u;
    });
    updateUnitsList(updated);
  };

  /**
   * When conversion rate multiplier changes, auto-suggest new retail price = basePrice * rate
   */
  const handleRateChange = (id: string | undefined, newRate: number) => {
    const updated = secondaryUnits.map((u) => {
      if (u.id === id) {
        const oldRate = u.conversion_rate || 1;
        const autoPrice =
          u.selling_price === 0 || u.selling_price === basePrice * oldRate
            ? basePrice * newRate
            : u.selling_price;

        return {
          ...u,
          conversion_rate: newRate,
          selling_price: autoPrice,
        };
      }
      return u;
    });
    updateUnitsList(updated);
  };

  /**
   * Remove a secondary unit row
   */
  const handleRemoveUnit = (id: string | undefined) => {
    const updated = secondaryUnits.filter((u) => u.id !== id);
    if (updated.length === 0) {
      setHasMultiUnit(false);
    }
    updateUnitsList(updated);
  };

  /**
   * Generate internal barcode for packaging unit
   */
  const handleGenerateUnitBarcode = (id: string | undefined, rate: number) => {
    let generated = "";
    if (baseBarcode) {
      generated = `${baseBarcode}-P${rate}`;
    } else {
      generated = generateInternalBarcode(false);
    }
    handleUpdateUnit(id, "barcode", generated);
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4 space-y-3.5">
      {/* 1. Header with Switch Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Layers className="h-3.5 w-3.5 text-emerald-600" />
            <span>ມີຂາຍເປັນ ແພັກ / ແກັດ (Pack / Carton Packaging)</span>
          </div>
          <p className="text-[10px] text-slate-500">
            ກຳນົດຫົວໜ່ວຍຂາຍຍົກຊຸດ: ແພັກ, ແກັດ, ລັງ ພ້ອມລາຄາຂາຍສົ່ງ
          </p>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={hasMultiUnit}
            onChange={(e) => handleToggleSwitch(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* 2. When Switch is ON: Quick Presets Toolbar & Natural Sentence Rows */}
      {hasMultiUnit && (
        <div className="space-y-3 pt-1 animate-in fade-in duration-150">
          {/* Quick Preset Buttons (All type="button") */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 mr-1">
              ກົດເພີ່ມດ່ວນ:
            </span>
            <button
              type="button"
              onClick={() => handleAddPreset("ແພັກ", 6, "P")}
              disabled={disabled}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer"
            >
              + ແພັກ (x6)
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset("ແພັກ", 10, "P")}
              disabled={disabled}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer"
            >
              + ແພັກ (x10)
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset("ແພັກ", 12, "P")}
              disabled={disabled}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer"
            >
              + ແພັກ (x12)
            </button>
            <button
              type="button"
              onClick={() => handleAddPreset("ແກັດ", 24, "C")}
              disabled={disabled}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-800 hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer"
            >
              + ແກັດ (x24)
            </button>
            <button
              type="button"
              onClick={handleAddCustomUnit}
              disabled={disabled}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="h-3 w-3 inline mr-0.5 text-emerald-600" />
              <span>+ ເພີ່ມຫົວໜ່ວຍ</span>
            </button>
          </div>

          {/* Secondary Units: Natural Sentence Formula Rows */}
          {secondaryUnits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center">
              <p className="text-xs font-semibold text-slate-600">
                ກົດປຸ່ມດ່ວນດ້ານເທິງ (+ ແພັກ x6, + ແກັດ x24) ເພື່ອກຳນົດການຂາຍຍົກຊຸດ
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {secondaryUnits.map((u) => {
                const savingsPercent = calculateUnitSavings(
                  basePrice,
                  u.selling_price,
                  u.conversion_rate
                );

                return (
                  <div
                    key={u.id}
                    className="rounded-xl border border-zinc-200/90 bg-white p-3 shadow-2xs space-y-2 hover:border-emerald-300 transition-all"
                  >
                    {/* Natural Sentence Single Row: 1 [ແພັກ] = [6] [ຕຸກ] -> ລາຄາ: [28,000] ₭ [Trash2] */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span className="text-slate-400 font-extrabold text-xs select-none shrink-0">
                        1
                      </span>

                      {/* Package Name Input / Dropdown: w-24 */}
                      <div className="relative w-24 shrink-0">
                        <input
                          type="text"
                          required
                          list={`pkg-types-${u.id}`}
                          value={u.unit_name}
                          onChange={(e) =>
                            handleUpdateUnit(u.id, "unit_name", e.target.value)
                          }
                          disabled={disabled}
                          placeholder="ແພັກ, ແກັດ..."
                          className="h-8.5 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                        />
                        <datalist id={`pkg-types-${u.id}`}>
                          <option value="ແພັກ" />
                          <option value="ແກັດ" />
                          <option value="ລັງ" />
                          <option value="ກ່ອງໃຫຍ່" />
                          <option value="ໂຫຼ" />
                        </datalist>
                      </div>

                      <span className="text-slate-400 font-extrabold text-xs select-none shrink-0">
                        =
                      </span>

                      {/* Quantity: w-14 + Base Unit Badge */}
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="2"
                          required
                          value={u.conversion_rate || ""}
                          onChange={(e) =>
                            handleRateChange(
                              u.id,
                              Math.max(1, Number(e.target.value))
                            )
                          }
                          disabled={disabled}
                          className="h-8.5 w-14 rounded-xl border border-slate-200 bg-white px-1 text-xs font-black text-center text-emerald-800 outline-none focus:border-emerald-600 tabular-nums"
                        />
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-1 rounded-lg border border-emerald-100 select-none whitespace-nowrap">
                          {baseUnit || "ອັນ"}
                        </span>
                      </div>

                      <ArrowRight className="h-3 w-3 text-slate-300 shrink-0 select-none" />

                      {/* Selling Price */}
                      <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                        <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap shrink-0">
                          ລາຄາ:
                        </span>
                        <KipCurrencyInput
                          required
                          disabled={disabled}
                          value={u.selling_price || 0}
                          onValueChange={(val) =>
                            handleUpdateUnit(u.id, "selling_price", val)
                          }
                          containerClassName="flex-1 min-w-[90px]"
                          className="h-8.5 text-xs font-extrabold border-emerald-500 text-slate-900"
                        />
                      </div>

                      {/* Delete Row Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveUnit(u.id)}
                        disabled={disabled}
                        className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                        title="ລຶບຫົວໜ່ວຍນີ້"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Sub-row: Optional packaging barcode & Savings discount pill (No 'ສ້າງ' button) */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                        <span className="text-[10px] text-slate-400 whitespace-nowrap select-none">
                          ບາໂຄດແພັກ/ແກັດ (ຖ້າມີ):
                        </span>
                        <input
                          type="text"
                          value={u.barcode || ""}
                          onChange={(e) =>
                            handleUpdateUnit(u.id, "barcode", e.target.value)
                          }
                          disabled={disabled}
                          placeholder="ຍິງບາໂຄດແພັກ..."
                          className="h-6.5 flex-1 rounded-lg border border-slate-200 px-2 text-[10px] font-mono outline-none focus:border-emerald-600"
                        />
                      </div>

                      {savingsPercent > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9.5px] font-bold text-emerald-800 shrink-0">
                          <Percent className="h-2.5 w-2.5" />
                          <span>
                            ປະຢັດ {savingsPercent}% (ປົກກະຕິ: {formatLak(u.conversion_rate * basePrice)})
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
