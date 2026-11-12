"use client";

// ============================================================================
// Backward-compatibility wrapper pointing to standard KipCurrencyInput
// ============================================================================

import React from "react";
import { KipCurrencyInput, KipCurrencyInputProps } from "./ui/kip-currency-input";

export type LakCurrencyInputProps = KipCurrencyInputProps;

export const LakCurrencyInput = KipCurrencyInput;
export default KipCurrencyInput;

