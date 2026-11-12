// ============================================================================
// Auth Constants: Roles, Permissions & Lao Error Messages
// Zero Mock Data - Enterprise Retail POS Architecture
// ============================================================================

import { UserRole } from "../types/auth.types";

export const USER_ROLES_CONFIG = {
  owner: {
    label_lo: "ເຈົ້າຂອງຮ້ານ (Owner)",
    short_lo: "ເຈົ້າຂອງ",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  store_manager: {
    label_lo: "ຜູ້ຈັດການ (Manager)",
    short_lo: "ຜູ້ຈັດການ",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  cashier: {
    label_lo: "ພະນັກງານຂາຍ (Cashier)",
    short_lo: "ພະນັກງານ",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  super_admin: {
    label_lo: "ຜູ້ດູແລລະບົບ (Super Admin)",
    short_lo: "Admin",
    badgeClass: "bg-slate-800 text-white border-slate-700",
  },
} as const;

export const BACKOFFICE_ALLOWED_ROLES: UserRole[] = [
  "super_admin",
  "owner",
  "store_manager",
];

export const AUTH_STORAGE_KEY = "lao_pos_supabase_auth_session_v2";

/**
 * Standard Supabase Auth error messages translated to fluent Lao
 */
export const AUTH_ERROR_MESSAGES_LO: Record<string, string> = {
  "Invalid login credentials": "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ",
  "Email not confirmed": "ອີເມວນີ້ຍັງບໍ່ທັນໄດ້ຮັບການຢືນຢັນ",
  "User not found": "ບໍ່ພົບຜູ້ໃຊ້ນີ້ໃນລະບົບ",
  "Too many requests": "ມີການຮ້ອງຂໍຫຼາຍເກີນໄປ, ກະລຸນາລໍຖ້າ 1 ນາທີແລ້ວລອງໃໝ່",
  "Password should be at least 6 characters": "ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ",
  "User already registered": "ອີເມວນີ້ໄດ້ລົງທະບຽນໃນລະບົບແລ້ວ",
  "Network error": "ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້, ກະລຸນາກວດສອບອິນເຕີເນັດ",
  "Account suspended": "ບັນຊີຂອງທ່ານຖືກລະງັບການໃຊ້ງານ",
  "No store assigned": "ບັນຊີນີ້ຍັງບໍ່ໄດ້ເຊື່ອມໂຍງກັບຮ້ານຄ້າໃດໆ",
};
