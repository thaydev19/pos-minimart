// ============================================================================
// Auth & Permissions Type Definitions - Enterprise Lao Retail POS
// 100% Real Supabase Auth & Multi-role Access Control
// ============================================================================

export type UserRole = "super_admin" | "owner" | "store_manager" | "cashier";

export interface AuthUser {
  id: string;
  store_id: string;
  username: string;
  email?: string;
  full_name_lo: string;
  role: UserRole;
  is_active: boolean;
  store_name_lo?: string;
  store_branch?: string;
  pin_hash?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
  token?: string;
}

export interface PinVerifyResult {
  valid: boolean;
  managerId?: string;
  managerName?: string;
  role?: UserRole;
  error?: string;
}
