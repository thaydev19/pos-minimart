// ============================================================================
// Shift Constants: Lao Kip Denominations, Status Presets & Cash Defaults
// ============================================================================

export const LAO_KIP_DENOMINATIONS = [
  100000,
  50000,
  20000,
  10000,
  5000,
  2000,
  1000,
] as const;

export const STARTING_CASH_PRESETS = [
  200000,
  300000,
  500000,
  1000000,
];

export const SHIFT_STATUS_LABELS = {
  open: {
    label_lo: "ກຳລັງເປີດຂາຍ (Open)",
    bgClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  closed: {
    label_lo: "ປິດກະແລ້ວ (Closed)",
    bgClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  audited: {
    label_lo: "ກວດສອບແລ້ວ (Audited)",
    bgClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
};

