export const POS_SHORTCUTS = {
  SCAN: "F1",
  HOLD: "F2",
  CLEAR: "F4",
  CHECKOUT: "F8",
} as const;

export const DEFAULT_STORE = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  name_lo: "QuickOne",
  name_en: "QuickOne",
  branch: "ສາຂາ: ດົງໂດກ, ນະຄອນຫຼວງວຽງຈັນ",
  phone: "55257555",
  taxCode: "0102030405", 
  currency: "LAK",
};

export const DEFAULT_CASHIER = {
  id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
  name: "ພະນັກງານຂາຍ (Cashier)",
  role: "cashier" as const,
  shiftNumber: "",
};
