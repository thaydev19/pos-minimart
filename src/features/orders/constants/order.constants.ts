// ============================================================================
// Order Constants: Statuses, Payment Methods & Void Reasons
// ============================================================================

export const ORDER_PAYMENT_METHODS = {
  cash: {
    label_lo: "ເງິນສົດ (Cash)",
    short_lo: "ເງິນສົດ",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  transfer: {
    label_lo: "ໂອນ LAO QR (Transfer)",
    short_lo: "LAO QR",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  lao_qr: {
    label_lo: "ໂອນ LAO QR (Transfer)",
    short_lo: "LAO QR",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  card: {
    label_lo: "ບັດທະນາຄານ (Card)",
    short_lo: "ບັດ",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
  },
  mixed: {
    label_lo: "ຊຳລະປະສົມ (Mixed)",
    short_lo: "ປະສົມ",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  },
} as const;

export const ORDER_STATUS_CONFIG = {
  completed: {
    label_lo: "ສຳເລັດແລ້ວ",
    bgClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  cancelled: {
    label_lo: "ຍົກເລີກແລ້ວ",
    bgClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
  refunded: {
    label_lo: "ສົ່ງຄືນເງິນ",
    bgClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
} as const;

export const VOID_ORDER_REASONS = [
  {
    code: "CASHIER_ERROR",
    label_lo: "ພະນັກງານກົດຜິດ / ຍິງບາໂຄດຜິດ",
    description_lo: "ພະນັກງານກົດລາຍການສິນຄ້າ ຫຼື ຈຳນວນຜິດພາດ",
  },
  {
    code: "CUSTOMER_CHANGE_MIND",
    label_lo: "ລູກຄ້າປ່ຽນໃຈ / ຍົກເລີກການຊື້",
    description_lo: "ລູກຄ້າບໍ່ຕ້ອງການສິນຄ້າ ຫຼື ບໍ່ມີເງິນພໍຊຳລະ",
  },
  {
    code: "DEFECTIVE_PRODUCT",
    label_lo: "ສິນຄ້າຊຳລຸດ / ສົ່ງຄືນສິນຄ້າ",
    description_lo: "ສິນຄ້າມີບັນຫາ, ໝົດອາຍຸ ຫຼື ເສຍຫາຍ",
  },
  {
    code: "PAYMENT_FAILED",
    label_lo: "ລະບົບຊຳລະເງິນຂັດຂ້ອງ",
    description_lo: "ການໂອນເງິນບໍ່ສຳເລັດ ຫຼື ຕັດເງິນຜິດພາດ",
  },
  {
    code: "OTHER",
    label_lo: "ເຫດຜົນອື່ນໆ",
    description_lo: "ລະບຸໃນໝາຍເຫດເພີ່ມເຕີມ",
  },
];

export const DEFAULT_MANAGER_PIN = "1234";

