// ============================================================================
// Lao Kip Currency (LAK - ກີບ) Formatting & Cash Suggestions
// ============================================================================

export const LAO_BANKNOTES = [
  1000,
  2000,
  5000,
  10000,
  20000,
  50000,
  100000,
  200000,
] as const;

/**
 * Formats a number to Lao Kip format with dot '.' thousand separators
 * Example: 150000 -> "150.000 ₭"
 */
export function formatLak(amount: number, withSymbol: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return withSymbol ? "0 ₭" : "0";
  }
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return withSymbol ? `${formatted} ₭` : formatted;
}

/**
 * Standard aliases for Lao Kip currency formatting
 */
export const formatKip = formatLak;
export const formatLAK = formatLak;

/**
 * Generates smart cash tender suggestions for cashier based on the bill total.
 * Example for 37,000 ₭ total: [37,000, 40,000, 50,000, 100,000, 200,000]
 */
export function getSmartCashSuggestions(total: number): number[] {
  if (total <= 0) return [10000, 20000, 50000, 100000];

  const suggestions = new Set<number>();
  const roundedTotal = Math.round(total);

  // 1. Exact amount
  suggestions.add(roundedTotal);

  // 2. Next nearest 10,000 ₭
  if (roundedTotal % 10000 !== 0) {
    suggestions.add(Math.ceil(roundedTotal / 10000) * 10000);
  }

  // 3. Next nearest 20,000 ₭
  if (roundedTotal % 20000 !== 0) {
    const next20k = Math.ceil(roundedTotal / 20000) * 20000;
    if (next20k > roundedTotal) suggestions.add(next20k);
  }

  // 4. Next nearest 50,000 ₭
  const next50k = Math.ceil(roundedTotal / 50000) * 50000;
  if (next50k >= roundedTotal) suggestions.add(next50k);

  // 5. Next nearest 100,000 ₭
  const next100k = Math.ceil(roundedTotal / 100000) * 100000;
  if (next100k >= roundedTotal) suggestions.add(next100k);

  // 6. Common large notes: 100k, 200k, 500k if total is under
  if (roundedTotal < 100000) suggestions.add(100000);
  if (roundedTotal < 200000) suggestions.add(200000);
  if (roundedTotal > 100000 && roundedTotal < 500000) suggestions.add(500000);

  return Array.from(suggestions)
    .filter((val) => val >= roundedTotal)
    .sort((a, b) => a - b)
    .slice(0, 5);
}

