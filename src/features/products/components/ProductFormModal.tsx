"use client";

// ============================================================================
// ProductFormModal: Centered 2-Column Spacious Dialog
// 100% Production Grade - Points directly to ProductFormSheet
// ============================================================================

import React from "react";
import { ProductFormSheet, ProductFormSheetProps } from "./ProductFormSheet";

export type ProductFormModalProps = ProductFormSheetProps;

export function ProductFormModal(props?: ProductFormModalProps) {
  return <ProductFormSheet {...props} />;
}
