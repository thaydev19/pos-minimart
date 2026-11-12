// ============================================================================
// Category Constants: Icons & Color Presets for Minimart Backoffice
// ============================================================================

export interface CategoryIconOption {
  id: string;
  name_lo: string;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: "Beer", name_lo: "ເຄື່ອງດື່ມແອວໂກຮໍ / ເບຍ" },
  { id: "Milk", name_lo: "ນົມ & ນ້ຳດື່ມ" },
  { id: "Utensils", name_lo: "ອາຫານ & ໝີ່ກ່ອງ" },
  { id: "Scale", name_lo: "ສິນຄ້າຊັ່ງກິໂລ / ຜັກສົດ" },
  { id: "Coffee", name_lo: "ກາເຟ & ຊາ" },
  { id: "Zap", name_lo: "ເຄື່ອງດື່ມຊູກຳລັງ" },
  { id: "Cookie", name_lo: "ເຂົ້າໜົມ & ຂອງຫວານ" },
  { id: "Apple", name_lo: "ໝາກໄມ້ສົດ" },
  { id: "Candy", name_lo: "ລູກອົມ & ໝາກຝຣັ່ງ" },
  { id: "ShoppingBag", name_lo: "ເຄື່ອງໃຊ້ປະຈຳວັນ" },
  { id: "Sparkles", name_lo: "ສິນຄ້າໂປຣໂມຊັ່ນ" },
  { id: "Package", name_lo: "ສິນຄ້າທົ່ວໄປ" },
];

export interface CategoryColorOption {
  id: string;
  name_lo: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
}

export const CATEGORY_COLOR_OPTIONS: CategoryColorOption[] = [
  {
    id: "emerald",
    name_lo: "ຂຽວມໍລະກົດ",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    textClass: "text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  {
    id: "blue",
    name_lo: "ຟ້າຄາມ",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    textClass: "text-blue-700",
    dotClass: "bg-blue-500",
  },
  {
    id: "amber",
    name_lo: "ສົ້ມທອງ",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-800",
    dotClass: "bg-amber-500",
  },
  {
    id: "purple",
    name_lo: "ມ່ວງດອກຮັກ",
    bgClass: "bg-purple-50",
    borderClass: "border-purple-200",
    textClass: "text-purple-700",
    dotClass: "bg-purple-500",
  },
  {
    id: "rose",
    name_lo: "ບົວຊົມພູ",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
    textClass: "text-rose-700",
    dotClass: "bg-rose-500",
  },
  {
    id: "slate",
    name_lo: "ຂີ້ເຖົ່າ",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-300",
    textClass: "text-slate-700",
    dotClass: "bg-slate-500",
  },
];

