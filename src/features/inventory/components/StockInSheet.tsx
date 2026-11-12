"use client";

// ============================================================================
// StockInSheet: Multi-Item Batch Stock-In Drawer with Packaging Auto-Conversion
// ============================================================================

import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  PackagePlus,
  Save,
  Loader2,
  ScanBarcode,
  Sparkles,
  Calendar,
  AlertCircle,
  Building2,
  FileText,
} from "lucide-react";
import { useInventoryStore } from "../stores/inventory.store";
import { useStockMutations } from "../hooks/useStockMutations";
import {
  StockInItemFormData,
  StockInFormData,
} from "../types/inventory.types";
import {
  generateDefaultBatchNumber,
  convertInputQuantityToBase,
  calculateBaseUnitCost,
  calculateDaysUntilExpiry,
  getExpiryStatus,
} from "../utils/inventory.util";
import { formatLak } from "@/utils/formatLakCurrency";
import { KipCurrencyInput } from "@/components/ui/kip-currency-input";
import { ExpiryBadge } from "./ExpiryBadge";

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

  // Product search to add item
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  // Receipt lines
  const [stockItems, setStockItems] = useState<StockInItemFormData[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    setStockItems([]);
    setSupplierName("");
    setInvoiceRef("");
    setNotes("");
    setFormError(null);
    closeStockIn();
  };

  // Auto-load inventory and pre-populate product if opened with quick stock-in
  React.useEffect(() => {
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
          const secondaryUnits = product.units
            ?.filter((u) => !u.is_base_unit && u.conversion_rate > 1)
            .sort((a, b) => b.conversion_rate - a.conversion_rate);

          const defaultUnit = secondaryUnits?.[0] || {
            unit_name: product.base_unit,
            conversion_rate: 1,
            selling_price: product.selling_price,
          };

          const newItem: StockInItemFormData = {
            id: crypto.randomUUID(),
            product_id: product.id,
            product_name: product.name_lo,
            barcode: product.barcode,
            base_unit: product.base_unit,
            selected_unit_name: defaultUnit.unit_name,
            conversion_rate: defaultUnit.conversion_rate,
            input_quantity: 1,
            total_base_quantity: defaultUnit.conversion_rate,
            input_cost_price: (product.latest_cost_price || 0) * defaultUnit.conversion_rate,
            base_unit_cost: product.latest_cost_price || 0,
            batch_number: generateDefaultBatchNumber(),
            expiry_date: "",
            is_perishable: Boolean(product.is_perishable),
          };

          setStockItems((prev) => [newItem, ...prev]);
        }
      }
    }
  }, [isStockInOpen, initialProductId, itemsCatalog.length]);

  if (!isStockInOpen) return null;

  // Add a product line to the receipt
  const handleAddProductLine = (productId: string) => {
    const product = itemsCatalog.find((p) => p.id === productId);
    if (!product) return;

    // Default to largest secondary unit if available, otherwise base unit
    const secondaryUnits = product.units
      ?.filter((u) => !u.is_base_unit && u.conversion_rate > 1)
      .sort((a, b) => b.conversion_rate - a.conversion_rate);

    const defaultUnit = secondaryUnits?.[0] || {
      unit_name: product.base_unit,
      conversion_rate: 1,
      selling_price: product.selling_price,
    };

    const newItem: StockInItemFormData = {
      id: crypto.randomUUID(),
      product_id: product.id,
      product_name: product.name_lo,
      barcode: product.barcode,
      base_unit: product.base_unit,
      selected_unit_name: defaultUnit.unit_name,
      conversion_rate: defaultUnit.conversion_rate,
      input_quantity: 1,
      total_base_quantity: defaultUnit.conversion_rate,
      input_cost_price: (product.latest_cost_price || 0) * defaultUnit.conversion_rate,
      base_unit_cost: product.latest_cost_price || 0,
      batch_number: generateDefaultBatchNumber(),
      expiry_date: "",
      is_perishable: Boolean(product.is_perishable),
    };

    setStockItems((prev) => [newItem, ...prev]);
    setSelectedProductId("");
    setProductSearch("");
    setFormError(null);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof StockInItemFormData,
    value: any
  ) => {
    const updated = [...stockItems];
    const item = { ...updated[index], [field]: value };

    // If unit changed
    if (field === "selected_unit_name") {
      const product = itemsCatalog.find((p) => p.id === item.product_id);
      const chosenUnit = product?.units?.find((u) => u.unit_name === value);
      const rate = chosenUnit ? chosenUnit.conversion_rate : 1;
      item.conversion_rate = rate;
      item.total_base_quantity = convertInputQuantityToBase(item.input_quantity, rate);
      item.base_unit_cost = calculateBaseUnitCost(item.input_cost_price, rate);
    }

    // If quantity changed
    if (field === "input_quantity") {
      item.total_base_quantity = convertInputQuantityToBase(
        Number(value) || 0,
        item.conversion_rate
      );
    }

    // If cost price changed
    if (field === "input_cost_price") {
      item.base_unit_cost = calculateBaseUnitCost(
        Number(value) || 0,
        item.conversion_rate
      );
    }

    updated[index] = item;
    setStockItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setStockItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (stockItems.length === 0) {
      setFormError("ກະລຸນາເລືອກສິນຄ້າຢ່າງໜ້ອຍ 1 ລາຍການເພື່ອບັນທຶກເຂົ້າສາງ");
      return;
    }

    for (const item of stockItems) {
      if (item.input_quantity <= 0) {
        setFormError(`ຈຳນວນນຳເຂົ້າຂອງ "${item.product_name}" ຕ້ອງໃຫຍ່ກວ່າ 0`);
        return;
      }
      if (!item.batch_number.trim()) {
        setFormError(`ກະລຸນາປ້ອນເລກລັອດຂອງ "${item.product_name}"`);
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
      setStockItems([]);
      setSupplierName("");
      setInvoiceRef("");
      setNotes("");
    }
  };

  const totalReceiptCost = stockItems.reduce(
    (sum, item) => sum + item.input_cost_price * item.input_quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer Body */}
      <div className="relative flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200/80 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <PackagePlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                ໃບຮັບສິນຄ້າເຂົ້າສາງຕາມລັອດ (Stock In & FEFO)
              </h2>
              <p className="text-[10px] text-slate-500">
                ກຳນົດເລກລັອດ, ວັນໝົດອາຍຸ ແລະ ລະບົບຈະແປງຫົວໜ່ວຍແພັກ/ແກັດອັດຕະໂນມັດ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Error Banner */}
          {(formError || errorMessage) && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 leading-snug">{formError || errorMessage}</div>
            </div>
          )}

          {/* Supplier & Receipt Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3 rounded-2xl border border-zinc-200/70">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
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
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
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
              <label className="text-[11px] font-bold text-slate-700">ໝາຍເຫດ</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ລາຍລະອຽດເພີ່ມເຕີມ..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Product Selector to Add Item */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
            <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <ScanBarcode className="h-4 w-4 text-emerald-700" />
              <span>ເລືອກສິນຄ້າ ຫຼື ສະແກນບາໂຄດເພື່ອເພີ່ມເຂົ້າໃບຮັບ:</span>
            </label>

            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => {
                  if (e.target.value) handleAddProductLine(e.target.value);
                }}
                className="h-9 flex-1 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
              >
                <option value="">-- ເລືອກສິນຄ້າທີ່ຕ້ອງການນຳເຂົ້າ --</option>
                {itemsCatalog.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_lo} ({p.barcode}) - ປັດຈຸບັນ: {p.total_stock} {p.base_unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Table / Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">
                ລາຍການສິນຄ້ານຳເຂົ້າ ({stockItems.length} ລາຍການ)
              </h3>
              <div className="text-xs font-bold text-slate-600">
                ມູນຄ່າລວມ:{" "}
                <span className="text-emerald-700 font-extrabold tabular-nums">
                  {formatLak(totalReceiptCost)}
                </span>
              </div>
            </div>

            {stockItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <PackagePlus className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">ຍັງບໍ່ມີລາຍການສິນຄ້າໃນໃບຮັບ</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  ເລືອກສິນຄ້າຈາກກ່ອງສີຂຽວດັ່ງເທິງເພື່ອເລີ່ມຕົ້ນ
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stockItems.map((item, index) => {
                  const product = itemsCatalog.find((p) => p.id === item.product_id);
                  const availableUnits = product?.units || [
                    { unit_name: item.base_unit, conversion_rate: 1 },
                  ];

                  const daysUntil = calculateDaysUntilExpiry(item.expiry_date);
                  const expStatus = getExpiryStatus(daysUntil);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 shadow-2xs space-y-3"
                    >
                      {/* Product Name Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {index + 1}. {item.product_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ບາໂຄດ: {item.barcode} | ຫົວໜ່ວຍຫຼັກ: {item.base_unit}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="ລຶບລາຍການນີ້"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Input Grid: Units & Quantities */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {/* Packaging Unit Selector */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">
                            ຫົວໜ່ວຍທີ່ນຳເຂົ້າ
                          </label>
                          <select
                            value={item.selected_unit_name}
                            onChange={(e) =>
                              handleUpdateItem(index, "selected_unit_name", e.target.value)
                            }
                            className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                          >
                            {availableUnits.map((u, uIdx) => (
                              <option key={`${u.unit_name}-${u.conversion_rate}-${uIdx}`} value={u.unit_name}>
                                {u.unit_name} {u.conversion_rate > 1 ? `(x${u.conversion_rate})` : "(1x)"}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Input Quantity */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">
                            ຈຳນວນນຳເຂົ້າ
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.input_quantity || ""}
                            onChange={(e) =>
                              handleUpdateItem(
                                index,
                                "input_quantity",
                                Math.max(1, Number(e.target.value))
                              )
                            }
                            className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs font-extrabold text-slate-900 text-center outline-none focus:border-emerald-600"
                          />
                        </div>

                        {/* Cost Price per Selected Unit */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">
                            ລາຄາທຶນ / {item.selected_unit_name} (₭)
                          </label>
                          <KipCurrencyInput
                            value={item.input_cost_price || 0}
                            onValueChange={(val) =>
                              handleUpdateItem(index, "input_cost_price", val)
                            }
                            className="h-8 text-xs font-extrabold text-slate-900"
                          />
                        </div>

                        {/* Auto-converted Base Quantity Info */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600">
                            ແປງເປັນຫົວໜ່ວຍຫຼັກ
                          </label>
                          <div className="flex h-8 items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 text-xs">
                            <span className="font-extrabold text-emerald-900 tabular-nums">
                              {item.total_base_quantity} {item.base_unit}
                            </span>
                            <span className="text-[9px] text-emerald-700">
                              @{formatLak(item.base_unit_cost, false)}/{item.base_unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-row: Batch Number & Expiry Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
                        {/* Batch Number */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-600">
                              ເລກລັອດ (Batch No.)
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(
                                  index,
                                  "batch_number",
                                  generateDefaultBatchNumber()
                                )
                              }
                              className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              <span>ສ້າງລະຫັດໃໝ່</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            value={item.batch_number}
                            onChange={(e) =>
                              handleUpdateItem(index, "batch_number", e.target.value)
                            }
                            className="h-8 w-full rounded-lg border border-slate-200 px-2 font-mono text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                          />
                        </div>

                        {/* Expiry Date (Synced with FEFO status) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>ວັນໝົດອາຍຸ (Expiry Date)</span>
                              {item.is_perishable && <span className="text-rose-500">*</span>}
                            </label>
                            {item.is_perishable ? (
                              item.expiry_date ? (
                                <ExpiryBadge
                                  expiryDate={item.expiry_date}
                                  daysUntilExpiry={daysUntil}
                                  status={expStatus}
                                />
                              ) : (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded">
                                  FEFO
                                </span>
                              )
                            ) : (
                              <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                                ບໍ່ຕິດຕາມວັນໝົດອາຍຸ
                              </span>
                            )}
                          </div>

                          {!item.is_perishable ? (
                            <input
                              type="text"
                              disabled
                              value="ບໍ່ຕິດຕາມວັນໝົດອາຍຸ (No Expiry Tracking)"
                              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-100/70 px-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                            />
                          ) : (
                            <div>
                              <input
                                type="date"
                                required
                                value={item.expiry_date || ""}
                                onChange={(e) =>
                                  handleUpdateItem(index, "expiry_date", e.target.value)
                                }
                                className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
                              />

                              {/* 3 Quick-Select Buttons: +30 ວັນ, +6 ເດືອນ, +1 ປີ */}
                              <div className="flex items-center gap-1 pt-1">
                                <span className="text-[9px] font-semibold text-slate-400">ເລືອກດ່ວນ:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 30);
                                    handleUpdateItem(index, "expiry_date", d.toISOString().split("T")[0]);
                                  }}
                                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                                >
                                  +30 ວັນ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const d = new Date();
                                    d.setMonth(d.getMonth() + 6);
                                    handleUpdateItem(index, "expiry_date", d.toISOString().split("T")[0]);
                                  }}
                                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                                >
                                  +6 ເດືອນ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const d = new Date();
                                    d.setFullYear(d.getFullYear() + 1);
                                    handleUpdateItem(index, "expiry_date", d.toISOString().split("T")[0]);
                                  }}
                                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                                >
                                  +1 ປີ
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/70 p-4">
          <div className="text-xs text-slate-500 font-medium">
            ທັງໝົດ <strong>{stockItems.length}</strong> ລາຍການ | ລວມ:{" "}
            <strong className="text-slate-900 font-extrabold tabular-nums">
              {formatLak(totalReceiptCost)}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || stockItems.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSubmitting ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກຮັບສິນຄ້າເຂົ້າສາງ"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

