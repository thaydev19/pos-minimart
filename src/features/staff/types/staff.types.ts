// ============================================================================
// Staff & User Management Types - Enterprise Lao POS
// ============================================================================

export type StaffRole = "owner" | "store_manager" | "cashier";

export interface StaffUser {
  id: string;
  store_id: string;
  username: string;
  email?: string;
  full_name_lo: string;
  role: StaffRole;
  pin?: string;
  pin_hash?: string;
  is_active: boolean;
  created_at?: string;
  last_login_at?: string;
}

export interface CreateStaffInput {
  username: string;
  full_name_lo: string;
  email?: string;
  role: StaffRole;
  pin: string;
  is_active?: boolean;
}

export interface UpdateStaffInput {
  full_name_lo?: string;
  username?: string;
  email?: string;
  role?: StaffRole;
  pin?: string;
  is_active?: boolean;
}

export interface RoleConfigItem {
  id: StaffRole;
  label_lo: string;
  label_en: string;
  description_lo: string;
  badgeClass: string;
}

export const STAFF_ROLES_CONFIG: Record<StaffRole, RoleConfigItem> = {
  owner: {
    id: "owner",
    label_lo: "ເຈົ້າຂອງຮ້ານ (Owner)",
    label_en: "Store Owner / Admin",
    description_lo: "ມີສິດທຸກຢ່າງໃນລະບົບ: ຄຸ້ມຄອງພະນັກງານ, ເບິ່ງຕົ້ນທຶນ ແລະ ລາຍງານການເງິນ",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  store_manager: {
    id: "store_manager",
    label_lo: "ຜູ້ຈັດການຮ້ານ (Manager)",
    label_en: "Store Manager",
    description_lo: "ຈັດການສາງ, ຮັບສິນຄ້າ GRN, ດັດປັບສະຕັອກ, ອະນຸມັດຍົກເລີກບິນ ແລະ ປິດກະ",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  cashier: {
    id: "cashier",
    label_lo: "ພະນັກງານຂາຍ (Cashier)",
    label_en: "POS Cashier",
    description_lo: "ຂາຍເຄື່ອງໜ້າຮ້ານ POS, ຍິງບາໂຄດ, ຮັບເງິນ ແລະ ປິດກະ (ເຊື່ອງຕົ້ນທຶນສິນຄ້າ)",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};
