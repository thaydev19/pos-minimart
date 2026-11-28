"use client";

// ============================================================================
// ExpiryBadge: High-Contrast Countdown & Warning Pill for FEFO Batches
// ============================================================================

import React, { memo } from "react";
import { AlertCircle, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { BatchExpiryStatus } from "../types/inventory.types";

interface ExpiryBadgeProps {
  expiryDate?: string;
  daysUntilExpiry: number;
  status: BatchExpiryStatus;
  size?: "sm" | "md";
}

export const ExpiryBadge = memo(function ExpiryBadge({
  expiryDate,
  daysUntilExpiry,
  status,
  size = "sm",
}: ExpiryBadgeProps) {
  const isSm = size === "sm";

  if (status === "expired") {
    const daysAgo = Math.abs(daysUntilExpiry);
    return (
      <span
        title={expiryDate ? `ວັນໝົດອາຍຸ: ${expiryDate}` : undefined}
        className={`inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold ${
          isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <ShieldAlert className={isSm ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>ໝົດອາຍຸແລ້ວ ({daysAgo} ວັນ)</span>
      </span>
    );
  }

  if (status === "critical") {
    return (
      <span
        title={expiryDate ? `ວັນໝົດອາຍຸ: ${expiryDate} (ຕ້ອງເລັ່ງຂາຍ)` : undefined}
        className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-300 font-extrabold ${
          isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <AlertCircle className={isSm ? "h-3 w-3 text-rose-600" : "h-3.5 w-3.5 text-rose-600"} />
        <span>ໃກ້ໝົດອາຍຸ (ອີກ {daysUntilExpiry} ວັນ)</span>
      </span>
    );
  }

  if (status === "warning") {
    return (
      <span
        title={expiryDate ? `ວັນໝົດອາຍຸ: ${expiryDate}` : undefined}
        className={`inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold ${
          isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <Clock className={isSm ? "h-3 w-3 text-amber-600" : "h-3.5 w-3.5 text-amber-600"} />
        <span>ໃກ້ໝົດອາຍຸ (ອີກ {daysUntilExpiry} ວັນ)</span>
      </span>
    );
  }

  // Good
  return (
    <span
      title={expiryDate ? `ວັນໝົດອາຍຸ: ${expiryDate}` : undefined}
      className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold ${
        isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <CheckCircle2 className={isSm ? "h-3 w-3 text-emerald-600" : "h-3.5 w-3.5 text-emerald-600"} />
      <span>ປົກກະຕິ ({daysUntilExpiry} ວັນ)</span>
    </span>
  );
});

