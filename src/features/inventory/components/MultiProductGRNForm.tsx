"use client";

// ============================================================================
// MultiProductGRNForm: Goods Receipt Note (GRN) - Focused & Compact Modal (max-w-5xl)
// Clean LAK Currency, FEFO Batch Tracking
// Metadata: ເລກທີບິນ (Auto-gen + Editable), ຮ້ານສົ່ງ (Supplier text input), ໝາຍເຫດ (Note)
// Rich Autocomplete Search Dropdown with Product Thumbnails, Expanded Height & z-index
// 100% Vector Lucide Icons - Zero Emoji
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  RefreshCw,
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
import { CameraBarcodeScannerModal } from "@/features/pos/components/CameraBarcodeScannerModal";
import { useCategories } from "@/features/categories";
import { toast } from "sonner";

const generateDefaultBillNumber = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `BILL-${yy}${mm}${dd}-${rand}`;
};

export function MultiProductGRNForm() {
  const isStockInOpen = useInventoryStore((s) => s.isStockInOpen);
  const closeStockIn = useInventoryStore((s) => s.closeStockIn);
  const itemsCatalog = useInventoryStore((s) => s.items);
  const loadInventory = useInventoryStore((s) => s.loadInventory);
  const initialProductId = useInventoryStore((s) => s.initialProductIdForStockIn);

  const { allCategories, categories } = useCategories();
  const displayCategories = allCategories && allCategories.length > 0 ? allCategories : categories;
  const { createStockIn, isSubmitting, errorMessage, clearError } =
    useStockMutations();

  // 1. Metadata: Bill number (auto-gen & editable), Supplier text input, Note
  const [billNumber, setBillNumber] = useState(generateDefaultBillNumber);
  const [supplierName, setSupplierName] = useState("");
  const [notes, setNotes] = useState("");

  // 2. Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Reset highlighted index when query or category changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, selectedCategory]);

  // 3. Receipt Lines
  const [grnItems, setGrnItems] = useState<StockInItemFormData[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // 4. Modals
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    const existingIndex = grnItems.findIndex((i) => i.product_id === product.id);

    if (existingIndex >= 0) {
      const updated = [...grnItems];
      const existing = updated[existingIndex];

      if (preferredMode === "pack" && hasPack && existing.conversion_rate === 1) {
        existing.selected_unit_name = packUnit!.unit_name;
        existing.conversion_rate = packUnit!.conversion_rate;
        existing.input_cost_price = (product.latest_cost_price || 0) * packUnit!.conversion_rate;
        existing.input_quantity += 1;
        existing.total_base_quantity = existing.input_quantity * existing.conversion_rate;
      } else {
        existing.input_quantity += 1;
        existing.total_base_quantity = existing.input_quantity * existing.conversion_rate;
      }

      setGrnItems(updated);
    } else {
      const newItem: StockInItemFormData = {
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
  }, [isStockInOpen, itemsCatalog.length, initialProductId]);

  // Keyboard shortcut: F1 to focus search bar
  useEffect(() => {
    if (!isStockInOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && !isCameraScannerOpen && editingItemIndex === null) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStockInOpen, isCameraScannerOpen, editingItemIndex]);

  // Filtered products for autocomplete search (expanded to 40 items)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim() && selectedCategory === "all") {
      return itemsCatalog.slice(0, 30);
    }

    const q = searchQuery.toLowerCase().trim();
    return itemsCatalog
      .filter((p) => {
        const matchesCategory =
          selectedCategory === "all" ||
          p.category_id === selectedCategory ||
          (p.category_name &&
            p.category_name.toLowerCase() === selectedCategory.toLowerCase());

        if (!matchesCategory) return false;
        if (!q) return true;

        const matchesBarcode = p.barcode.toLowerCase().includes(q);
        const matchesName = p.name_lo.toLowerCase().includes(q);
        const matchesPackBarcode = p.units?.some((u) =>
          u.barcode?.toLowerCase().includes(q)
        );

        return matchesBarcode || matchesName || matchesPackBarcode;
      })
      .slice(0, 40);
  }, [itemsCatalog, searchQuery, selectedCategory]);

  // Search keyboard navigation (Arrow keys + Enter + Esc)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsSearchOpen(true);
      setHighlightedIndex((prev) =>
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      return;
    }
    if (e.key === "Escape") {
      setIsSearchOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchQuery.trim();

      // If dropdown is open and user pressed enter on a highlighted item
      if (
        isSearchOpen &&
        filteredProducts.length > 0 &&
        highlightedIndex >= 0 &&
        highlightedIndex < filteredProducts.length
      ) {
        addOrIncrementProduct(filteredProducts[highlightedIndex]);
        return;
      }

      if (!query) return;

      const exactBarcode = itemsCatalog.find(
        (p) => p.barcode && p.barcode.toLowerCase() === query.toLowerCase()
      );

      if (exactBarcode) {
        addOrIncrementProduct(exactBarcode, "base");
        return;
      }

      const packBarcodeProduct = itemsCatalog.find((p) =>
        p.units?.some(
          (u) =>
            !u.is_base_unit &&
            u.barcode &&
            u.barcode.toLowerCase() === query.toLowerCase()
        )
      );

      if (packBarcodeProduct) {
        addOrIncrementProduct(packBarcodeProduct, "pack");
        return;
      }

      if (filteredProducts.length > 0) {
        addOrIncrementProduct(filteredProducts[0]);
      }
    }
  };

  // Optical camera barcode scan handler (Shared with POS)
  const handleCameraBarcodeDetected = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // 1. Check exact base product barcode
    const exactBarcode = itemsCatalog.find(
      (p) => p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()
    );

    if (exactBarcode) {
      addOrIncrementProduct(exactBarcode, "base");
      toast.success(`ເພີ່ມ "${exactBarcode.name_lo}" ເຂົ້າໃບຮັບແລ້ວ`);
      return;
    }

    // 2. Check pack barcode
    const packBarcodeProduct = itemsCatalog.find((p) =>
      p.units?.some(
        (u) =>
          !u.is_base_unit &&
          u.barcode &&
          u.barcode.toLowerCase() === trimmed.toLowerCase()
      )
    );

    if (packBarcodeProduct) {
      addOrIncrementProduct(packBarcodeProduct, "pack");
      toast.success(`ເພີ່ມ "${packBarcodeProduct.name_lo}" (ແພັກ) ເຂົ້າໃບຮັບແລ້ວ`);
      return;
    }

    toast.error(`ບໍ່ພົບສິນຄ້າທີ່ມີບາໂຄດ: ${trimmed}`);
  };

  // Toggle unit mode (base vs pack)
  const handleToggleUnitMode = (index: number, mode: "pack" | "base") => {
    const updated = [...grnItems];
    const item = { ...updated[index] };
    const product = itemsCatalog.find((p) => p.id === item.product_id);
    if (!product) return;

    const packUnit = product.units?.find((u) => !u.is_base_unit && u.conversion_rate > 1);

    if (mode === "pack" && packUnit) {
      item.selected_unit_name = packUnit.unit_name;
      item.conversion_rate = packUnit.conversion_rate;
      item.input_cost_price = (product.latest_cost_price || 0) * packUnit.conversion_rate;
    } else {
      item.selected_unit_name = product.base_unit;
      item.conversion_rate = 1;
      item.input_cost_price = product.latest_cost_price || 0;
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

  // Update LAK cost
  const handleUpdateCostLak = (index: number, lak: number) => {
    const updated = [...grnItems];
    const item = { ...updated[index] };
    item.input_cost_price = lak;
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
      invoice_ref: billNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      items: grnItems,
    };

    const success = await createStockIn(payload);
    if (success) {
      handleClose();
    }
  };

  // Totals in Kip (LAK)
  const totalCostLak = grnItems.reduce(
    (sum, item) => sum + item.input_cost_price * item.input_quantity,
    0
  );
  const totalBaseUnits = grnItems.reduce((sum, item) => sum + item.total_base_quantity, 0);

  if (!isStockInOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none p-2 sm:p-4 lg:p-6"
    >
      {/* FOCUSED MODAL CONTAINER: Fixed Height (h-[88vh] min-h-[560px] max-h-[88vh]) - 100% Stable */}
      <div className="relative w-full max-w-5xl h-[88vh] min-h-[560px] max-h-[88vh] rounded-2xl bg-slate-50 flex flex-col overflow-hidden border border-slate-200 shadow-2xl">
        {/* ================================================================= */}
        {/* HEADER BAR: Crisp Modern Retail Topbar                            */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
              <PackagePlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ໃບຮັບສິນຄ້າເຂົ້າສາງ (Goods Receipt Note - GRN)
              </h3>
              <p className="text-[10px] text-slate-500">
                ຕາຕະລາງນຳເຂົ້າສິນຄ້າ ແລະ ຕັດລັອດ FEFO
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            title="ປິດ"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* MAIN BODY: Form Stack                                             */}
        {/* ================================================================= */}
        <div className="w-full px-4 sm:px-6 py-3.5 flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden">
          {/* --------------------------------------------------------------- */}
          {/* TẦNG 1: Thông tin phiếu nhập (3 ô: Số phiếu, Nhà cung cấp, Ghi chú)*/}
          {/* --------------------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Mã phiếu / Số hóa đơn (Tự generate và tự nhập) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>ເລກທີບິນ (Bill / Invoice No.)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setBillNumber(generateDefaultBillNumber())}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    title="ສ້າງເລກບິນໃໝ່ອັດຕະໂນມັດ"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>ສ້າງເລກໃໝ່</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  placeholder="BILL-..."
                  className="h-8.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-600 transition-colors"
                />
              </div>

              {/* 2. Nhà cung cấp (Supplier) - Ô nhập thuần túy, không có nút modal */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>ຮ້ານສົ່ງ (Supplier)</span>
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="ເຊັ່ນ: ບໍລິສັດ ເບຍລາວ, ຮ້ານຂາຍສົ່ງ..."
                  className="h-8.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 transition-colors"
                />
              </div>

              {/* 3. Ghi chú (Note) */}
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
          {/* TẦNG 2: Khối Tìm Kiếm & Bảng Hàng Nhập (Fixed Flex-1 Layout)   */}
          {/* --------------------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs flex-1 flex flex-col min-h-0 relative">
            {/* Header Thẻ: Thanh Tìm Kiếm + Lọc Danh Mục + Quét Camera (shrink-0) */}
            <div className="p-3 sm:p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row items-center justify-between gap-3 relative z-30 rounded-t-2xl shrink-0">
              {/* Autocomplete Search Bar Container */}
              <div ref={searchContainerRef} className="relative flex-1 w-full">
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
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-24 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-2xs"
                  />
                  <div className="absolute right-2.5 flex items-center gap-1.5">
                    <span className="hidden sm:inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 border border-slate-200">
                      F1
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen((prev) => !prev)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Autocomplete Dropdown: Floating z-50, optimized height (max-h-72), product images, keyboard nav */}
                {isSearchOpen && (
                  <>
                    {filteredProducts.length > 0 ? (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in duration-100">
                        {/* Header bar inside dropdown */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-500 bg-slate-50/95 backdrop-blur-xs">
                          <span>ພົບ {filteredProducts.length} ລາຍການ</span>
                          <span className="text-slate-400 font-normal">ກົດ Enter ຫຼື ຄລິກເພື່ອເລືອກ</span>
                        </div>

                        <div className="p-1.5 space-y-0.5">
                          {filteredProducts.map((p, idx) => {
                            const packUnit = p.units?.find((u) => !u.is_base_unit && u.conversion_rate > 1);
                            const isSelected = highlightedIndex === idx;
                            return (
                              <div
                                key={p.id}
                                onClick={() => addOrIncrementProduct(p)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500/30"
                                    : "hover:bg-slate-50 text-slate-800"
                                }`}
                              >
                                {/* Product Thumbnail */}
                                <ProductThumbnail
                                  src={p.image_url}
                                  alt={p.name_lo}
                                  name={p.name_lo}
                                  className="h-9 w-9 rounded-xl bg-white shrink-0 border border-slate-200/80 overflow-hidden"
                                  imgClassName="w-full h-full object-contain p-0.5 mix-blend-multiply"
                                />

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                  <div className={`font-bold text-xs truncate ${isSelected ? "text-emerald-900" : "text-slate-900"}`}>
                                    {p.name_lo}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span>{p.barcode}</span>
                                    <span>•</span>
                                    <span>
                                      {p.base_unit}
                                      {packUnit ? ` (ແພັກ x${packUnit.conversion_rate})` : ""}
                                    </span>
                                  </div>
                                </div>

                                {/* Cost & Stock on Right */}
                                <div className="text-right pl-2 shrink-0">
                                  <span className="text-xs font-black text-emerald-700 block tabular-nums">
                                    {formatLak(p.latest_cost_price || 0)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 tabular-nums">
                                    ຄົງເຫຼືອ: {p.total_stock} {p.base_unit}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : searchQuery.trim() ? (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-2xl ring-1 ring-black/5 animate-in fade-in duration-100">
                        <AlertCircle className="h-5 w-5 text-slate-300 mx-auto mb-1" />
                        <div className="text-xs text-slate-600 font-semibold">
                          ບໍ່ພົບສິນຄ້າທີ່ກົງກັບ &quot;<span className="text-emerald-700">{searchQuery}</span>&quot;
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          ກະລຸນາກວດສອບຊື່ສິນຄ້າ ຫຼື ລະຫັດບາໂຄດຄືນໃໝ່
                        </p>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* Category Filter & Camera Button */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 flex-1 md:flex-initial cursor-pointer"
                >
                  <option value="all">ທຸກໝວດໝູ່ ({displayCategories.length})</option>
                  {displayCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_lo} {c.product_count !== undefined ? `(${c.product_count})` : ""}
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

            {/* Scrollable Table Area inside Card */}
            <div className="flex-1 overflow-y-auto min-h-0 rounded-b-2xl">
              {/* Empty State */}
              {grnItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[220px] py-16 text-center bg-white">
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
                  {/* 1. Desktop Table (6 Clean Columns with Sticky Header) */}
                  <div className="hidden md:block overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
                        <tr className="border-b border-slate-200 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                          <th className="py-3 px-4 min-w-[220px]">ຮູບ & ຊື່ສິນຄ້າ</th>
                          <th className="py-3 px-3 text-center w-[150px]">ຕົວໜ່ວຍນຳເຂົ້າ</th>
                          <th className="py-3 px-3 text-center w-[120px]">ຈຳນວນ</th>
                          <th className="py-3 px-3 text-right w-[140px]">ຕົ້ນທຶນ ₭</th>
                          <th className="py-3 px-4 text-right w-[150px]">ລວມເງິນ ₭</th>
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
                                  className="h-10 w-10 rounded-xl bg-white shrink-0 border border-slate-200/80 overflow-hidden"
                                  imgClassName="w-full h-full object-contain p-0.5 mix-blend-multiply"
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
                                  className="h-full w-12 text-center text-xs font-black text-slate-900 outline-none tabular-nums px-0.5 no-spin-button"
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

                            {/* 4. Giá vốn ₭ (Lao Kip) */}
                            <td className="py-3 px-3 text-right">
                              <KipCurrencyInput
                                value={item.input_cost_price || 0}
                                onValueChange={(val) => handleUpdateCostLak(index, val)}
                                className="h-8 w-32 text-xs font-extrabold text-slate-900 text-right bg-white rounded-lg border border-slate-200"
                              />
                              {item.conversion_rate > 1 && (
                                <div className="text-[9.5px] text-slate-400 mt-0.5">
                                  @{formatLak(item.base_unit_cost, false)}/{item.base_unit}
                                </div>
                              )}
                            </td>

                            {/* 5. Thành tiền ₭ */}
                            <td className="py-3 px-4 text-right">
                              <div className="font-extrabold text-slate-900 text-[13px] tabular-nums">
                                {formatLak(lineTotalCostLak)}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-700 tabular-nums mt-0.5">
                                +{item.total_base_quantity} {item.base_unit}
                              </div>
                            </td>

                            {/* 6. Quản lý (Sửa FEFO / Xóa) */}
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

                {/* 2. Mobile Responsive Card List */}
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

                        {/* Tầng 3: Giá vốn ₭ + Thành tiền */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                          <div className="text-[11px] font-extrabold text-slate-900">
                            {formatLak(item.input_cost_price)}
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
          </div>

          {/* --------------------------------------------------------------- */}
          {/* TẦNG 3: Thanh Tổng Kết & Nút Lưu Nằm Ngang Gọn Gàng             */}
          {/* --------------------------------------------------------------- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Bên trái: Tổng kết số lượng & tổng tiền KIP */}
              <div className="flex items-center gap-4 sm:gap-6 text-xs w-full sm:w-auto justify-between sm:justify-start">
                <div>
                  <span className="text-slate-400">ລາຍການ: </span>
                  <strong className="text-slate-800 tabular-nums font-bold">{grnItems.length}</strong>
                </div>
                <div>
                  <span className="text-slate-400">ຈຳນວນລວມ: </span>
                  <strong className="text-emerald-700 tabular-nums font-bold">
                    +{totalBaseUnits} {grnItems.length > 0 ? "ໜ່ວຍເຂົ້າສາງ" : "ໜ່ວຍ"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">ຍອດລວມທັງໝົດ: </span>
                  <strong className="text-emerald-700 text-sm sm:text-base tabular-nums font-black ml-1">
                    {formatLak(totalCostLak)}
                  </strong>
                </div>
              </div>

              {/* Bên phải: Nút Hủy và Nút Lưu */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  ຍົກເລີກ
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || grnItems.length === 0}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
      {/* SUBMODALS: Batch FEFO & Camera Scanner                              */}
      {/* =================================================================== */}
      {editingItemIndex !== null && grnItems[editingItemIndex] && (
        <ItemBatchEditModal
          item={grnItems[editingItemIndex]}
          onSave={handleSaveItemEdit}
          onClose={() => setEditingItemIndex(null)}
        />
      )}

      {/* Optical Camera Barcode Scanner Modal (Shared with POS) */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onBarcodeDetected={handleCameraBarcodeDetected}
      />
    </div>
  );
}

// ============================================================================
// Submodal 1: Item Batch & Expiry Date Edit Modal
// ============================================================================
interface ItemBatchEditModalProps {
  item: StockInItemFormData;
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
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ກຳນົດລັອດ & ວັນໝົດອາຍຸ (FEFO)
              </h3>
              <p className="text-[10px] text-slate-500 truncate max-w-[240px]">
                {item.product_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
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
