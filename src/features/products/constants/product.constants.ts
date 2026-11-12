// ============================================================================
// Product Constants: Lao Retail Units & Default Presets
// ============================================================================

export interface LaoUnitOption {
  name: string;
  label_lo: string;
  defaultConversion?: number;
}

export const COMMON_LAO_UNITS: LaoUnitOption[] = [
  { name: "ປ໋ອງ", label_lo: "ປ໋ອງ (Can)" },
  { name: "ຕຸກ", label_lo: "ຕຸກ (Bottle)" },
  { name: "ຊອງ", label_lo: "ຊອງ (Pack)" },
  { name: "ກ່ອງ", label_lo: "ກ່ອງ (Box)" },
  { name: "ແພັກ", label_lo: "ແພັກ (Pack)", defaultConversion: 6 },
  { name: "ແກັດ", label_lo: "ແກັດ (Carton)", defaultConversion: 24 },
  { name: "ກິໂລ", label_lo: "ກິໂລ (Kg)" },
  { name: "ກຣາມ", label_lo: "ກຣາມ (Gram)", defaultConversion: 100 },
  { name: "ອັນ", label_lo: "ອັນ (Piece)" },
  { name: "ຖົງ", label_lo: "ຖົງ (Bag)" },
  { name: "ແຜ່ນ", label_lo: "ແຜ່ນ (Sheet)" },
  { name: "ມ້ວນ", label_lo: "ມ້ວນ (Roll)" },
];

export const WEIGHING_BARCODE_PREFIX = "20";

