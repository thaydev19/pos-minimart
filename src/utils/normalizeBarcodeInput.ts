// ============================================================================
// Enterprise Barcode Normalizer & Keyboard Wedge Layout Decoder
// Resolves:
// 1. Shift / CapsLock Trap (English/Vietnamese): "!@#$%^&*()" -> "1234567890"
// 2. Thai Keyboard Layout Trap (Kedmanee Shift & Unshift): "๕๕๔๓ู๖๕๗" / "คคถภุึ" -> "885469..."
// 3. Lao Keyboard Layout Trap (Lao Shift & Unshift): "66໌4ຼ7688໌8໌8" / "ຕຕຸຖູ" -> "88546..."
// 4. Native Lao & Thai Unicode Digits: "໐-໙" / "๐-๙" -> "0-9"
// 5. Strips internal and trailing whitespace (e.g. "8854698 005050" -> "8854698005050")
// 6. Direct hardware key decoding via KeyboardEvent.code (bypasses OS layout entirely)
// ============================================================================

// 1. Shifted ASCII symbols on English / US / Vietnamese keyboards
const SHIFT_ASCII_ROW: Record<string, string> = {
  "!": "1",
  "@": "2",
  "#": "3",
  "$": "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  "_": "-",
  "+": "+",
};

// 2. Thai Kedmanee Keyboard - Shifted Number Row
// Key 1: +, Key 2: ๑, Key 3: ๒, Key 4: ๓, Key 5: ๔, Key 6: ู, Key 7: ฿, Key 8: ๕, Key 9: ๖, Key 0: ๗
const THAI_KEDMANEE_SHIFT_ROW: Record<string, string> = {
  "+": "1",
  "๑": "2",
  "๒": "3",
  "๓": "4",
  "๔": "5",
  "ู": "6",
  "฿": "7",
  "๕": "8",
  "๖": "9",
  "๗": "0",
};

// 3. Thai Kedmanee Keyboard - Unshifted Number Row
// Key 1: ๅ, Key 2: /, Key 3: -, Key 4: ภ, Key 5: ถ, Key 6: ຸ, Key 7: ຶ, Key 8: ຄ, Key 9: ต, Key 0: จ
const THAI_KEDMANEE_UNSHIFT_ROW: Record<string, string> = {
  "ๅ": "1",
  "/": "2",
  "-": "3",
  "ภ": "4",
  "ถ": "5",
  "ຸ": "6",
  "ຶ": "7",
  "ค": "8",
  "ต": "9",
  "จ": "0",
};

// 4. Lao Keyboard Layout - Shifted Number Row
// Key 5: ໌, Key 6: ຼ, Key 8: 6, Key 9: 7, Key 0: 8
const LAO_KEYBOARD_SHIFT_ROW: Record<string, string> = {
  "6": "8",
  "7": "9",
  "8": "0",
  "໌": "5",
  "ຼ": "6",
  "4": "4",
  "!": "1",
  "ຂໍ": "2",
  "໊": "3",
  "໋": "4",
};

// 5. Lao Keyboard Layout - Unshifted Number Row
// Key 1: ຢ, Key 2: ຟ, Key 3: ໂ, Key 4: ຖ, Key 5: ຸ, Key 6: ູ, Key 7: ຄ, Key 8: ຕ, Key 9: ຈ, Key 0: ຂ
const LAO_KEYBOARD_UNSHIFT_ROW: Record<string, string> = {
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
};

// 6. Lao Native Unicode Digits (0-9)
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

// 7. Thai Native Unicode Digits (0-9)
const THAI_TO_ASCII_DIGITS: Record<string, string> = {
  "๐": "0",
  "๑": "1",
  "๒": "2",
  "๓": "3",
  "๔": "4",
  "๕": "5",
  "๖": "6",
  "๗": "7",
  "໘": "8",
  "๙": "9",
};

// 8. French AZERTY Keyboard Number Row
const FRENCH_AZERTY_ROW: Record<string, string> = {
  "&": "1",
  "é": "2",
  "\"": "3",
  "'": "4",
  "(": "5",
  "-": "6",
  "è": "7",
  "_": "8",
  "ç": "9",
  "à": "0",
};

/**
 * Decodes and cleans ANY barcode string that was corrupted by keyboard layouts
 * (English Shift/CapsLock, Thai Kedmanee, Lao layout, spaces, native digits).
 */
export function normalizeBarcodeInput(raw: string): string {
  if (!raw) return "";

  // Strip all whitespace (spaces, tabs, newlines)
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return "";

  // Detect mode indicators in the input string
  const isLaoShifted = /[໌ຼ]/.test(trimmed);
  const isThaiShifted = /[ู฿]/.test(trimmed);

  let result = "";
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];

    // Standard ASCII Digits (0-9)
    if (c >= "0" && c <= "9") {
      // In Lao Shifted mode: keys 8, 9, 0 output 6, 7, 8
      if (isLaoShifted && (c === "6" || c === "7" || c === "8")) {
        result += LAO_KEYBOARD_SHIFT_ROW[c];
      } else {
        result += c;
      }
      continue;
    }

    // 1. English / Vietnamese Shifted number row: "!@#$%^&*()"
    if (SHIFT_ASCII_ROW[c]) {
      result += SHIFT_ASCII_ROW[c];
      continue;
    }

    // 2. Thai Kedmanee Shifted row (when string has Thai vowel UU or Baht)
    if (isThaiShifted && THAI_KEDMANEE_SHIFT_ROW[c]) {
      result += THAI_KEDMANEE_SHIFT_ROW[c];
      continue;
    }

    // 3. Thai Unicode Digits (๐-๙)
    if (THAI_TO_ASCII_DIGITS[c]) {
      result += THAI_TO_ASCII_DIGITS[c];
      continue;
    }

    // 4. Thai Kedmanee Unshifted row (ๅ/-ภถุึคตจ)
    if (THAI_KEDMANEE_UNSHIFT_ROW[c]) {
      result += THAI_KEDMANEE_UNSHIFT_ROW[c];
      continue;
    }

    // 5. Lao Shifted row (໌, ຼ, etc.)
    if (LAO_KEYBOARD_SHIFT_ROW[c]) {
      result += LAO_KEYBOARD_SHIFT_ROW[c];
      continue;
    }

    // 6. Lao Unicode Digits (໐-໙)
    if (LAO_TO_ASCII_DIGITS[c]) {
      result += LAO_TO_ASCII_DIGITS[c];
      continue;
    }

    // 7. Lao Unshifted row (ຢຟໂຖຸູຄຕຈຂ)
    if (LAO_KEYBOARD_UNSHIFT_ROW[c]) {
      result += LAO_KEYBOARD_UNSHIFT_ROW[c];
      continue;
    }

    // 8. French AZERTY row
    if (FRENCH_AZERTY_ROW[c]) {
      result += FRENCH_AZERTY_ROW[c];
      continue;
    }

    // 9. Standard alphanumeric letters & barcode valid punctuation
    if (
      (c >= "a" && c <= "z") ||
      (c >= "A" && c <= "Z") ||
      c === "-" ||
      c === "_"
    ) {
      result += c;
    }
  }

  return result;
}

/**
 * Hardware Barcode Scanner Key Decoder.
 * Uses KeyboardEvent.code (physical key on hardware keyboard wedge)
 * to completely bypass operating system keyboard language layout and Shift/Caps state.
 */
export function getHardwareBarcodeChar(e: KeyboardEvent): string | null {
  // 1. Number row keys: "Digit0" .. "Digit9" -> "0" .. "9"
  if (e.code.startsWith("Digit")) {
    const digit = e.code.slice(5);
    if (digit.length === 1 && digit >= "0" && digit <= "9") {
      return digit;
    }
  }

  // 2. Numpad keys: "Numpad0" .. "Numpad9" -> "0" .. "9"
  if (e.code.startsWith("Numpad")) {
    const num = e.code.slice(6);
    if (num.length === 1 && num >= "0" && num <= "9") {
      return num;
    }
    if (e.code === "NumpadSubtract") return "-";
    if (e.code === "NumpadMultiply") return "*";
    if (e.code === "NumpadDivide") return "/";
  }

  // 3. Letters A-Z: "KeyA" .. "KeyZ" -> "A" .. "Z"
  if (e.code.startsWith("Key")) {
    const letter = e.code.slice(3).toUpperCase();
    if (letter.length === 1 && letter >= "A" && letter <= "Z") {
      return letter;
    }
  }

  // 4. Common punctuation in barcodes
  if (e.code === "Minus") return "-";
  if (e.code === "Slash") return "/";

  // 5. Spaces from scanner are stripped
  if (e.code === "Space") return "";

  // 6. Fallback for environments where e.code is empty or unidentified
  if (e.key && e.key.length === 1) {
    const decoded = normalizeBarcodeInput(e.key);
    if (decoded) return decoded;
  }

  return null;
}

/**
 * Parses multiplier syntax (e.g. "6*8850029100018") with support for
 * corrupted shifted inputs (e.g. "**%$^(*))%)%)" -> quantity 1, barcode "8854698005050").
 */
export function parseBarcodeMultiplier(input: string): {
  quantity: number;
  barcode: string;
} {
  if (!input) return { quantity: 1, barcode: "" };
  const trimmed = input.trim();

  // Multiplier pattern e.g. "5*8850029100018" or "2.5*8850029"
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\*(.+)$/);
  if (match) {
    const parsedQty = parseFloat(match[1]);
    const restBarcode = match[2];

    // Ensure the remainder is not just consecutive '*' from shifted scanning
    if (!isNaN(parsedQty) && parsedQty > 0 && restBarcode && !restBarcode.startsWith("*")) {
      return {
        quantity: parsedQty,
        barcode: normalizeBarcodeInput(restBarcode),
      };
    }
  }

  return {
    quantity: 1,
    barcode: normalizeBarcodeInput(trimmed),
  };
}
