// ============================================================================
// Lao Barcode Normalizer (Lao Keyboard Layout & Digits Trap Resolver)
// ============================================================================

const LAO_TO_ASCII_DIGITS: Record<string, string> = {
  "໐": "0",
  "໑": "1",
  "໒": "2",
  "໓": "3",
  "໔": "4",
  "໕": "5",
  "໖": "6",
  "໗": "7",
  "໘": "8",
  "໙": "9",
};

const LAO_KEYBOARD_NUMBER_ROW: Record<string, string> = {
  "ຢ": "1",
  "ຟ": "2",
  "ໂ": "3",
  "ຖ": "4",
  "ຸ": "5",
  "ູ": "6",
  "ຄ": "7",
  "ຕ": "8",
  "ຈ": "9",
  "ຂ": "0",
  "ຂໍ": "2",
  "໊": "3",
  "໋": "4",
  "໌": "5",
};

export function normalizeBarcodeInput(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();

  let result = "";
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (char >= "0" && char <= "9") {
      result += char;
    } else if (LAO_TO_ASCII_DIGITS[char]) {
      result += LAO_TO_ASCII_DIGITS[char];
    } else if (LAO_KEYBOARD_NUMBER_ROW[char]) {
      result += LAO_KEYBOARD_NUMBER_ROW[char];
    } else if (
      (char >= "a" && char <= "z") ||
      (char >= "A" && char <= "Z") ||
      char === "-" ||
      char === "_" ||
      char === "*"
    ) {
      result += char;
    }
  }

  return result;
}

export function parseBarcodeMultiplier(input: string): {
  quantity: number;
  barcode: string;
} {
  const normalized = normalizeBarcodeInput(input);
  if (normalized.includes("*")) {
    const parts = normalized.split("*");
    if (parts.length === 2) {
      const parsedQty = parseFloat(parts[0]);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        return {
          quantity: parsedQty,
          barcode: parts[1],
        };
      }
    }
  }

  return {
    quantity: 1,
    barcode: normalized,
  };
}

