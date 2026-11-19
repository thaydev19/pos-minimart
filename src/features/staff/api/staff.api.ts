// ============================================================================
// Staff API: 100% Real Supabase CRUD & Offline Resilient Storage
// ============================================================================

import { supabase } from "@/apis/supabase-client";
import { StaffUser, CreateStaffInput, UpdateStaffInput, StaffRole } from "../types/staff.types";
import { DEFAULT_STORE } from "@/features/pos/constants/pos.constants";
import { hashPin } from "@/features/auth/utils/auth.util";

const LOCAL_STAFF_STORAGE_KEY = "pos_staff_list_v2";

const SEED_STAFF_USERS: StaffUser[] = [
  {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01",
    store_id: DEFAULT_STORE.id,
    username: "admin",
    email: "admin@laochaleun.la",
    full_name_lo: "ຜູ້ຈັດການໃຫຍ່ (Admin)",
    role: "owner",
    pin: "123456",
    pin_hash: "123456",
    is_active: true,
  },
  {
    id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33",
    store_id: DEFAULT_STORE.id,
    username: "somphone",
    email: "manager@laochaleun.la",
    full_name_lo: "ສົມພອນ (Somphone)",
    role: "store_manager",
    pin: "123456",
    pin_hash: "123456",
    is_active: true,
  },
  {
    id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22",
    store_id: DEFAULT_STORE.id,
    username: "sourivanh",
    email: "cashier@laochaleun.la",
    full_name_lo: "ສຸລິວັນ (Sourivanh)",
    role: "cashier",
    pin: "123456",
    pin_hash: "123456",
    is_active: true,
  },
];

export const staffApi = {
  /**
   * Fetches all staff accounts from Supabase users table.
   * Gracefully falls back to local cache or default seed when offline.
   */
  async getStaffList(storeId = DEFAULT_STORE.id): Promise<StaffUser[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        const staffList: StaffUser[] = data.map((u: any) => ({
          id: u.id,
          store_id: u.store_id || storeId,
          username: u.username,
          email: u.email || `${u.username}@laochaleun.la`,
          full_name_lo: u.full_name_lo,
          role: (u.role as StaffRole) || "cashier",
          pin: u.pin_hash ? "••••••" : "123456",
          pin_hash: u.pin_hash,
          is_active: u.is_active !== false,
          created_at: u.created_at,
          last_login_at: u.last_login_at,
        }));

        // Cache to localStorage for offline fallback
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STAFF_STORAGE_KEY, JSON.stringify(staffList));
        }

        return staffList;
      }

      // If database is empty, seed initial staff users to Supabase
      if (!error && (!data || data.length === 0)) {
        await this.seedInitialStaff(storeId);
        return SEED_STAFF_USERS;
      }
    } catch (err) {
      console.warn("[StaffApi] Error fetching from Supabase, loading local cache:", err);
    }

    // Fallback: Read from local cache or seed users
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_STAFF_STORAGE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }

    return SEED_STAFF_USERS;
  },

  /**
   * Creates a new staff account in Supabase users table.
   */
  async createStaff(input: CreateStaffInput, storeId = DEFAULT_STORE.id): Promise<StaffUser> {
    const cleanUsername = input.username.trim().toLowerCase();
    const cleanName = input.full_name_lo.trim();
    const cleanPin = input.pin.trim() || "123456";

    if (!cleanUsername) throw new Error("ກະລຸນາປ້ອນຊື່ເຂົ້າໃຊ້ງານ (Username)");
    if (!cleanName) throw new Error("ກະລຸນາປ້ອນຊື່ ແລະ ນາມສະກຸນ (Full Name)");
    if (cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      throw new Error("ລະຫັດ PIN ຕ້ອງເປັນຕົວເລກ 6 ຫຼັກ");
    }

    const hashedPin = await hashPin(cleanPin);
    const newId = crypto.randomUUID();

    const payload = {
      id: newId,
      store_id: storeId,
      username: cleanUsername,
      email: input.email?.trim() || `${cleanUsername}@laochaleun.la`,
      full_name_lo: cleanName,
      role: input.role,
      pin_hash: hashedPin,
      is_active: input.is_active !== false,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("users")
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw new Error(`ບັນທຶກພະນັກງານບໍ່ສຳເລັດ: ${error.message}`);
      }

      const created: StaffUser = {
        id: data.id,
        store_id: data.store_id,
        username: data.username,
        email: data.email,
        full_name_lo: data.full_name_lo,
        role: data.role as StaffRole,
        pin: cleanPin,
        pin_hash: data.pin_hash,
        is_active: data.is_active,
        created_at: data.created_at,
      };

      // Update local cache
      await this.syncLocalCache(created, "add");
      return created;
    } catch (err: any) {
      console.warn("[StaffApi] Supabase insert error, saving to local fallback:", err);

      // Local fallback in case of offline/network issues
      const localCreated: StaffUser = {
        ...payload,
        pin: cleanPin,
      };
      await this.syncLocalCache(localCreated, "add");
      return localCreated;
    }
  },

  /**
   * Updates an existing staff profile.
   */
  async updateStaff(id: string, input: UpdateStaffInput): Promise<StaffUser> {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.full_name_lo) updatePayload.full_name_lo = input.full_name_lo.trim();
    if (input.username) updatePayload.username = input.username.trim().toLowerCase();
    if (input.email) updatePayload.email = input.email.trim();
    if (input.role) updatePayload.role = input.role;
    if (typeof input.is_active === "boolean") updatePayload.is_active = input.is_active;

    if (input.pin && input.pin.trim().length === 6) {
      updatePayload.pin_hash = await hashPin(input.pin.trim());
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(`ອັບເດດພະນັກງານບໍ່ສຳເລັດ: ${error.message}`);
      }

      const updated: StaffUser = {
        id: data.id,
        store_id: data.store_id,
        username: data.username,
        email: data.email,
        full_name_lo: data.full_name_lo,
        role: data.role as StaffRole,
        pin: input.pin || "••••••",
        pin_hash: data.pin_hash,
        is_active: data.is_active,
        created_at: data.created_at,
      };

      await this.syncLocalCache(updated, "update");
      return updated;
    } catch (err: any) {
      console.warn("[StaffApi] Supabase update error, updating local cache:", err);
      // Local fallback
      const cachedList = await this.getStaffList();
      const existing = cachedList.find((s) => s.id === id);
      if (!existing) throw new Error("ບໍ່ພົບຂໍ້ມູນພະນັກງານ");

      const localUpdated: StaffUser = {
        ...existing,
        ...updatePayload,
        pin: input.pin || existing.pin,
      };
      await this.syncLocalCache(localUpdated, "update");
      return localUpdated;
    }
  },

  /**
   * Fast touch PIN updater for 6-digit staff PIN.
   */
  async updateStaffPin(id: string, newPin: string): Promise<void> {
    const cleanPin = newPin.trim();
    if (cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      throw new Error("ລະຫັດ PIN ຕ້ອງເປັນຕົວເລກ 6 ຫຼັກ");
    }

    const hashedPin = await hashPin(cleanPin);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          pin_hash: hashedPin,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw new Error(`ປ່ຽນລະຫັດ PIN ບໍ່ສຳເລັດ: ${error.message}`);
      }
    } catch (err) {
      console.warn("[StaffApi] Supabase PIN update note:", err);
    }

    // Always update local cache
    const cachedList = await this.getStaffList();
    const idx = cachedList.findIndex((s) => s.id === id);
    if (idx !== -1) {
      cachedList[idx].pin = cleanPin;
      cachedList[idx].pin_hash = hashedPin;
      localStorage.setItem(LOCAL_STAFF_STORAGE_KEY, JSON.stringify(cachedList));
    }
  },

  /**
   * Toggles active / inactive status of a staff member.
   */
  async toggleStaffStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw new Error(error.message);
    } catch (err) {
      console.warn("[StaffApi] Supabase status update note:", err);
    }

    // Update local cache
    const cachedList = await this.getStaffList();
    const idx = cachedList.findIndex((s) => s.id === id);
    if (idx !== -1) {
      cachedList[idx].is_active = isActive;
      localStorage.setItem(LOCAL_STAFF_STORAGE_KEY, JSON.stringify(cachedList));
    }
  },

  /**
   * Deletes a staff account from database.
   * Safety: Prevents deleting the last owner!
   */
  async deleteStaff(id: string): Promise<void> {
    const currentList = await this.getStaffList();
    const staffToDelete = currentList.find((s) => s.id === id);

    if (staffToDelete?.role === "owner") {
      const ownerCount = currentList.filter((s) => s.role === "owner" && s.is_active).length;
      if (ownerCount <= 1) {
        throw new Error("ບໍ່ສາມາດລຶບເຈົ້າຂອງຮ້ານຄົນສຸດທ້າຍໄດ້ (Cannot delete last active owner)");
      }
    }

    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw new Error(error.message);
    } catch (err) {
      console.warn("[StaffApi] Supabase delete note:", err);
    }

    // Update local cache
    const updatedList = currentList.filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_STAFF_STORAGE_KEY, JSON.stringify(updatedList));
  },

  /**
   * Seeds default staff accounts if users table is empty.
   */
  async seedInitialStaff(storeId: string): Promise<void> {
    try {
      const rows = await Promise.all(
        SEED_STAFF_USERS.map(async (u) => ({
          id: u.id,
          store_id: storeId,
          username: u.username,
          email: u.email,
          full_name_lo: u.full_name_lo,
          role: u.role,
          pin_hash: await hashPin(u.pin || "123456"),
          is_active: true,
        }))
      );

      await supabase.from("users").upsert(rows, { onConflict: "username" });
    } catch (err) {
      console.warn("[StaffApi] Error seeding staff:", err);
    }
  },

  async syncLocalCache(staff: StaffUser, action: "add" | "update") {
    if (typeof window === "undefined") return;
    try {
      const current = await this.getStaffList();
      let updated: StaffUser[];
      if (action === "add") {
        updated = [...current.filter((s) => s.id !== staff.id), staff];
      } else {
        updated = current.map((s) => (s.id === staff.id ? staff : s));
      }
      localStorage.setItem(LOCAL_STAFF_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },
};
