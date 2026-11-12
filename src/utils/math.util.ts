// ============================================================================
// Safe Mathematical & Financial Calculations for Lao Kip (LAK) POS
// ============================================================================

export function roundToLak(amount: number): number {
  return Math.round(amount);
}

export function calculateLineTotal(
  unitPrice: number,
  quantity: number,
  discountPercent: number = 0,
  discountFixed: number = 0
): {
  subtotal: number;
  discountAmount: number;
  total: number;
} {
  const subtotal = roundToLak(unitPrice * quantity);
  const percentDiscountAmount = roundToLak((subtotal * discountPercent) / 100);
  const totalDiscount = Math.min(subtotal, percentDiscountAmount + discountFixed);
  const total = Math.max(0, subtotal - totalDiscount);

  return {
    subtotal,
    discountAmount: totalDiscount,
    total,
  };
}

export function calculateCartTotals(
  items: Array<{ subtotalPrice: number; discountAmount: number; totalPrice: number }>,
  orderDiscountFixed: number = 0,
  vatRatePercent: number = 0
): {
  subtotal: number;
  itemsDiscount: number;
  orderDiscount: number;
  totalDiscount: number;
  vatAmount: number;
  finalTotal: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.subtotalPrice, 0);
  const itemsDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
  const afterItemsDiscount = Math.max(0, subtotal - itemsDiscount);

  const orderDiscount = Math.min(afterItemsDiscount, orderDiscountFixed);
  const taxableAmount = afterItemsDiscount - orderDiscount;

  const vatAmount = roundToLak((taxableAmount * vatRatePercent) / 100);
  const finalTotal = taxableAmount + vatAmount;

  return {
    subtotal,
    itemsDiscount,
    orderDiscount,
    totalDiscount: itemsDiscount + orderDiscount,
    vatAmount,
    finalTotal,
  };
}

