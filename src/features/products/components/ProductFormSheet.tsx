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
import { COMMON_LAO_UNITS } from "../constants/product.constants";
import {
  validateUnitBarcodes,
  generateInternalBarcode,
} from "../utils/product.util";
import { useCategories } from "@/features/categories";
import { CategoryItem } from "@/features/categories/types/category.types";
import { BarcodeGeneratorInput } from "./BarcodeGeneratorInput";
import { ProductImageUploader } from "./ProductImageUploader";
import { ProductUnitBuilder } from "./ProductUnitBuilder";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";
import { formatLak } from "@/utils/formatLakCurrency";

export interface ProductFormSheetProps {
  isOpen?: boolean;
  product?: ProductListItem | null;
  onClose?: () => void;
  onSuccess?: () => void;
}

/**
 * Pure function to construct initial form state from product or defaults.
 * Zero side-effects, generates barcode exactly once on initial mount.
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

  // Create Mode: Generate default internal barcode ONCE on initial mount
  const initialBarcode = generateInternalBarcode(false);
  return {
    name_lo: "",
    name_en: "",
    category_id: defaultCategoryId,
    base_unit: "ອັນ",
    barcode: initialBarcode,
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
        barcode: initialBarcode,
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
    ...(formData.units || []).filter((u) => !u.is_base_unit),
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

  // Event Handlers (No useEffect needed)
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
    const newBarcode = generateInternalBarcode(isWeighing);
    setFormData((prev) => ({
      ...prev,
      is_weighing: isWeighing,
      base_unit: isWeighing
        ? "ກິໂລ"
        : prev.base_unit === "ກິໂລ"
        ? "ອັນ"
        : prev.base_unit,
      barcode: newBarcode,
      units: prev.units.map((u) =>
        u.is_base_unit
          ? {
              ...u,
              unit_name: isWeighing ? "ກິໂລ" : u.unit_name,
              barcode: newBarcode,
            }
          : u
      ),
    }));
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
      setFormError("ກະລຸນາປ້ອນ ຫຼື ສ້າງບາໂຄດສິນຄ້າ");
      return;
    }
    if (formData.selling_price < 0) {
      setFormError("ລາຄາຂາຍບໍ່ສາມາດຕິດລົບໄດ້");
      return;
    }

    // 2. Prepare units list (base unit synchronized with header fields)
    const baseUnitObj: ProductUnitFormData = {
      id: "base-unit-synced",
      unit_name: formData.base_unit.trim() || "ອັນ",
      conversion_rate: 1,
      selling_price: formData.selling_price,
      barcode: formData.barcode.trim(),
      is_base_unit: true,
    };

    const secondaryUnits = (formData.units || []).filter((u) => !u.is_base_unit);
    const finalizedUnits = [baseUnitObj, ...secondaryUnits];

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
              quantity: initialQuantity,
              unit_name: selectedInitialUnit.unit_name,
              conversion_rate: selectedInitialUnit.conversion_rate,
              expiry_date: formData.is_perishable && initialExpiryDate.trim() ? initialExpiryDate.trim() : undefined,
            },
          }
        : {}),
      ...(!product && initialQuantity > 0
        ? {
            initial_stock: {
              quantity: initialQuantity,
              unit_name: selectedInitialUnit.unit_name,
              conversion_rate: selectedInitialUnit.conversion_rate,
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
      {/* 1. Sticky Modal Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-200/90 px-6 shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
              {product
                ? "ແກ້ໄຂຂໍ້ມູນສິນຄ້າ (Edit Product)"
                : "ເພີ່ມສິນຄ້າໃໝ່ (New Product)"}
            </h2>
            <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              {product
                ? product.name_lo
                : "ກຳນົດຂໍ້ມູນພື້ນຖານ, ລາຄາ ແລະ ຫົວໜ່ວຍຂາຍຍົກຊຸດ"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          title="ປິດໜ້າຕ່າງ"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Scrollable 2-Column Form Body */}
      <form
        id="product-form"
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 no-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ========================================================= */}
            {/* LEFT COLUMN: Basic Info, Category, Barcode, Images (5 cols) */}
            {/* ========================================================= */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-zinc-200/60">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                  <span>ຂໍ້ມູນພື້ນຖານສິນຄ້າ (General Info)</span>
                </h3>

                {/* Product Name Lao */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    ຊື່ສິນຄ້າ (ພາສາລາວ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_lo}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name_lo: e.target.value }))
                    }
                    placeholder="ເຊັ່ນ: ເບຍລາວ ລາເກີ 330ມລ"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                  />
                </div>

                {/* Product Name English */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    ຊື່ສິນຄ້າ (ພາສາອັງກິດ)
                  </label>
                  <input
                    type="text"
                    value={formData.name_en || ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name_en: e.target.value }))
                    }
                    placeholder="Beerlao Lager 330ml Can"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Category selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    ໝວດໝູ່ສິນຄ້າ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category_id || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        category_id: e.target.value,
                      }))
                    }
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
                  >
                    <option value="">-- ເລືອກໝວດໝູ່ --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_lo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Main Barcode Generator */}
                <BarcodeGeneratorInput
                  value={formData.barcode}
                  onChange={handleBarcodeChange}
                  isWeighing={formData.is_weighing}
                />

                {/* SKU Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    ລະຫັດສິນຄ້າ (SKU)
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, sku: e.target.value }))
                    }
                    placeholder="ເຊັ່ນ: BL-330, RICE-5KG..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono font-medium text-slate-800 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Image Uploader Card */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4">
                <ProductImageUploader
                  value={formData.image_url}
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

                {/* Expiry Tracking Settings (Warning Days + Initial Batch Expiry Date) */}
                {formData.is_perishable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-200/60 animate-in fade-in duration-150">
                    {/* 1. Warning days before expiry */}
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

                    {/* 2. First Batch Expiry Date with quick select buttons */}
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

                      {/* Quick select pills */}
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
            {/* RIGHT COLUMN: Pricing & Multi-Unit Packaging (7 cols)    */}
            {/* ========================================================= */}
            <div className="lg:col-span-7 space-y-4">
              {/* 1. Base Pricing Card */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-zinc-200/60">
                  <span className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-emerald-600" />
                    <span>ລາຄາຂາຍຍ່ອຍ & ຕົ້ນທຶນ (Retail Pricing)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Lao Kip (LAK)
                  </span>
                </h3>

                {/* Base Unit Selector with 1-tap quick pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      ຫົວໜ່ວຍພື້ນຖານ (Base Unit) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {formData.is_weighing ? "ຫົວໜ່ວຍຊັ່ງນ້ຳໜັກ" : "ເລືອກດ່ວນ ຫຼື ພິມເອງ"}
                    </span>
                  </div>

                  {/* 1-Tap Quick Select Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(formData.is_weighing
                      ? [
                          { name: "ກິໂລ", label: "ກິໂລ (Kg)" },
                          { name: "ຂີດ", label: "ຂີດ (100g)" },
                        ]
                      : [
                          { name: "ຕຸກ", label: "ຕຸກ (Bottle)" },
                          { name: "ປ໋ອງ", label: "ປ໋ອງ (Can)" },
                          { name: "ຊອງ", label: "ຊອງ (Pack)" },
                          { name: "ກ່ອງ", label: "ກ່ອງ (Box)" },
                          { name: "ຖົງ", label: "ຖົງ (Bag)" },
                          { name: "ອັນ", label: "ອັນ (Piece)" },
                        ]
                    ).map((item) => {
                      const isSelected = formData.base_unit === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleBaseUnitChange(item.name)}
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

                  {/* Custom Input */}
                  <div className="pt-0.5">
                    <input
                      type="text"
                      required
                      value={formData.base_unit}
                      onChange={(e) => handleBaseUnitChange(e.target.value)}
                      placeholder="ຫຼື ພິມຫົວໜ່ວຍອື່ນໆ (ເຊັ່ນ: ມ້ວນ, ຫຼອດ, ຄູ່...)"
                      className="h-8.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-emerald-950 outline-none focus:border-emerald-600 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Cost Price & Selling Price (2 clean columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Cost Price */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ລາຄາຕົ້ນທຶນ (₭)
                    </label>
                    <KipCurrencyInput
                      value={formData.cost_price || 0}
                      onValueChange={(val) =>
                        setFormData((p) => ({
                          ...p,
                          cost_price: val,
                        }))
                      }
                      placeholder="0"
                      className="h-9 text-xs font-semibold text-slate-700"
                    />
                  </div>

                  {/* Base Retail Selling Price */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ລາຄາຂາຍຍ່ອຍ (₭) <span className="text-rose-500">*</span>
                    </label>
                    <KipCurrencyInput
                      required
                      value={formData.selling_price || 0}
                      onValueChange={(val) => handleBasePriceChange(val)}
                      placeholder="0"
                      className="h-9 border-emerald-500 text-xs font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Profit Margin Preview Bar */}
                <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span>ກຳໄລຄາດຄະເນ (Margin):</span>
                  </span>
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

              {/* 2. Multi-Unit Packaging Area */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-4">
                <ProductUnitBuilder
                  baseUnit={formData.base_unit}
                  basePrice={formData.selling_price}
                  baseBarcode={formData.barcode}
                  isWeighing={formData.is_weighing}
                  units={formData.units}
                  onChange={(updatedUnits) =>
                    setFormData((p) => ({ ...p, units: updatedUnits }))
                  }
                />
              </div>

              {/* 3. Initial Stock Block (Only in Create Mode - Clean Single Row) */}
              {!product && (
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4">
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
                      {initialQuantity > 0 && selectedInitialUnit.conversion_rate > 1 && (
                        <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                          ={totalBaseUnits} {formData.base_unit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Sticky Footer Action Bar */}
        <div className="flex h-16 items-center justify-between border-t border-zinc-200/90 bg-zinc-50 px-6 shrink-0">
          {/* Left: Delete Product button (only in Edit mode) */}
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

          {/* Form Error Notice */}
          <div className="flex-1 min-w-0 px-4">
            {formError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold truncate">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span className="truncate">{formError}</span>
              </div>
            )}
          </div>

          {/* Cancel & Submit Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && !deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>
                {isSubmitting && !deleteMutation.isPending
                  ? "ກຳລັງບັນທຶກ..."
                  : "ບັນທຶກຂໍ້ມູນສິນຄ້າ"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

/**
 * Centered Dialog Modal Container
 * Uses key prop pattern on ProductFormContent for pure Zero-useEffect remounting
 */
export function ProductFormSheet(props?: ProductFormSheetProps) {
  const storeIsOpen = useProductStore((s) => s.isFormSheetOpen);
  const storeEditingProduct = useProductStore((s) => s.editingProduct);
  const storeCloseForm = useProductStore((s) => s.closeFormSheet);

  const isFormOpen = props?.isOpen !== undefined ? props.isOpen : storeIsOpen;
  const editingProduct =
    props?.product !== undefined ? props.product : storeEditingProduct;
  const closeForm = props?.onClose || storeCloseForm;

  const { categories } = useCategories();

  if (!isFormOpen) return null;

  // React key reset: Every time product ID or open state changes, mount fresh state cleanly!
  const contentKey = `${editingProduct?.id || "create-new"}-${isFormOpen}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none"
    >
      {/* Centered Spacious 2-Column Dialog Modal (max-w-5xl sm:max-w-[1040px] w-[96vw] max-h-[92vh]) */}
      <div className="relative w-full max-w-5xl sm:max-w-[1040px] w-[96vw] max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
        <ProductFormContent
          key={contentKey}
          product={editingProduct}
          categories={categories}
          onClose={closeForm}
          onSuccess={props?.onSuccess}
        />
      </div>
    </div>
  );
}
