// ============================================================================
// Inventory Constants: Lao Localization, Thresholds & Audit Reasons
// ============================================================================

export const EXPIRY_THRESHOLDS = {
  CRITICAL_DAYS: 7,
  WARNING_DAYS: 30,
} as const;

export const LOW_STOCK_THRESHOLD = 10;

export interface AdjustmentReasonOption {
  code: string;
  label_lo: string;
  description_lo: string;
}

export const ADJUSTMENT_REASONS: AdjustmentReasonOption[] = [
  {
    code: "COUNT_AUDIT",
    label_lo: "ກວດນັບປັບຍອດສາງ",
    description_lo: "ປັບຍອດຕົວຈິງຕາມການກວດນັບສະຕັອກປະຈຳເດືອນ/ອາທິດ",
  },
  {
    code: "DAMAGE_BREAKAGE",
    label_lo: "ສິນຄ້າເສຍຫາຍ / ແຕກຫັກ",
    description_lo: "ສິນຄ້າເກີດການແຕກຫັກ, ບຸບສະຫຼາຍ, ບໍ່ສາມາດວາງຂາຍໄດ້",
  },
  {
    code: "EXPIRED_DISCARD",
    label_lo: "ສິນຄ້າໝົດອາຍຸ (ຕັດຈ່າຍ)",
    description_lo: "ຕັດຈ່າຍສິນຄ້າທີ່ກາຍວັນໝົດອາຍຸອອກຈາກສາງ",
  },
  {
    code: "SHRINKAGE_MISSING",
    label_lo: "ສິນຄ້າສູນຫາຍ / ຂາດສາງ",
    description_lo: "ຈຳນວນຕົວຈິງໜ້ອຍກວ່າໃນລະບົບ (ຖືກລັກ ຫຼື ເສຍຫາຍ)",
  },
  {
    code: "RETURN_SUPPLIER",
    label_lo: "ສົ່ງຄືນຜູ້ສະໜອງ (Supplier)",
    description_lo: "ສົ່ງຄືນສິນຄ້າມີບັນຫາ ຫຼື ໃກ້ໝົດອາຍຸໃຫ້ໂຮງງານ/ຕົວແທນ",
  },
  {
    code: "INTERNAL_USE",
    label_lo: "ນຳໃຊ້ພາຍໃນຮ້ານ / ຕົວຢ່າງ",
    description_lo: "ນຳໃຊ້ເປັນເຄື່ອງໃຊ້ໃນຮ້ານ ຫຼື ສິນຄ້າທົດລອງ",
  },
];

export const BATCH_NUMBER_PREFIX = "LOT";

