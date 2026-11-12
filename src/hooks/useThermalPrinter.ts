"use client";

// ============================================================================
// Thermal Printer Hook
// ============================================================================

import { useState } from "react";
import { ThermalPrinterAdapter, ReceiptData } from "@/utils/printer.adapter";

export function useThermalPrinter() {
  const [isPrinting, setIsPrinting] = useState(false);

  const printReceipt = async (data: ReceiptData): Promise<boolean> => {
    setIsPrinting(true);
    try {
      return await ThermalPrinterAdapter.printReceipt(data);
    } finally {
      setIsPrinting(false);
    }
  };

  return {
    printReceipt,
    isPrinting,
    isTauri: ThermalPrinterAdapter.isTauri(),
    isCapacitor: ThermalPrinterAdapter.isCapacitor(),
    isWeb: ThermalPrinterAdapter.isWeb(),
  };
}

