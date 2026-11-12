# Lao Minimart POS - Enterprise Design System (MASTER.md)
*Generated with ui-ux-pro-max intelligence for Retail POS & Clean Back-office (Laos Market)*

---

## 1. Visual Aesthetics & Philosophy
- **Style Archetype:** Modern Apple-inspired Retail POS (Square POS & Shopify POS next-gen) combined with Clean SaaS Back-office.
- **Atmosphere:** Clean, crisp, high-focus, frictionless. Built for 8-10 hour daily retail cashier shifts under bright supermarket fluorescent lighting.
- **Core Principles:**
  1. **Zero Eye Strain:** Warm soft base (`#F8F9FA` / `Zinc-50`) instead of harsh pure stark white or oversaturated blue.
  2. **Subtle Hairline Elevation:** Hairline borders (`1px border-zinc-200/80`) paired with layered micro-shadows (`shadow-xs`), avoiding heavy clunky outlines.
  3. **High-Contrast Touch Targets:** 48px+ minimum touch targets for cashier touchscreens, instant tactile visual feedback on press (`whileTap={{ scale: 0.98 }}`).
  4. **Deep Emerald Affirmation:** Dedicated brand accent **Deep Emerald (`#059669` / `emerald-600`)** reserved for the primary transaction action (ຊຳລະເງິນ - Pay/Checkout).

---

## 2. Color Palette & Semantic Tokens

### Core Surfaces & Typography
| Token | Hex | Tailwind Equivalent | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-main` | `#F8F9FA` | `bg-zinc-50` | Primary application canvas background |
| `--surface-card` | `#FFFFFF` | `bg-white` | POS panels, product cards, modals |
| `--surface-subtle` | `#F1F3F5` | `bg-zinc-100` | Table headers, inactive tabs, disabled fields |
| `--text-primary` | `#0F172A` | `text-slate-900` | Headings, totals, item names |
| `--text-secondary` | `#475569` | `text-slate-600` | Subtitles, SKU, unit labels |
| `--text-muted` | `#94A3B8` | `text-slate-400` | Timestamps, barcodes, inactive icons |
| `--border-hairline` | `rgba(226, 232, 240, 0.8)` | `border-slate-200/80` | Subtle hairline dividers |

### Action & Brand Accent
| Token | Hex | Tailwind Equivalent | Purpose |
| :--- | :--- | :--- | :--- |
| `--color-pay-primary` | `#059669` | `bg-emerald-600` | Main Checkout button (ຊຳລະເງິນ) |
| `--color-pay-hover` | `#047857` | `hover:bg-emerald-700` | Hover/Active checkout button |
| `--color-pay-light` | `#ECFDF5` | `bg-emerald-50` | Paid badges, change owed display |
| `--color-brand` | `#0F766E` | `bg-teal-700` | System brand headers, logos |

### Retail Status Semantics (Inventory & Expiry FEFO)
| Semantic State | Background | Text/Border | Use Case |
| :--- | :--- | :--- | :--- |
| **In Stock (ມີສິນຄ້າ)** | `bg-emerald-50` | `text-emerald-700 border-emerald-200` | Normal shelf stock |
| **Low Stock (ໃກ້ໝົດ)** | `bg-amber-50` | `text-amber-800 border-amber-200` | Stock < reorder point |
| **Near Expiry (ໃກ້ໝົດອາຍຸ)** | `bg-orange-50` | `text-orange-800 border-orange-200` | FEFO batch < 15/30 days, clear-out price |
| **Expired / Discrepancy (ໝົດອາຍຸ / ເງິນບໍ່ຕົງ)** | `bg-rose-50` | `text-rose-700 border-rose-200` | Expired batch warning, cash discrepancy |
| **Held Order (ພັກບິນ)** | `bg-blue-50` | `text-blue-700 border-blue-200` | Multi-order tab counter |

---

## 3. Typography & Lao Text Rules (ພາສາລາວ)

### Font Stack
- **Primary Lao & Latin Text:** Google Font `Noto Sans Lao`, sans-serif.
- **Numeric & Financial Display:** `Plus Jakarta Sans`, `Inter`, with `font-variant-numeric: tabular-nums`.

### Lao Script Layout Geometry Trap & Rules
- Lao vowel/tone marks stack above and below consonants (e.g. ິ, ີ, ຶ, ື, ຸ, ູ, ່, ້, ໊, ໋).
- **Line Height:** Must be set to `leading-relaxed` (1.6) minimum to avoid vertical clipping.
- **Vertical Padding:** Buttons and inputs must use minimum `py-2` to `py-3` (not tight `py-1`).
- **Currency Numbers:** Lao Kip (LAK) involves large numbers (50,000 ₭ to 10,000,000+ ₭). All currency text spans must use `font-mono` or `tabular-nums` with explicit `whitespace-nowrap`.

---

## 4. Touch & Cashier Ergonomics
- **Touch Size:** Minimum button height = `48px` (h-12).
- **Fast Numeric Keypad:** Large numeric keypad for cash tender (`10,000 ₭`, `20,000 ₭`, `50,000 ₭`, `100,000 ₭`, `200,000 ₭`).
- **Keyboard Shortcuts:** Visual badge on every core button:
  - `F1`: Focus Barcode Scanner
  - `F2`: Hold / Switch Order (ພັກບິນ)
  - `F4`: Clear Cart (ລ້າງກະຕ່າ)
  - `F8`: Quick Payment Modal (ຊຳລະເງິນ)
  - `Esc`: Close Modal / Cancel

---

## 5. Thermal Receipt Specs (80mm)
- **Width:** 576 dots (72mm printable area on 80mm roll).
- **Font Rendering:** Render as HTML5 Canvas $\rightarrow$ 1-bit Monochrome Bitmap to ensure 100% sharp Lao Unicode text without missing character glyphs on budget ESC/POS thermal printers.

