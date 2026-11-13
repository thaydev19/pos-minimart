"use client";

// ============================================================================
// ProductFormSheet: Centered 2-Column Dialog with Architecture: ZERO-useEffect
// State is purely initialized on React mount via key-based instance recreation
// Zero Infinite Loops - Pure Event Handlers - TanStack Query Mutations
// ============================================================================

import React, { useState } from "react";
import {
  X,
  Package,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  Scale,
  Clock,
  Coins,
  TrendingUp,
  Tag,
  PackagePlus,
  Calendar,
  Percent,
  ScanBarcode,
  CheckCircle2,
} from "lucide-react";
import { useProductStore } from "../stores/product.store";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "../hooks/useProducts";
import {
  ProductFormData,
  ProductListItem,
  ProductUnitFormData,
} from "../types/product.types";
import {
  validateUnitBarcodes,
  calculateUnitSavings,
} from "../utils/product.util";
import { useCategories } from "@/features/categories";
import { CategoryItem } from "@/features/categories/types/category.types";
import { ProductImageUploader } from "./ProductImageUploader";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";
import { formatLak } from "@/utils/formatLakCurrency";

export interface ProductFormSheetProps {
  product?: ProductListItem | null;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

/**
 * Pure state initializer without side effects.
 * Barcode defaults to EMPTY (no auto-generated barcode).
 */
function getInitialProductFormData(
  product?: ProductListItem | null,
  defaultCategoryId: string = ""
): ProductFormData {
  if (product) {
    return {
      name_lo: product.name_lo || "",
      name_en: product.name_en || "",
      category_id: product.category_id || defaultCategoryId,
      base_unit: product.base_unit || "ອັນ",
      barcode: product.barcode || "",
      sku: product.sku || "",
      cost_price: product.cost_price || 0,
      selling_price: product.selling_price || 0,
      is_weighing: product.is_weighing || false,
      is_perishable: product.is_perishable || false,
      warning_days_before_expiry: product.warning_days_before_expiry || 15,
      image_url: product.image_url || "",
      units: (product.units || []).map((u) => ({
        id: u.id || crypto.randomUUID(),
        unit_name: u.unit_name,
        conversion_rate: u.conversion_rate,
        selling_price: u.selling_price,
        barcode: u.barcode,
        is_base_unit: u.is_base_unit,
      })),
    };
  }

  // Create Mode: Empty barcode, user enters or scans freely
  return {
    name_lo: "",
    name_en: "",
    category_id: defaultCategoryId,
    base_unit: "ອັນ",
    barcode: "",
    sku: "",
    cost_price: 0,
    selling_price: 0,
    is_weighing: false,
    is_perishable: false,
    warning_days_before_expiry: 15,
    image_url: "",
    units: [
      {
        id: crypto.randomUUID(),
        unit_name: "ອັນ",
        conversion_rate: 1,
        selling_price: 0,
        barcode: "",
        is_base_unit: true,
      },
    ],
  };
}

interface ProductFormContentProps {
  product?: ProductListItem | null;
  categories: CategoryItem[];
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Pure Form Body: Has ZERO useEffect hooks!
 * React key reset at parent guarantees clean initialization every time.
 */
export function ProductFormContent({
  product,
  categories,
  onClose,
  onSuccess,
}: ProductFormContentProps) {
  // Pure state initialization — zero useEffect!
  const [formData, setFormData] = useState<ProductFormData>(() =>
    getInitialProductFormData(
      product,
      categories && categories.length > 0 ? categories[0].id : ""
    )
  );

  const [formError, setFormError] = useState<string | null>(null);

  // Existing pack unit if any (conversion_rate > 1)
  const existingPackUnit = (formData.units || []).find((u) => !u.is_base_unit);

  // Independent state for Pack Settings (Free typing, customizable pack unit name)
  const [hasPackUnit, setHasPackUnit] = useState<boolean>(Boolean(existingPackUnit));
  const [packUnitName, setPackUnitName] = useState<string>(existingPackUnit?.unit_name || "ແພັກ");
  const [packMultiplier, setPackMultiplier] = useState<number>(existingPackUnit?.conversion_rate || 0);
  const [packCost, setPackCost] = useState<number>(0);
  const [packSellingPrice, setPackSellingPrice] = useState<number>(existingPackUnit?.selling_price || 0);
  const [packBarcode, setPackBarcode] = useState<string>(existingPackUnit?.barcode || "");

  // Pure initial stock state (Only used in create mode)
  const [initialQuantity, setInitialQuantity] = useState<number>(0);
  const [initialUnitName, setInitialUnitName] = useState<string>("");
  const [initialExpiryDate, setInitialExpiryDate] = useState<string>("");

  const allAvailableUnits = [
    {
      unit_name: formData.base_unit.trim() || "ອັນ",
      conversion_rate: 1,
      is_base_unit: true,
    },
    ...(hasPackUnit && packMultiplier > 1 && !formData.is_weighing
      ? [
          {
            unit_name: packUnitName.trim() || "ແພັກ",
            conversion_rate: packMultiplier,
            is_base_unit: false,
          },
        ]
      : []),
  ];

  const selectedInitialUnit =
    allAvailableUnits.find((u) => u.unit_name === initialUnitName) ||
    allAvailableUnits[0];

  const totalBaseUnits =
    (initialQuantity || 0) * (selectedInitialUnit?.conversion_rate || 1);

  // TanStack Query Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  // Margin calculation
  const marginLak = formData.selling_price - formData.cost_price;
  const marginPct =
    formData.selling_price > 0
      ? Math.round((marginLak / formData.selling_price) * 100)
      : 0;

  // Event Handlers
  const handleBaseUnitChange = (newBaseUnit: string) => {
    setFormData((prev) => ({
      ...prev,
      base_unit: newBaseUnit,
      units: prev.units.map((u) =>
        u.is_base_unit ? { ...u, unit_name: newBaseUnit } : u
      ),
    }));
  };

  const handleBasePriceChange = (newPrice: number) => {
    setFormData((prev) => ({
      ...prev,
      selling_price: newPrice,
      units: prev.units.map((u) =>
        u.is_base_unit ? { ...u, selling_price: newPrice } : u
      ),
    }));
  };

  const handleBarcodeChange = (newBarcode: string) => {
    setFormData((prev) => ({
      ...prev,
      barcode: newBarcode,
      units: prev.units.map((u) =>
        u.is_base_unit ? { ...u, barcode: newBarcode } : u
      ),
    }));
  };

  const handleToggleWeighing = (isWeighing: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_weighing: isWeighing,
      base_unit: isWeighing
        ? "ກິໂລ"
        : prev.base_unit === "ກິໂລ"
        ? "ອັນ"
        : prev.base_unit,
      units: prev.units.map((u) =>
        u.is_base_unit
          ? {
              ...u,
              unit_name: isWeighing ? "ກິໂລ" : u.unit_name,
            }
          : u
      ),
    }));
    if (isWeighing) {
      setHasPackUnit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validation
    if (!formData.name_lo.trim()) {
      setFormError("ກະລຸນາປ້ອນຊື່ສິນຄ້າ (ພາສາລາວ)");
      return;
    }
    if (!formData.barcode.trim()) {
      setFormError("ກະລຸນາປ້ອນ ຫຼື ຍິງບາໂຄດສິນຄ້າ");
      return;
    }
    if (formData.selling_price < 0) {
      setFormError("ລາຄາຂາຍບໍ່ສາມາດຕິດລົບໄດ້");
      return;
    }

    // 2. Prepare units list
    const baseUnitObj: ProductUnitFormData = {
      id: "base-unit-synced",
      unit_name: formData.base_unit.trim() || "ອັນ",
      conversion_rate: 1,
      selling_price: formData.selling_price,
      barcode: formData.barcode.trim(),
      is_base_unit: true,
    };

    const finalizedUnits: ProductUnitFormData[] = [baseUnitObj];
    if (hasPackUnit && packMultiplier > 1 && !formData.is_weighing) {
      finalizedUnits.push({
        id: existingPackUnit?.id || crypto.randomUUID(),
        unit_name: packUnitName.trim() || "ແພັກ",
        conversion_rate: packMultiplier,
        selling_price: Math.max(0, packSellingPrice),
        barcode: packBarcode.trim() || (formData.barcode ? `${formData.barcode}-P${packMultiplier}` : ""),
        is_base_unit: false,
      });
    }

    // 3. Validate unit barcodes
    const unitValidation = validateUnitBarcodes(finalizedUnits, formData.barcode);
    if (!unitValidation.isValid) {
      setFormError(unitValidation.error || "ຂໍ້ມູນຫົວໜ່ວຍບໍ່ຖືກຕ້ອງ");
      return;
    }

    // 4. Validate initial stock expiry if FEFO tracking is active
    if (!product && initialQuantity > 0 && formData.is_perishable && !initialExpiryDate.trim()) {
      setFormError("ກະລຸນາປ້ອນ ຫຼື ເລືອກວັນໝົດອາຍຸສຳລັບສິນຄ້າທີ່ຕິດຕາມ FEFO");
      return;
    }

    const payload: ProductFormData = {
      ...formData,
      name_lo: formData.name_lo.trim(),
      name_en: formData.name_en?.trim() || undefined,
      category_id: formData.category_id || undefined,
      base_unit: formData.base_unit.trim() || "ອັນ",
      barcode: formData.barcode.trim(),
      sku: formData.sku?.trim() || undefined,
      image_url: formData.image_url?.trim() || undefined,
      units: finalizedUnits,
      ...(!product && initialQuantity > 0
        ? {
            initial_stock: {
              quantity: totalBaseUnits, // Converted to base units
              unit_name: formData.base_unit.trim() || "ອັນ",
              conversion_rate: 1,
              expiry_date: formData.is_perishable && initialExpiryDate.trim() ? initialExpiryDate.trim() : undefined,
            },
          }
        : {}),
    };

    try {
      if (product) {
        await updateMutation.mutateAsync({ id: product.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setFormError(err.message || "ບັນທຶກຂໍ້ມູນສິນຄ້າບໍ່ສຳເລັດ");
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    const confirmed = window.confirm(
      `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສິນຄ້າ "${product.name_lo}"?\n\n(ໝາຍເຫດ: ຫາກສິນຄ້າເຄີຍມີປະຫວັດການຂາຍ ລະບົບຈະປິດການຂາຍ ແລະ ເຊື່ອງອອກຈາກໜ້າ POS ອັດຕະໂນມັດ)`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(product.id);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setFormError(err.message || "ລຶບສິນຄ້າບໍ່ສຳເລັດ");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        {/* 1. Header Bar */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200/90 px-6 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                {product ? "ແກ້ໄຂສິນຄ້າ (Edit Product)" : "ເພີ່ມສິນຄ້າໃໝ່ (New Product)"}
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                {product ? `ລະຫັດ: ${product.barcode}` : "ກຳນົດຫົວໜ່ວຍຂາຍ, ລາຄາ ແລະ ບາໂຄດ"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body: Balanced 2-Column Desktop Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ========================================================= */}
            {/* LEFT COLUMN: General Info, Image & Settings (5 cols)      */}
            {/* ========================================================= */}
            <div className="lg:col-span-5 space-y-4">
              {/* Product Names Card */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-zinc-200/60">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                  <span>ຂໍ້ມູນທົ່ວໄປ (General Information)</span>
                </h3>

                {/* Lao Name (Required) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ຊື່ສິນຄ້າ (ພາສາລາວ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_lo}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name_lo: e.target.value }))
                    }
                    placeholder="ເຊັ່ນ: ນ້ຳດື່ມ ຫົວເສືອ 550ml..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-400"
                  />
                </div>

                {/* English / Secondary Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ຊື່ພາສາອັງກິດ (English Name)
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name_en: e.target.value }))
                    }
                    placeholder="e.g. Tigerhead Water 550ml..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-400"
                  />
                </div>

                {/* Category & SKU */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ໝວດໝູ່ (Category)
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          category_id: e.target.value,
                        }))
                      }
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="">-- ທົ່ວໄປ (General) --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_lo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ລະຫັດພາຍໃນ (SKU)
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, sku: e.target.value }))
                      }
                      placeholder="SKU-..."
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono font-semibold text-slate-800 outline-none focus:border-emerald-600 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Image Uploader Card */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4">
                <ProductImageUploader
                  value={formData.image_url || ""}
                  onChange={(url) =>
                    setFormData((p) => ({ ...p, image_url: url }))
                  }
                />
              </div>

              {/* Perishable & Weighing Toggles */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4 space-y-3">
                {/* Weighing scale toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Scale className="h-3.5 w-3.5 text-amber-600" />
                      <span>ສິນຄ້າຊັ່ງນ້ຳໜັກ (Weighing Scale)</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      ສິນຄ້າສົດ, ຜັກ, ໝາກໄມ້, ຊີ້ນ ທີ່ໃຊ້ບາໂຄດຕາຊັ່ງ (PLU)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_weighing}
                      onChange={(e) => handleToggleWeighing(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {/* FEFO Expiry tracking toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      <span>ຈັດການວັນໝົດອາຍຸ (FEFO Tracking)</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      ຕິດຕາມລັອດສິນຄ້າ ແລະ ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດອາຍຸ
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_perishable}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          is_perishable: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Expiry Tracking Settings */}
                {formData.is_perishable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-200/60 animate-in fade-in duration-150">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        ແຈ້ງເຕືອນລ່ວງໜ້າ (ວັນ)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.warning_days_before_expiry}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            warning_days_before_expiry: Number(e.target.value),
                          }))
                        }
                        placeholder="15"
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-center text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-indigo-600" />
                          <span>ວັນໝົດອາຍຸລັອດທຳອິດ</span>
                        </span>
                        {initialQuantity > 0 && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="date"
                        required={initialQuantity > 0}
                        value={initialExpiryDate}
                        onChange={(e) => setInitialExpiryDate(e.target.value)}
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 cursor-pointer"
                      />

                      <div className="flex items-center gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 30);
                            setInitialExpiryDate(d.toISOString().split("T")[0]);
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white py-0.5 text-[9.5px] font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer active:scale-95 text-center shadow-2xs"
                        >
                          +30 ວັນ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setMonth(d.getMonth() + 6);
                            setInitialExpiryDate(d.toISOString().split("T")[0]);
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white py-0.5 text-[9.5px] font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer active:scale-95 text-center shadow-2xs"
                        >
                          +6 ເດືອນ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setFullYear(d.getFullYear() + 1);
                            setInitialExpiryDate(d.toISOString().split("T")[0]);
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white py-0.5 text-[9.5px] font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer active:scale-95 text-center shadow-2xs"
                        >
                          +1 ປີ
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT COLUMN: 3 Clean Dedicated Blocks (7 cols)           */}
            {/* 1. Base Unit, Pricing & Barcode (Top)                     */}
            {/* 2. Pack Settings (Middle)                                 */}
            {/* 3. Initial Stock (Create Mode Only)                       */}
            {/* ========================================================= */}
            <div className="lg:col-span-7 space-y-3">
              {/* 1. KHỐI 1: ĐƠN VỊ BÁN LẺ, GIÁ VỐN & BÁN, VÀ BARCODE (Barcode nằm dưới giá) */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-3.5 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between pb-1.5 border-b border-zinc-200/60">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-emerald-600" />
                    <span>1. ຫົວໜ່ວຍຂາຍຍ່ອຍ & ລາຄາ (Base Unit & Retail Pricing)</span>
                  </span>
                  {/* <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Cấp 1 - Bắt buộc
                  </span> */}
                </h3>

                {/* Hàng 1: Chọn nhanh đơn vị cơ sở */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      ຫົວໜ່ວຍຂາຍຍ່ອຍ (Base Unit) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {formData.is_weighing ? "ຫົວໜ່ວຍຊັ່ງນ້ຳໜັກ" : "ເລືອກດ່ວນ ຫຼື ພິມເອງ"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(formData.is_weighing
                      ? [
                          { name: "ກິໂລ", label: "ກິໂລ" },
                          { name: "ຂີດ", label: "ຂີດ" },
                        ]
                      : [
                          { name: "ຕຸກ", label: "ຕຸກ" },
                          { name: "ປ໋ອງ", label: "ປ໋ອງ" },
                          { name: "ຊອງ", label: "ຊອງ (Sachet)" },
                          { name: "ກ່ອງ", label: "ກ່ອງ" },
                          { name: "ຖົງ", label: "ຖົງ" },
                          { name: "ອັນ", label: "ອັນ" },
                          { name: "custom", label: "ອື່ນໆ (Custom)" },
                        ]
                    ).map((item) => {
                      const isCustom = item.name === "custom";
                      const standardNames = ["ກິໂລ", "ຂີດ", "ຕຸກ", "ປ໋ອງ", "ຊອງ", "ກ່ອງ", "ຖົງ", "ອັນ"];
                      const isSelected = isCustom
                        ? !standardNames.includes(formData.base_unit)
                        : formData.base_unit === item.name;

                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            if (isCustom) {
                              if (standardNames.includes(formData.base_unit)) {
                                handleBaseUnitChange("");
                              }
                            } else {
                              handleBaseUnitChange(item.name);
                            }
                          }}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-2xs scale-102"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {!["ກິໂລ", "ຂີດ", "ຕຸກ", "ປ໋ອງ", "ຊອງ", "ກ່ອງ", "ຖົງ", "ອັນ"].includes(formData.base_unit) && (
                    <div className="pt-0.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={formData.base_unit}
                        onChange={(e) => handleBaseUnitChange(e.target.value)}
                        placeholder="ພິມຫົວໜ່ວຍເອງ (ເຊັ່ນ: ມ້ວນ, ຫຼອດ, ຄູ່, ດອກ...)"
                        className="h-8.5 w-full rounded-xl border border-emerald-500 bg-white px-3 text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>

                {/* Hàng 2: Cột Giá mua & Giá bán lẻ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ລາຄາຕົ້ນທຶນ / 1 {formData.base_unit || "ອັນ"} (₭)
                    </label>
                    <KipCurrencyInput
                      value={formData.cost_price || 0}
                      onValueChange={(val) => {
                        setFormData((p) => ({ ...p, cost_price: val }));
                      }}
                      placeholder="0"
                      className="h-9 text-xs font-semibold text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ລາຄາຂາຍຍ່ອຍ / 1 {formData.base_unit || "ອັນ"} (₭){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <KipCurrencyInput
                      required
                      value={formData.selling_price || 0}
                      onValueChange={(val) => handleBasePriceChange(val)}
                      placeholder="0"
                      className="h-9 border-emerald-500 text-xs font-black text-emerald-800 bg-white focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Hàng 3: Barcode lẻ (NẰM DƯỚI CỘT GIÁ MUA GIÁ BÁN, KHÔNG TỰ ĐIỀN, KHÔNG CÓ NÚT TỰ TẠO) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ບາໂຄດຂາຍຍ່ອຍ (Retail Barcode) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => handleBarcodeChange(e.target.value)}
                    placeholder="ຍິງ ຫຼື ພິມບາໂຄດຂາຍຍ່ອຍ..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-400"
                  />
                </div>

                {/* Hàng 4: Thanh hiển thị lợi nhuận bán lẻ */}
                <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px] font-bold text-slate-600">
                      ກຳໄລຂາຍຍ່ອຍ (Margin):
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      +{formatLak(Math.max(0, marginLak))}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                        marginPct >= 20
                          ? "bg-emerald-100 text-emerald-800"
                          : marginPct > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {marginPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. KHỐI 2 (Ở GIỮA): CÀI ĐẶT PACK / LỐC (TỰ DO NHẬP, KHÔNG ĐIỀN SẴN 6, XÓA NÚT CHỌN NHANH) */}
              {!formData.is_weighing && (
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-3.5 space-y-2.5">
                  {/* Header with Switch */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/60">
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
                        onChange={(e) => setHasPackUnit(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Khi Switch Bật: Cho tự do nhập số lượng pack, tùy chỉnh tên đơn vị pack */}
                  {hasPackUnit && (
                    <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                      {/* Quy cách 1 [tên đơn vị pack] = [X] [baseUnit] */}
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 border border-slate-200">
                          <span className="text-xs font-bold text-slate-500 pl-1">1</span>
                          <input
                            type="text"
                            value={packUnitName}
                            onChange={(e) => setPackUnitName(e.target.value)}
                            placeholder="ແພັກ"
                            className="h-7 w-20 rounded-md border border-slate-300 bg-white px-2 text-center text-xs font-black text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                            title="ປັບປ່ຽນຊື່ຫົວໜ່ວຍ (ເຊັ່ນ: ແພັກ, ກ່ອງ, ລັງ, ໂຫຼ...)"
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-400">=</span>
                        <input
                          type="number"
                          min="1"
                          value={packMultiplier === 0 ? "" : packMultiplier}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setPackMultiplier(val);
                          }}
                          placeholder="ຈຳນວນ"
                          className="h-8.5 w-24 rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-black text-emerald-800 outline-none focus:border-emerald-600 tabular-nums placeholder:text-slate-400"
                        />
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 border border-emerald-100 whitespace-nowrap">
                          {formData.base_unit || "ອັນ"}
                        </span>
                      </div>

                      {/* 2 Ô Nằm Ngang: Giá mua 1 Pack & Giá bán 1 Pack (Nhập hoàn toàn tự do) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* 1. Pack Cost Price: Hoàn toàn tự do nhập bất kỳ số nào */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            ຕົ້ນທຶນຊື້ 1 {packUnitName || "ແພັກ"} (₭)
                          </label>
                          <KipCurrencyInput
                            value={packCost}
                            onValueChange={(val) => setPackCost(val)}
                            placeholder="0"
                            className="h-8.5 text-xs font-bold text-slate-800 bg-white"
                          />
                          {packCost > 0 && packMultiplier > 0 && (
                            <p className="text-[9.5px] text-emerald-700 font-medium mt-0.5">
                              (= {formatLak(Math.round(packCost / packMultiplier))} / 1 {formData.base_unit || "ອັນ"})
                            </p>
                          )}
                        </div>

                        {/* 2. Pack Selling Price */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            ລາຄາຂາຍ 1 {packUnitName || "ແພັກ"} (₭) <span className="text-rose-500">*</span>
                          </label>
                          <KipCurrencyInput
                            required={hasPackUnit}
                            value={packSellingPrice}
                            onValueChange={(val) => setPackSellingPrice(val)}
                            placeholder="0"
                            className="h-8.5 text-xs font-extrabold border-emerald-500 text-emerald-950 bg-white focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      {/* Hàng nhập mã vạch Pack */}
                      <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 border border-slate-200">
                        <div className="flex items-center gap-1 text-slate-400 pl-1 shrink-0">
                          <ScanBarcode className="h-3.5 w-3.5" />
                          <span className="text-[10.5px] font-semibold text-slate-600">
                            ບາໂຄດ{packUnitName || "ແພັກ"} (ຖ້າມີ):
                          </span>
                        </div>
                        <input
                          type="text"
                          value={packBarcode}
                          onChange={(e) => setPackBarcode(e.target.value)}
                          placeholder={`ຍິງ ຫຼື ພິມບາໂຄດເທິງ${packUnitName || "ແພັກ"}...`}
                          className="h-7 flex-1 rounded-lg border border-slate-200 px-2 text-xs font-mono font-medium text-slate-800 outline-none focus:border-emerald-600 placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. KHỐI 3 (DƯỚI CÙNG - CHỈ HIỆN KHI TẠO MỚI): TỒN KHO BAN ĐẦU */}
              {!product && (
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Label + description */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                          <PackagePlus className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          ສະຕັອກເລີ່ມຕົ້ນ (Initial Stock)
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          (ທາງເລືອກ)
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 pl-8">
                        ຈຳນວນສິນຄ້າພ້ອມຂາຍທັນທີເມື່ອສ້າງສິນຄ້າໃໝ່
                      </p>
                    </div>

                    {/* Right: Quantity Input + Unit Select on 1 single row */}
                    <div className="flex items-center gap-1.5 shrink-0 sm:w-64">
                      <input
                        type="number"
                        min="0"
                        value={initialQuantity === 0 ? "" : initialQuantity}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setInitialQuantity(val);
                        }}
                        placeholder="0"
                        className="h-9 flex-1 min-w-[70px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-300 text-right tabular-nums"
                      />
                      <select
                        value={initialUnitName || allAvailableUnits[0].unit_name}
                        onChange={(e) => setInitialUnitName(e.target.value)}
                        className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 shrink-0 cursor-pointer"
                      >
                        {allAvailableUnits.map((u, idx) => (
                          <option key={`${u.unit_name}-${u.conversion_rate}-${idx}`} value={u.unit_name}>
                            {u.unit_name} {u.conversion_rate > 1 ? `(x${u.conversion_rate})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dòng kết quả quy đổi màu xanh nổi bật */}
                  {initialQuantity > 0 && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        {selectedInitialUnit.conversion_rate > 1 ? (
                          <>
                            {initialQuantity} {selectedInitialUnit.unit_name} × {selectedInitialUnit.conversion_rate} = {totalBaseUnits} {formData.base_unit} (ນຳເຂົ້າສາງຕົວຈິງ: {totalBaseUnits} {formData.base_unit})
                          </>
                        ) : (
                          <>
                            ນຳເຂົ້າສາງຕົວຈິງ: {totalBaseUnits} {formData.base_unit}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Sticky Footer Action Bar */}
        <div className="flex h-16 items-center justify-between border-t border-zinc-200/90 bg-zinc-50 px-6 shrink-0">
          <div>
            {product && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                title="ລຶບສິນຄ້ານີ້"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>ລຶບສິນຄ້າ</span>
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 px-4">
            {formError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold truncate">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span className="truncate">{formError}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{product ? "ບັນທຶກການແກ້ໄຂ" : "ບັນທຶກສິນຄ້າ"}</span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

/**
 * Shell Container: Uses Key to guarantee full unmount/mount cycle.
 */
export function ProductFormSheet(props?: ProductFormSheetProps) {
  const storeIsOpen = useProductStore((s) => s.isFormSheetOpen);
  const storeProduct = useProductStore((s) => s.editingProduct);
  const storeClose = useProductStore((s) => s.closeFormSheet);
  const { categories } = useCategories();

  const isOpen = props?.isOpen !== undefined ? props.isOpen : storeIsOpen;
  const product = props?.product !== undefined ? props.product : storeProduct;
  const onClose = props?.onClose || storeClose;

  if (!isOpen) {
    return null;
  }

  const sheetInstanceKey = product ? `edit-${product.id}` : "create-new-product";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative flex flex-col w-full max-w-5xl xl:max-w-6xl max-h-[92vh] bg-white rounded-2xl border border-zinc-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <ProductFormContent
          key={sheetInstanceKey}
          product={product}
          categories={categories}
          onClose={onClose}
          onSuccess={props?.onSuccess}
        />
      </div>
    </div>
  );
}
