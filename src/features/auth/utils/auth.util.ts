// ============================================================================
// Auth Utilities: Role Authorization & Session Security Helpers
// ============================================================================

import { UserRole } from "../types/auth.types";
import {
  BACKOFFICE_ALLOWED_ROLES,
  USER_ROLES_CONFIG,
  AUTH_ERROR_MESSAGES_LO,
} from "../constants/auth.constants";

export function canAccessBackoffice(role?: UserRole | null): boolean {
  if (!role) return false;
  return BACKOFFICE_ALLOWED_ROLES.includes(role);
}

export function formatRoleLabel(role?: UserRole | null): string {
  if (!role) return "ພະນັກງານ";
  return USER_ROLES_CONFIG[role]?.label_lo || role;
}

export function getRoleBadgeClass(role?: UserRole | null): string {
  if (!role) return "bg-slate-100 text-slate-700 border-slate-200";
  return USER_ROLES_CONFIG[role]?.badgeClass || "bg-slate-100 text-slate-700 border-slate-200";
}

/**
 * Translates Supabase authentication error into fluent Lao
 */
export function translateAuthError(errorMsg?: string | null): string {
  if (!errorMsg) return "ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ ກະລຸນາກວດສອບອີກຄັ້ງ";

  for (const [enKey, loVal] of Object.entries(AUTH_ERROR_MESSAGES_LO)) {
    if (errorMsg.toLowerCase().includes(enKey.toLowerCase())) {
      return loVal;
    }
  }

  return errorMsg;
}

/**
 * Native Web Crypto SHA-256 for secure PIN verification
 */
export async function hashPin(pin: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
