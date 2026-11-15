"use client";

// ============================================================================
// MultiProductGRNForm: Full-Width 1-Column Workspace (Flat UI, No Gradient)
// Enterprise Goods Receipt Note (GRN) with Realtime Dual-Currency (THB ฿ & LAK ₭)
// 7-Column Full Table (No Right Clipping), 3-Tier Mobile Card & FEFO Batch Controls
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  PackagePlus,
  Save,
  Loader2,
  ScanBarcode,
  Calendar,
  AlertCircle,
  Building2,
  FileText,
  Search,
  Camera,
  Edit3,
  CheckCircle2,
  ArrowRightLeft,
  Coins,
  Plus,
  Check,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { useInventoryStore } from "../stores/inventory.store";
import { useStockMutations } from "../hooks/useStockMutations";
import {
  StockInItemFormData,
  StockInFormData,
  InventoryProductItem,
} from "../types/inventory.types";
import { generateDefaultBatchNumber } from "../utils/inventory.util";
import { formatLak } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";
import { ProductThumbnail } from "@/features/pos/components/ProductThumbnail";
import { useCategories } from "@/features/categories";
import { useAuthStore } from "@/features/auth/stores/auth.store";

export type PaymentStatus = "paid" | "unpaid" | "partial";

// Extended item form data to support dual-currency calculations
export interface GRNItemRow extends StockInItemFormData {
  cost_thb: number;
}

const DEFAULT_EXCHANGE_RATE = 720; // 1 THB = 720 LAK

const COMMON_SUPPLIERS = [
  "ບໍລິສັດ ເບຍລາວ ຈຳກັດ (Lao Brewery)",
  "ບໍລິສັດ ດີເຄເອັສເອັຊ ລາວ (DKSH Lao)",
  "ບໍລິສັດ ຊີພີ ລາວ ຈຳກັດ (CP Laos)",
  "ບໍລິສັດ ຢູນິລີເວີ ລາວ (Unilever Laos)",
  "ບໍລິສັດ ໂຄຄາ-ໂຄລາ ລາວ (Coca-Cola)",
  "ຕະຫຼາດເຊົ້າ / ຮ້ານຂາຍສົ່ງຫຼວງ",
];

export function MultiProductGRNForm() {
  const isStockInOpen = useInventoryStore((s) => s.isStockInOpen);
  const closeStockIn = useInventoryStore((s) => s.closeStockIn);
  const itemsCatalog = useInventoryStore((s) => s.items);
  const loadInventory = useInventoryStore((s) => s.loadInventory);
  const initialProductId = useInventoryStore((s) => s.initialProductIdForStockIn);
  const currentUser = useAuthStore((s) => s.user);

  const { categories } = useCategories();
  const { createStockIn, isSubmitting, errorMessage, clearError } =
    useStockMutations();

  // 1. PO Metadata
  const [poCode, setPoCode] = useState(() => `PO-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-001`);
  const [supplierName, setSupplierName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [notes, setNotes] = useState("");
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");

  // 2. Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 3. Receipt Lines
  const [grnItems, setGrnItems] = useState<GRNItemRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // 4. Modals / Popovers
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Set default receiver name from auth session
  useEffect(() => {
    if (currentUser?.full_name_lo || currentUser?.username) {
      setReceiverName(currentUser.full_name_lo || currentUser.username || "");
    } else {
      setReceiverName("ຜູ້ຈັດການສາງ (Store Manager)");
    }
  }, [currentUser]);

  // Reset form on close
  const handleClose = () => {
    if (isSubmitting) return;
    setGrnItems([]);
    setSupplierName("");
    setNotes("");
    setSearchQuery("");
    setIsSearchOpen(false);
    setFormError(null);
    clearError();
    closeStockIn();
  };

  // Helper to add or increment a product line
  const addOrIncrementProduct = (
    product: InventoryProductItem,
    preferredMode?: "pack" | "base"
  ) => {
    const packUnit = product.units?.find((u) => !u.is_base_unit && u.conversion_rate > 1);
    const hasPack = Boolean(packUnit);

    const usePack = preferredMode ? preferredMode === "pack" && hasPack : hasPack;
    const selectedUnitName = usePack && packUnit ? packUnit.unit_name : product.base_unit;
    const conversionRate = usePack && packUnit ? packUnit.conversion_rate : 1;
    const initialUnitCostLak = (product.latest_cost_price || 0) * conversionRate;
    const initialUnitCostThb = Math.round(initialUnitCostLak / exchangeRate);

    const existingIndex = grnItems.findIndex((i) => i.product_id === product.id);

    if (existingIndex >= 0) {
      const updated = [...grnItems];
      const existing = updated[existingIndex];

      if (preferredMode === "pack" && hasPack && existing.conversion_rate === 1) {
        existing.selected_unit_name = packUnit!.unit_name;
        existing.conversion_rate = packUnit!.conversion_rate;
        existing.input_cost_price = (product.latest_cost_price || 0) * packUnit!.conversion_rate;
        existing.cost_thb = Math.round(existing.input_cost_price / exchangeRate);
        existing.input_quantity += 1;
        existing.total_base_quantity = existing.input_quantity * existing.conversion_rate;
      } else {
        existing.input_quantity += 1;
        existing.total_base_quantity = existing.input_quantity * existing.conversion_rate;
      }

      setGrnItems(updated);
    } else {
      const newItem: GRNItemRow = {
        id: crypto.randomUUID(),
        product_id: product.id,
        product_name: product.name_lo,
        barcode: product.barcode,
        base_unit: product.base_unit,
        selected_unit_name: selectedUnitName,
        conversion_rate: conversionRate,
        input_quantity: 1,
        total_base_quantity: conversionRate,
        input_cost_price: initialUnitCostLak,
        cost_thb: initialUnitCostThb,
        base_unit_cost: product.latest_cost_price || 0,
        batch_number: generateDefaultBatchNumber(),
        expiry_date: "",
        is_perishable: Boolean(product.is_perishable),
      };

      setGrnItems((prev) => [newItem, ...prev]);
    }

    setSearchQuery("");
    setIsSearchOpen(false);
    setFormError(null);
  };

  // Preload catalog and handle initial product ID
  useEffect(() => {
    if (!isStockInOpen) return;

    if (itemsCatalog.length === 0) {
      loadInventory();
      return;
    }

    if (initialProductId) {
      const alreadyHas = grnItems.some((item) => item.product_id === initialProductId);
      if (!alreadyHas) {
        const product = itemsCatalog.find((p) => p.id === initialProductId);
        if (product) {
          addOrIncrementProduct(product);
        }
      }
    }
  }, [isStockInOpen, initialProductId, itemsCatalog.length]);

  // Autofocus search on open
  useEffect(() => {
    if (isStockInOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isStockInOpen]);

  if (!isStockInOpen) return null;

  // Handle Search Input Keydown (Barcode Scan Enter support)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      const code = searchQuery.trim().toLowerCase();

      // 1. Try matching secondary pack barcode directly
      for (const p of itemsCatalog) {
        const packUnit = p.units?.find(
          (u) =>
            !u.is_base_unit &&
            u.barcode &&
            u.barcode.trim().toLowerCase() === code
        );
        if (packUnit) {
          addOrIncrementProduct(p, "pack");
          return;
        }
      }

      // 2. Try matching base product barcode
      const foundByBaseBarcode = itemsCatalog.find(
        (p) => p.barcode && p.barcode.trim().toLowerCase() === code
      );
      if (foundByBaseBarcode) {
        addOrIncrementProduct(foundByBaseBarcode, "base");
        return;
      }

      // 3. Fallback: match first product by name
      const foundByName = itemsCatalog.find(
        (p) =>
          p.name_lo.toLowerCase().includes(code) ||
          (p.name_en && p.name_en.toLowerCase().includes(code))
      );
      if (foundByName) {
        addOrIncrementProduct(foundByName);
      }
    }
  };

  // Filter products for autocomplete dropdown
  const filteredProducts = searchQuery.trim()
    ? itemsCatalog
        .filter((p) => {
          const matchesCat =
            selectedCategory === "all" || p.category_id === selectedCategory;
          if (!matchesCat) return false;

          const q = searchQuery.toLowerCase();
          return (
            p.name_lo.toLowerCase().includes(q) ||
            (p.name_en && p.name_en.toLowerCase().includes(q)) ||
            p.barcode.toLowerCase().includes(q)
          );
        })
        .slice(0, 8)
    : [];

  // Toggle unit mode between Base Unit (1x) and Pack Unit (Nx)
  const handleToggleUnitMode = (index: number, mode: "base" | "pack") => {
    const updated = [...grnItems];
    const item = { ...updated[index] };
    const product = itemsCatalog.find((p) => p.id === item.product_id);
    if (!product) return;

    const packUnit = product.units?.find((u) => !u.is_base_unit && u.conversion_rate > 1);

    if (mode === "pack" && packUnit) {
      item.selected_unit_name = packUnit.unit_name;
      item.conversion_rate = packUnit.conversion_rate;
      item.input_cost_price = (product.latest_cost_price || 0) * packUnit.conversion_rate;
      item.cost_thb = Math.round(item.input_cost_price / exchangeRate);
    } else {
      item.selected_unit_name = product.base_unit;
      item.conversion_rate = 1;
      item.input_cost_price = product.latest_cost_price || 0;
      item.cost_thb = Math.round(item.input_cost_price / exchangeRate);
    }

    item.total_base_quantity = item.input_quantity * item.conversion_rate;
    item.base_unit_cost =
      item.conversion_rate > 0 ? Math.round(item.input_cost_price / item.conversion_rate) : 0;

    updated[index] = item;
    setGrnItems(updated);
  };

  // Update quantity
  const handleUpdateQuantity = (index: number, qty: number) => {
    const updated = [...grnItems];
    const item = { ...updated[index] };
    item.input_quantity = qty;
    item.total_base_quantity = qty * item.conversion_rate;
    updated[index] = item;
    setGrnItems(updated);
  };

  // Update THB cost -> auto convert to LAK
  const handleUpdateCostThb = (index: number, thb: number) => {
    const updated = [...grnItems];
    const item = { ...updated[index] };
    item.cost_thb = thb;
    item.input_cost_price = Math.round(thb * exchangeRate);
    item.base_unit_cost =
      item.conversion_rate > 0
        ? Math.round(item.input_cost_price / item.conversion_rate)
        : item.input_cost_price;
    updated[index] = item;
    setGrnItems(updated);
  };

  // Update LAK cost -> auto convert to THB
  const handleUpdateCostLak = (index: number, lak: number) => {
    const updated = [...grnItems];
    const item = { ...updated[index] };
    item.input_cost_price = lak;
    item.cost_thb = exchangeRate > 0 ? Math.round(lak / exchangeRate) : 0;
    item.base_unit_cost =
      item.conversion_rate > 0
        ? Math.round(lak / item.conversion_rate)
        : lak;
    updated[index] = item;
    setGrnItems(updated);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setGrnItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update batch & expiry from edit modal
  const handleSaveItemEdit = (batchNumber: string, expiryDate: string) => {
    if (editingItemIndex === null) return;
    const updated = [...grnItems];
    updated[editingItemIndex].batch_number = batchNumber;
    updated[editingItemIndex].expiry_date = expiryDate;
    setGrnItems(updated);
    setEditingItemIndex(null);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (grnItems.length === 0) {
      setFormError("ກະລຸນາເລືອກ ຫຼື ສະແກນສິນຄ້າຢ່າງໜ້ອຍ 1 ລາຍການ");
      return;
    }

    for (const item of grnItems) {
      if (item.input_quantity <= 0) {
        setFormError(`ຈຳນວນນຳເຂົ້າຂອງ "${item.product_name}" ຕ້ອງໃຫຍ່ກວ່າ 0`);
        return;
      }
      if (item.is_perishable && !item.expiry_date?.trim()) {
        setFormError(`ກະລຸນາເລືອກວັນໝົດອາຍຸຂອງ "${item.product_name}" (ສິນຄ້າຕິດຕາມ FEFO)`);
        return;
      }
    }

    const payload: StockInFormData = {
      supplier_name: supplierName.trim() || undefined,
      invoice_ref: poCode.trim() || undefined,
      notes: notes.trim()
        ? `${notes.trim()} | ສະຖານະ: ${paymentStatus.toUpperCase()} | ອັດຕາແລກປ່ຽນ: 1฿=${exchangeRate}₭ | ຜູ້ກວດຮັບ: ${receiverName}`
        : `ສະຖານະ: ${paymentStatus.toUpperCase()} | ອັດຕາແລກປ່ຽນ: 1฿=${exchangeRate}₭ | ຜູ້ກວດຮັບ: ${receiverName}`,
      items: grnItems,
    };

    const success = await createStockIn(payload);
    if (success) {
      handleClose();
    }
  };

  // Totals
  const totalCostLak = grnItems.reduce(
    (sum, item) => sum + item.input_cost_price * item.input_quantity,
    0
  );
  const totalCostThb = exchangeRate > 0 ? Math.round(totalCostLak / exchangeRate) : 0;
  const totalBaseUnits = grnItems.reduce((sum, item) => sum + item.total_base_quantity, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none overflow-y-auto p-0 sm:p-2 lg:p-4"
    >
      {/* FULL-WIDTH CONTAINER: 100% flat background, zero gradient, zero clipping */}
      <div className="relative w-full min-h-full sm:min-h-0 sm:my-auto rounded-none sm:rounded-2xl bg-slate-50 flex flex-col overflow-hidden border border-slate-200 shadow-2xl">
        {/* ================================================================= */}
        {/* HEADER BAR: Crisp Modern Retail Topbar                            */}
        {/* ================================================================= */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm lg:text-base font-extrabold text-slate-900 leading-tight">
                  ໃບຮັບສິນຄ້າເຂົ້າສາງ (Goods Receipt Note - GRN)
                </h2>
                <span className="hidden sm:inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Full-Width
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                ຕາຕະລາງນຳເຂົ້າສິນຄ້າເຕັມຈໍ, ຄຳນວນຕົ້ນທຶນ 2 ສະກຸນເງິນ (฿ & ₭) ແລະ ຕັດລັອດ FEFO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Exchange Rate Pill */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-slate-500 font-medium">1 ฿ =</span>
              {isEditingRate ? (
                <input
                  type="number"
                  min="1"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  onBlur={() => setIsEditingRate(false)}
                  autoFocus
                  className="w-14 rounded border border-emerald-500 bg-white px-1 py-0.5 text-center font-bold text-slate-900 outline-none text-xs"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingRate(true)}
                  className="font-extrabold text-slate-900 hover:text-emerald-700 underline decoration-dotted cursor-pointer"
                  title="ກົດເພື່ອປ່ຽນອັດຕາແລກປ່ຽນ"
                >
                  {exchangeRate.toLocaleString()} ₭
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              title="ປິດ"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MAIN BODY: 3 Tiers Stacking Vertically Full-Width                 */}
        {/* ================================================================= */}
        <div className="w-full px-4 lg:px-6 py-4 flex-1 overflow-y-auto space-y-4">
          {/* --------------------------------------------------------------- */}
          {/* TẦNG 1: Thanh Thông Tin Nhà Cung Cấp Siêu Gọn (1 Hàng Ngang)     */}
          {/* --------------------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* 1. Mã phiếu (PO Code) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>ລະຫັດໃບສັ່ງຊື້ (PO Code)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={poCode}
                    onChange={(e) => setPoCode(e.target.value)}
                    placeholder="PO-2026..."
                    className="h-8.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* 2. Nhà cung cấp (Supplier) + Nút quản lý */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>ຮ້ານສົ່ງ (Supplier)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(true)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    <span>ຈັດການຮ້ານສົ່ງ</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="ເຊັ່ນ: ບໍລິສັດ ເບຍລາວ..."
                  className="h-8.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 transition-colors"
                />
              </div>

              {/* 3. Người nhận (Receiver *) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                  <span>ຜູ້ກວດຮັບ (Receiver *)</span>
                </label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="ຊື່ພະນັກງານກວດຮັບ..."
                  className="h-8.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 transition-colors"
                />
              </div>

              {/* 4. Ghi chú (Note) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">ໝາຍເຫດ (Note)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ລາຍລະອຽດ ຫຼື ຂໍ້ຄວາມເພີ່ມເຕີມ..."
                  className="h-8.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {(formError || errorMessage) && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-bold shrink-0">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{formError || errorMessage}</span>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TẦNG 2: Khối Tìm Kiếm & Bảng Hàng Nhập Tràn Viền (Đủ 7 Cột)       */}
          {/* --------------------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {/* Header Thẻ: Thanh Tìm Kiếm + Lọc Danh Mục + Quét Camera */}
            <div className="p-3 lg:p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Autocomplete Search Bar */}
              <div className="relative flex-1 w-full">
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3 flex items-center text-emerald-600">
                    <ScanBarcode className="h-4.5 w-4.5" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="ຍິງບາໂຄດ ຫຼື ພິມຊື່ສິນຄ້າ, ລະຫັດ SKU ແລ້ວກົດ Enter..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-24 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-400 transition-colors"
                  />
                  <div className="absolute right-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    <Search className="h-3 w-3" />
                    <span>ພ້ອມຍິງບາໂຄດ</span>
                  </div>
                </div>

                {/* Autocomplete Suggestions */}
                {isSearchOpen && filteredProducts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {filteredProducts.map((p) => {
                      const packUnit = p.units?.find((u) => !u.is_base_unit && u.conversion_rate > 1);
                      return (
                        <div
                          key={p.id}
                          onClick={() => addOrIncrementProduct(p)}
                          className="flex items-center justify-between p-2.5 hover:bg-emerald-50/70 border-b border-slate-100 last:border-0 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-900 truncate">
                              {p.name_lo}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ບາໂຄດ: {p.barcode} | ຫົວໜ່ວຍ: {p.base_unit}
                              {packUnit && ` / ${packUnit.unit_name} (x${packUnit.conversion_rate})`}
                            </div>
                          </div>
                          <div className="text-right pl-3 shrink-0">
                            <span className="text-[11px] font-bold text-slate-700 block">
                              ທຶນ: {formatLak(p.latest_cost_price || 0)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ຄົງເຫຼືອ: {p.total_stock} {p.base_unit}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Category Filter & Camera Button */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 flex-1 md:flex-initial"
                >
                  <option value="all">ທຸກໝວດໝູ່ ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_lo}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                  title="ສະແກນຜ່ານກ້ອງຖ່າຍຮູບ"
                >
                  <Camera className="h-4 w-4 text-emerald-600" />
                  <span>ສະແກນກ້ອງ</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {grnItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-2 border border-emerald-100">
                  <ScanBarcode className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  ຍັງບໍ່ທັນມີລາຍການສິນຄ້າໃນໃບຮັບ
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  ໃຊ້ເຄື່ອງສະແກນຍິງບາໂຄດເທິງກ່ອງ/ແພັກ ຫຼື ພິມຊື່ສິນຄ້າໃນຊ່ອງຄົ້ນຫາດ້ານເທິງເພື່ອເພີ່ມລາຍການ
                </p>
              </div>
            ) : (
              <>
                {/* 1. Desktop & iPad Table (7 Columns Full-Width, No Cutoff) */}
                <div className="hidden md:block overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 min-w-[220px]">ຮູບ & ຊື່ສິນຄ້າ</th>
                        <th className="py-3 px-3 text-center w-[150px]">ຫົວໜ່ວຍນຳເຂົ້າ</th>
                        <th className="py-3 px-3 text-center w-[120px]">ຈຳນວນ</th>
                        <th className="py-3 px-3 text-right w-[120px]">ຕົ້ນທຶນ ฿</th>
                        <th className="py-3 px-3 text-right w-[130px]">ຕົ້ນທຶນ ₭</th>
                        <th className="py-3 px-4 text-right w-[140px]">ລວມເງິນ ₭</th>
                        <th className="py-3 px-3 text-center w-[90px]">ຈັດການ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grnItems.map((item, index) => {
                        const product = itemsCatalog.find((p) => p.id === item.product_id);
                        const packUnit = product?.units?.find(
                          (u) => !u.is_base_unit && u.conversion_rate > 1
                        );
                        const hasPack = Boolean(packUnit);
                        const isPackSelected = item.conversion_rate > 1;
                        const lineTotalCostLak = item.input_cost_price * item.input_quantity;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            {/* 1. Hình & Tên sản phẩm */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <ProductThumbnail
                                  src={product?.image_url}
                                  alt={item.product_name}
                                  name={item.product_name}
                                  className="h-10 w-10 rounded-xl bg-slate-50 shrink-0 border border-slate-200/70"
                                  imgClassName="w-full h-full object-contain p-1"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 leading-snug line-clamp-1">
                                    {item.product_name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span>{item.barcode}</span>
                                    {item.is_perishable && (
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                        item.expiry_date
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-amber-50 text-amber-700 border border-amber-200"
                                      }`}>
                                        FEFO: {item.expiry_date || "ຍັງບໍ່ກຳນົດ"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Đơn vị nhập kho: [ Lẻ (1x) | Pack (xN) ] */}
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleToggleUnitMode(index, "base")}
                                  className={`rounded-md px-2 py-1 text-[10.5px] font-bold transition-all cursor-pointer ${
                                    !isPackSelected
                                      ? "bg-white text-emerald-800 shadow-2xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  {item.base_unit} (1x)
                                </button>

                                {hasPack ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUnitMode(index, "pack")}
                                    className={`rounded-md px-2 py-1 text-[10.5px] font-bold transition-all cursor-pointer ${
                                      isPackSelected
                                        ? "bg-emerald-600 text-white shadow-2xs"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                                  >
                                    {packUnit?.unit_name || "ແພັກ"} (x{packUnit?.conversion_rate})
                                  </button>
                                ) : (
                                  <span
                                    className="px-1.5 py-1 text-[9.5px] text-slate-400 font-medium select-none"
                                    title="ສິນຄ້ານີ້ບໍ່ມີແພັກ"
                                  >
                                    ບໍ່ມີແພັກ
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 3. Số lượng: [-] [Input] [+] */}
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center h-8 rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs focus-within:border-emerald-600">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextVal = Math.max(1, (Number(item.input_quantity) || 1) - 1);
                                    handleUpdateQuantity(index, nextVal);
                                  }}
                                  className="flex h-full w-6.5 items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 font-bold cursor-pointer border-r border-slate-200"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.input_quantity === 0 ? "" : item.input_quantity}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === ""
                                        ? 0
                                        : Math.max(0, parseInt(e.target.value, 10) || 0);
                                    handleUpdateQuantity(index, val);
                                  }}
                                  onBlur={() => {
                                    if (!item.input_quantity || item.input_quantity < 1) {
                                      handleUpdateQuantity(index, 1);
                                    }
                                  }}
                                  placeholder="1"
                                  className="h-full w-12 text-center text-xs font-black text-slate-900 outline-none tabular-nums px-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextVal = (Number(item.input_quantity) || 0) + 1;
                                    handleUpdateQuantity(index, nextVal);
                                  }}
                                  className="flex h-full w-6.5 items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 font-bold cursor-pointer border-l border-slate-200"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* 4. Giá vốn ฿ (Thai Baht) */}
                            <td className="py-3 px-3 text-right">
                              <div className="relative inline-flex items-center">
                                <span className="absolute left-2 text-[11px] font-bold text-amber-500">
                                  ฿
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.cost_thb === 0 ? "" : item.cost_thb}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === ""
                                        ? 0
                                        : Math.max(0, parseFloat(e.target.value) || 0);
                                    handleUpdateCostThb(index, val);
                                  }}
                                  placeholder="0"
                                  className="h-8 w-24 rounded-lg border border-slate-200 bg-white pl-6 pr-2 text-right text-xs font-extrabold text-slate-900 outline-none focus:border-emerald-600 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </td>

                            {/* 5. Giá vốn ₭ (Lao Kip) */}
                            <td className="py-3 px-3 text-right">
                              <KipCurrencyInput
                                value={item.input_cost_price || 0}
                                onValueChange={(val) => handleUpdateCostLak(index, val)}
                                className="h-8 w-28 text-xs font-extrabold text-slate-900 text-right bg-white rounded-lg border border-slate-200"
                              />
                              {item.conversion_rate > 1 && (
                                <div className="text-[9.5px] text-slate-400 mt-0.5">
                                  @{formatLak(item.base_unit_cost, false)}/{item.base_unit}
                                </div>
                              )}
                            </td>

                            {/* 6. Thành tiền ₭ */}
                            <td className="py-3 px-4 text-right">
                              <div className="font-extrabold text-slate-900 text-[13px] tabular-nums">
                                {formatLak(lineTotalCostLak)}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-700 tabular-nums mt-0.5">
                                +{item.total_base_quantity} {item.base_unit}
                              </div>
                            </td>

                            {/* 7. Quản lý (Sửa FEFO / Xóa) */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingItemIndex(index)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                                  title="ແກ້ໄຂລັອດ & ວັນໝົດອາຍຸ"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                                  title="ລຶບລາຍການ"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 2. Mobile Responsive Card List (3 Tầng Dễ Chạm) */}
                <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                  {grnItems.map((item, index) => {
                    const product = itemsCatalog.find((p) => p.id === item.product_id);
                    const packUnit = product?.units?.find(
                      (u) => !u.is_base_unit && u.conversion_rate > 1
                    );
                    const hasPack = Boolean(packUnit);
                    const isPackSelected = item.conversion_rate > 1;
                    const lineTotalCostLak = item.input_cost_price * item.input_quantity;

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-xs"
                      >
                        {/* Tầng 1: Thumbnail + Tên + Barcode + Nút xóa */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ProductThumbnail
                              src={product?.image_url}
                              alt={item.product_name}
                              name={item.product_name}
                              className="h-10 w-10 rounded-lg bg-slate-50 shrink-0 border border-slate-200/70"
                              imgClassName="w-full h-full object-contain p-1"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-xs text-slate-900 truncate">
                                {item.product_name}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {item.barcode}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingItemIndex(index)}
                              className="h-7 w-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="h-7 w-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Tầng 2: Chọn đơn vị + Stepper số lượng */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          {/* Unit toggle */}
                          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                            <button
                              type="button"
                              onClick={() => handleToggleUnitMode(index, "base")}
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                !isPackSelected
                                  ? "bg-white text-emerald-800 shadow-2xs"
                                  : "text-slate-600"
                              }`}
                            >
                              {item.base_unit} (1x)
                            </button>
                            {hasPack && (
                              <button
                                type="button"
                                onClick={() => handleToggleUnitMode(index, "pack")}
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  isPackSelected
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "text-slate-600"
                                }`}
                              >
                                {packUnit?.unit_name} (x{packUnit?.conversion_rate})
                              </button>
                            )}
                          </div>

                          {/* Stepper */}
                          <div className="inline-flex items-center h-7 rounded-lg border border-slate-200 bg-white">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(index, Math.max(1, item.input_quantity - 1))}
                              className="h-full w-6 flex items-center justify-center font-bold text-slate-600 bg-slate-50 border-r border-slate-200"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-black text-slate-900 tabular-nums">
                              {item.input_quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(index, item.input_quantity + 1)}
                              className="h-full w-6 flex items-center justify-center font-bold text-slate-600 bg-slate-50 border-l border-slate-200"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Tầng 3: Giá vốn ฿ & ₭ + Thành tiền */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="text-[11px] font-bold text-amber-600">
                              ฿ {item.cost_thb.toLocaleString()}
                            </div>
                            <span className="text-slate-300">|</span>
                            <div className="text-[11px] font-extrabold text-slate-900">
                              {formatLak(item.input_cost_price)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-extrabold text-slate-900 tabular-nums">
                              {formatLak(lineTotalCostLak)}
                            </div>
                            <div className="text-[9.5px] font-bold text-emerald-700">
                              +{item.total_base_quantity} {item.base_unit}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* --------------------------------------------------------------- */}
          {/* TẦNG 3: Thanh Tổng Kết Thanh Toán & Nút Lưu Nằm Ngang Gọn Gàng   */}
          {/* --------------------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Bên trái (lg:col-span-5): 2 ô tổng tiền LAK & THB */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">
                    ຍອດລວມ ₭ (LAK)
                  </div>
                  <div className="text-base lg:text-lg font-black text-slate-900 tabular-nums mt-0.5">
                    {formatLak(totalCostLak)}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                    +{totalBaseUnits} {grnItems.length > 0 ? "ໜ່ວຍເຂົ້າສາງ" : "ໜ່ວຍ"}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">
                    ຍອດລວມ ฿ (THB)
                  </div>
                  <div className="text-base lg:text-lg font-black text-amber-600 tabular-nums mt-0.5">
                    ฿ {totalCostThb.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    ອັດຕາ: 1 ฿ = {exchangeRate} ₭
                  </div>
                </div>
              </div>

              {/* Ở giữa (lg:col-span-4): 3 nút trạng thái thanh toán với layoutId trượt mượt */}
              <div className="lg:col-span-4 flex flex-col justify-center">
                <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">
                  ສະຖານະການຊຳລະເງິນ (Payment Status)
                </label>
                <div className="relative flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                  {(
                    [
                      { key: "paid", label: "ຈ່າຍຄົບ" },
                      { key: "unpaid", label: "ຄ້າງຊຳລະ" },
                      { key: "partial", label: "ຈ່າຍບາງສ່ວນ" },
                    ] as const
                  ).map((st) => {
                    const isActive = paymentStatus === st.key;
                    return (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setPaymentStatus(st.key)}
                        className={`relative flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-colors cursor-pointer z-10 ${
                          isActive
                            ? "text-slate-900"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="grnPaymentStatusActivePill"
                            className="absolute inset-0 rounded-lg bg-white shadow-2xs -z-10"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
                          />
                        )}
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bên phải (lg:col-span-3): Nút lưu chính to rõ, dễ bấm */}
              <div className="lg:col-span-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  ຍົກເລີກ
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || grnItems.length === 0}
                  className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isSubmitting ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກໃບຮັບສິນຄ້າ"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: Edit FEFO Batch & Expiry Date for Item                     */}
      {/* =================================================================== */}
      {editingItemIndex !== null && grnItems[editingItemIndex] && (
        <ItemBatchEditModal
          item={grnItems[editingItemIndex]}
          onSave={handleSaveItemEdit}
          onClose={() => setEditingItemIndex(null)}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL 2: Supplier Selection & Management                            */}
      {/* =================================================================== */}
      {isSupplierModalOpen && (
        <SupplierManagerModal
          currentSupplier={supplierName}
          onSelect={(name) => {
            setSupplierName(name);
            setIsSupplierModalOpen(false);
          }}
          onClose={() => setIsSupplierModalOpen(false)}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL 3: Camera Barcode Scanner Simulator                           */}
      {/* =================================================================== */}
      {isCameraScannerOpen && (
        <CameraScannerModal
          itemsCatalog={itemsCatalog}
          onScan={(code) => {
            const found = itemsCatalog.find(
              (p) => p.barcode && p.barcode.trim().toLowerCase() === code.trim().toLowerCase()
            );
            if (found) {
              addOrIncrementProduct(found);
            }
            setIsCameraScannerOpen(false);
          }}
          onClose={() => setIsCameraScannerOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Submodal 1: Item Batch & Expiry Date Edit Modal
// ============================================================================
interface ItemBatchEditModalProps {
  item: GRNItemRow;
  onSave: (batchNumber: string, expiryDate: string) => void;
  onClose: () => void;
}

function ItemBatchEditModal({ item, onSave, onClose }: ItemBatchEditModalProps) {
  const [batchNumber, setBatchNumber] = useState(item.batch_number || generateDefaultBatchNumber());
  const [expiryDate, setExpiryDate] = useState(item.expiry_date || "");

  const handleAddDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiryDate(d.toISOString().split("T")[0]);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                ກຳນົດລັອດ & ວັນໝົດອາຍຸ (FEFO)
              </h3>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[240px]">
                {item.product_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ເລກລັອດສິນຄ້າ (Batch Number)
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="LOT-2026..."
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ວັນໝົດອາຍຸ (Expiry Date)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 cursor-pointer"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-medium">ເລືອກໄວ:</span>
              <button
                type="button"
                onClick={() => handleAddDays(30)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 cursor-pointer"
              >
                +30 ວັນ
              </button>
              <button
                type="button"
                onClick={() => handleAddDays(90)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 cursor-pointer"
              >
                +3 ເດືອນ
              </button>
              <button
                type="button"
                onClick={() => handleAddDays(180)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 cursor-pointer"
              >
                +6 ເດືອນ
              </button>
              <button
                type="button"
                onClick={() => handleAddDays(365)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 cursor-pointer"
              >
                +1 ປີ
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={() => onSave(batchNumber, expiryDate)}
            className="h-9 px-5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
          >
            ບັນທຶກ
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Submodal 2: Supplier Selection & Quick Add
// ============================================================================
interface SupplierManagerModalProps {
  currentSupplier: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}

function SupplierManagerModal({
  currentSupplier,
  onSelect,
  onClose,
}: SupplierManagerModalProps) {
  const [newSupplier, setNewSupplier] = useState("");

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                ເລືອກ / ຈັດການຮ້ານສົ່ງ (Supplier)
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                ເລືອກຮ້ານຄ້າສົ່ງທີ່ໃຊ້ປະຈຳ ຫຼື ພິມຊື່ຮ້ານໃໝ່
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Add Custom */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newSupplier}
            onChange={(e) => setNewSupplier(e.target.value)}
            placeholder="ພິມຊື່ຮ້ານສົ່ງໃໝ່..."
            className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-600"
          />
          <button
            type="button"
            disabled={!newSupplier.trim()}
            onClick={() => onSelect(newSupplier.trim())}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-40 cursor-pointer shadow-xs"
          >
            ເລືອກ
          </button>
        </div>

        {/* Common list */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ລາຍຊື່ຮ້ານສົ່ງທົ່ວໄປ
          </p>
          {COMMON_SUPPLIERS.map((s) => {
            const isSelected = currentSupplier === s;
            return (
              <div
                key={s}
                onClick={() => onSelect(s)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "border-slate-100 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>{s}</span>
                {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Submodal 3: Camera Barcode Scanner Modal
// ============================================================================
interface CameraScannerModalProps {
  itemsCatalog: InventoryProductItem[];
  onScan: (code: string) => void;
  onClose: () => void;
}

function CameraScannerModal({
  itemsCatalog,
  onScan,
  onClose,
}: CameraScannerModalProps) {
  const [manualCode, setManualCode] = useState("");

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                ສະແກນບາໂຄດດ້ວຍກ້ອງ
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                ກ້ອງພ້ອມສະແກນ ຫຼື ປ້ອນເລກບາໂຄດໂດຍກົງ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewfinder simulation */}
        <div className="relative aspect-4/3 w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center text-white overflow-hidden p-4">
          <div className="w-3/4 h-24 border-2 border-emerald-400 border-dashed rounded-lg flex items-center justify-center animate-pulse">
            <ScanBarcode className="h-10 w-10 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-300 font-medium mt-3 text-center">
            ຈໍ່ບາໂຄດສິນຄ້າໃຫ້ກົງກັບກອບສີຂຽວ
          </p>
        </div>

        {/* Manual Barcode Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && manualCode.trim()) {
                onScan(manualCode.trim());
              }
            }}
            placeholder="ປ້ອນບາໂຄດທົດສອບ..."
            className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-xs font-mono outline-none focus:border-emerald-600"
          />
          <button
            type="button"
            disabled={!manualCode.trim()}
            onClick={() => onScan(manualCode.trim())}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-40 cursor-pointer shadow-xs"
          >
            ສະແກນ
          </button>
        </div>
      </div>
    </div>
  );
}
