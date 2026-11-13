"use client";

// ============================================================================
// StockInSheet: Centered Modern Modal (max-w-5xl) - Compact Table Invoice Layout
// Strict 2-Tier Unit Architecture (Base Unit 1x & Pack Unit N)
// Smart Barcode Scanner & Search Autocomplete + Realtime Expiry Quick Select
// 100% Vector Lucide Icons - Zero Emoji
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
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

export function StockInSheet() {
  const isStockInOpen = useInventoryStore((s) => s.isStockInOpen);
  const closeStockIn = useInventoryStore((s) => s.closeStockIn);
  const itemsCatalog = useInventoryStore((s) => s.items);
  const loadInventory = useInventoryStore((s) => s.loadInventory);
  const initialProductId = useInventoryStore((s) => s.initialProductIdForStockIn);

  const { createStockIn, isSubmitting, errorMessage, clearError } =
    useStockMutations();

  // Receipt meta
  const [supplierName, setSupplierName] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [showMeta, setShowMeta] = useState(true);

  // Search input & scanner state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Receipt lines
  const [stockItems, setStockItems] = useState<StockInItemFormData[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    setStockItems([]);
    setSupplierName("");
    setInvoiceRef("");
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

    // Determine initial unit mode: pack by default if available, unless base explicitly chosen
    const usePack = preferredMode ? preferredMode === "pack" && hasPack : hasPack;
    const selectedUnitName = usePack && packUnit ? packUnit.unit_name : product.base_unit;
    const conversionRate = usePack && packUnit ? packUnit.conversion_rate : 1;
    const initialUnitCost =
      (product.latest_cost_price || 0) * conversionRate;

    // Check if product already exists in table
    const existingIndex = stockItems.findIndex((i) => i.product_id === product.id);

    if (existingIndex >= 0) {
      // Increment existing row
      const updated = [...stockItems];
      const existing = updated[existingIndex];

      // If barcode scanned was specifically a pack barcode, switch mode to pack
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

      setStockItems(updated);
    } else {
      // Add new row to the top
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
        input_cost_price: initialUnitCost,
        base_unit_cost: product.latest_cost_price || 0,
        batch_number: generateDefaultBatchNumber(),
        expiry_date: "",
        is_perishable: Boolean(product.is_perishable),
      };

      setStockItems((prev) => [newItem, ...prev]);
    }

    setSearchQuery("");
    setIsSearchOpen(false);
    setFormError(null);
  };

  // Auto-load inventory and pre-populate product if opened with quick stock-in
  useEffect(() => {
    if (!isStockInOpen) return;

    if (itemsCatalog.length === 0) {
      loadInventory();
      return;
    }

    if (initialProductId) {
      const alreadyHas = stockItems.some((item) => item.product_id === initialProductId);
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
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
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

      // 3. Fallback: match first product by name or sku
      const foundByName = itemsCatalog.find(
        (p) =>
          p.name_lo.toLowerCase().includes(code) ||
          (p.name_en && p.name_en.toLowerCase().includes(code))
      );
      if (foundByName) {
        addOrIncrementProduct(foundByName);
        return;
      }
    }
  };

  // Filtered catalog for autocomplete dropdown
  const filteredProducts = searchQuery.trim()
    ? itemsCatalog
        .filter(
          (p) =>
            p.name_lo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.name_en && p.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
            p.barcode.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  // Toggle unit mode between Base Unit (1x) and Pack Unit (Nx)
  const handleToggleUnitMode = (index: number, mode: "base" | "pack") => {
    const updated = [...stockItems];
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
    setStockItems(updated);
  };

  // Update quantity with stepper or typing
  const handleUpdateQuantity = (index: number, qty: number) => {
    const updated = [...stockItems];
    const item = { ...updated[index] };
    item.input_quantity = qty;
    item.total_base_quantity = qty * item.conversion_rate;
    updated[index] = item;
    setStockItems(updated);
  };

  // Update input cost price
  const handleUpdateCostPrice = (index: number, cost: number) => {
    const updated = [...stockItems];
    const item = { ...updated[index] };
    item.input_cost_price = cost;
    item.base_unit_cost =
      item.conversion_rate > 0 ? Math.round(cost / item.conversion_rate) : cost;
    updated[index] = item;
    setStockItems(updated);
  };

  // Update expiry date
  const handleUpdateExpiry = (index: number, dateStr: string) => {
    const updated = [...stockItems];
    updated[index] = { ...updated[index], expiry_date: dateStr };
    setStockItems(updated);
  };

  // Quick preset helper for expiry
  const handleAddExpiryDays = (index: number, daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const dateStr = d.toISOString().split("T")[0];
    handleUpdateExpiry(index, dateStr);
  };

  const handleRemoveItem = (index: number) => {
    setStockItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (stockItems.length === 0) {
      setFormError("ກະລຸນາເລືອກ ຫຼື ສະແກນສິນຄ້າຢ່າງໜ້ອຍ 1 ລາຍການ");
      return;
    }

    for (const item of stockItems) {
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
      invoice_ref: invoiceRef.trim() || undefined,
      notes: notes.trim() || undefined,
      items: stockItems,
    };

    const success = await createStockIn(payload);
    if (success) {
      handleClose();
    }
  };

  const totalReceiptCost = stockItems.reduce(
    (sum, item) => sum + item.input_cost_price * item.input_quantity,
    0
  );
  const totalBaseUnitsCount = stockItems.reduce(
    (sum, item) => sum + item.total_base_quantity,
    0
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none"
    >
      {/* Centered Modal Container (Spacious Table Layout max-w-5xl w-[96vw] max-h-[92vh]) */}
      <div className="relative w-full max-w-5xl sm:max-w-[1040px] w-[96vw] max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
        {/* 1. Modal Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200/90 bg-zinc-50 px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
              <PackagePlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                ໃບຮັບສິນຄ້າເຂົ້າສາງ (Stock In Invoice)
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                ຕາຕະລາງນຳເຂົ້າສິນຄ້າແບບລວມຍອດ, ສະແກນບາໂຄດ & ຕັດລັອດ FEFO ອັດຕະໂນມັດ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMeta((prev) => !prev)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>ຂໍ້ມູນຜູ້ສະໜອງ</span>
              {showMeta ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              title="ປິດ"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Collapsible Supplier & Receipt Metadata Bar */}
        {showMeta && (
          <div className="border-b border-zinc-200/80 bg-slate-50/90 px-5 py-2.5 animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <span>ຜູ້ສະໜອງ (Supplier)</span>
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="ເຊັ່ນ: ບໍລິສັດ ເບຍລາວ..."
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-slate-400" />
                  <span>ເລກທີໃບບິນ / ໃບສົ່ງເຄື່ອງ</span>
                </label>
                <input
                  type="text"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  placeholder="INV-2026-..."
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-mono outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-700">ໝາຍເຫດ</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ລາຍລະອຽດເພີ່ມເຕີມ..."
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Smart Search & Barcode Scan Bar */}
        <div className="border-b border-zinc-200/80 bg-white p-3 sm:px-5 shrink-0">
          <div className="relative">
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3 flex items-center text-emerald-600">
                <ScanBarcode className="h-5 w-5" />
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
                className="h-10.5 w-full rounded-xl border border-emerald-300 bg-emerald-50/20 pl-10.5 pr-24 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-400"
              />
              <div className="absolute right-2.5 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-md">
                <Search className="h-3 w-3" />
                <span>ພ້ອມຍິງບາໂຄດ</span>
              </div>
            </div>

            {/* Autocomplete Suggestion Dropdown */}
            {isSearchOpen && filteredProducts.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
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
        </div>

        {/* 4. Error Notice if Any */}
        {(formError || errorMessage) && (
          <div className="mx-5 mt-2 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-bold shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{formError || errorMessage}</span>
          </div>
        )}

        {/* 5. Main Compact Table Body (Single Row per Product) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {stockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-emerald-600 mb-2 border border-slate-200">
                <ScanBarcode className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                ຍັງບໍ່ທັນມີລາຍການສິນຄ້າໃນໃບຮັບ
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                ໃຊ້ເຄື່ອງສະແກນຍິງບາໂຄດເທິງກ່ອງ/ແພັກ ຫຼື ພິມຊື່ສິນຄ້າໃນຊ່ອງຄົ້ນຫາດ້ານເທິງເພື່ອເລີ່ມຕົ້ນ
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200/90 bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-slate-50/80 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">ສິນຄ້າ (Product)</th>
                    <th className="py-2.5 px-2 text-center w-36">ຫົວໜ່ວຍນຳເຂົ້າ</th>
                    <th className="py-2.5 px-2 text-center w-28">ຈຳນວນ</th>
                    <th className="py-2.5 px-2 text-right w-36">ລາຄາຊື້ / ໜ່ວຍ (₭)</th>
                    <th className="py-2.5 px-3 text-center w-48">ວັນໝົດອາຍຸ (FEFO)</th>
                    <th className="py-2.5 px-3 text-right w-36">ລວມເຂົ້າສາງ</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stockItems.map((item, index) => {
                    const product = itemsCatalog.find((p) => p.id === item.product_id);
                    const packUnit = product?.units?.find(
                      (u) => !u.is_base_unit && u.conversion_rate > 1
                    );
                    const hasPack = Boolean(packUnit);
                    const isPackSelected = item.conversion_rate > 1;
                    const lineTotalCost = item.input_cost_price * item.input_quantity;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* 1. Product Name & Barcode */}
                        <td className="py-2.5 px-3 min-w-[160px]">
                          <div className="font-bold text-slate-900 leading-snug">
                            {item.product_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.barcode}
                          </div>
                        </td>

                        {/* 2. Segmented Toggle Unit Selector: [ Lẻ (1x) | ແພັກ (xN) ] */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 shadow-2xs">
                            {/* Base unit button */}
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

                            {/* Pack unit button */}
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
                                title="ສິນຄ້ານີ້ບໍ່ໄດ້ຕັ້ງຄ່າແພັກ"
                              >
                                ບໍ່ມີແພັກ
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Quantity: [-] [Input] [+] */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex items-center h-8 rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs focus-within:border-emerald-600">
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = Math.max(1, (Number(item.input_quantity) || 1) - 1);
                                handleUpdateQuantity(index, nextVal);
                              }}
                              className="flex h-full w-6.5 items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 font-bold cursor-pointer border-r border-slate-200"
                              title="ຫຼຸດ"
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
                              title="ເພີ່ມ"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* 4. Cost Price per Selected Unit */}
                        <td className="py-2.5 px-2 text-right">
                          <KipCurrencyInput
                            value={item.input_cost_price || 0}
                            onValueChange={(val) => handleUpdateCostPrice(index, val)}
                            className="h-8 text-xs font-extrabold text-slate-900 text-right bg-white"
                          />
                          {item.conversion_rate > 1 && (
                            <div className="text-[9.5px] text-slate-400 mt-0.5">
                              @{formatLak(item.base_unit_cost, false)}/{item.base_unit}
                            </div>
                          )}
                        </td>

                        {/* 5. Expiry Date (FEFO) */}
                        <td className="py-2.5 px-3 text-center">
                          {item.is_perishable ? (
                            <div className="space-y-1">
                              <input
                                type="date"
                                required
                                value={item.expiry_date}
                                onChange={(e) => handleUpdateExpiry(index, e.target.value)}
                                className="h-7 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] font-semibold text-slate-800 outline-none focus:border-emerald-600 cursor-pointer"
                              />
                              {/* 3 Quick buttons: +30ວ, +6ດ, +1ປ */}
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddExpiryDays(index, 30)}
                                  className="rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                                >
                                  +30ວ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddExpiryDays(index, 180)}
                                  className="rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                                >
                                  +6ດ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddExpiryDays(index, 365)}
                                  className="rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                                >
                                  +1ປ
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              ບໍ່ຕິດຕາມ
                            </span>
                          )}
                        </td>

                        {/* 6. Total Base Units & Line Amount */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="font-black text-emerald-800 text-xs tabular-nums">
                            +{item.total_base_quantity} {item.base_unit}
                          </div>
                          <div className="text-[10.5px] font-bold text-slate-600 tabular-nums mt-0.5">
                            {formatLak(lineTotalCost)}
                          </div>
                        </td>

                        {/* 7. Delete Row Button */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="ລຶບລາຍການນີ້"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 6. Modal Footer & Summary Bar */}
        <div className="flex h-16 items-center justify-between border-t border-zinc-200/90 bg-zinc-50 px-5 shrink-0">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">ລາຍການ: </span>
              <strong className="text-slate-800 tabular-nums">{stockItems.length}</strong>
            </div>
            <div>
              <span className="text-slate-400">ຈຳນວນລວມ: </span>
              <strong className="text-emerald-700 tabular-nums font-black">
                +{totalBaseUnitsCount} ໜ່ວຍ
              </strong>
            </div>
            <div>
              <span className="text-slate-400">ມູນຄ່າທັງໝົດ: </span>
              <strong className="text-slate-900 text-sm tabular-nums font-black">
                {formatLak(totalReceiptCost)}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              disabled={isSubmitting || stockItems.length === 0}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSubmitting ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກເຂົ້າສາງ"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
