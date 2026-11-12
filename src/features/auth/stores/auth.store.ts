// ============================================================================
// Auth Store: Persistent State Management for Real Session & Manager PIN
// Supports Offline POS Graceful Fallback & Fast Hydration
// ============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthUser, LoginCredentials } from "../types/auth.types";
import { authApi } from "../api/auth.api";
import { AUTH_STORAGE_KEY } from "../constants/auth.constants";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  isPinModalOpen: boolean;
  pinReason: string;
  onPinSuccessCallback: (() => void) | null;

  // Actions
  initAuth: () => Promise<AuthUser | null>;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  requireManagerPin: (reason: string, callback: () => void) => void;
  closePinModal: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,
      isPinModalOpen: false,
      pinReason: "",
      onPinSuccessCallback: null,

      initAuth: async () => {
        // Fast path: if already have user in persisted state, we're ready
        const currentUser = get().user;

        // Try to verify with live Supabase session if online
        if (typeof window !== "undefined" && navigator.onLine) {
          try {
            const liveUser = await authApi.getCurrentSessionUser();
            if (liveUser) {
              set({ user: liveUser, isInitialized: true, isLoading: false });
              return liveUser;
            } else if (!currentUser) {
              set({ user: null, isInitialized: true, isLoading: false });
              return null;
            }
          } catch {
            // Keep persisted user for offline mode
          }
        }

        set({ isInitialized: true, isLoading: false });
        return currentUser;
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const authUser = await authApi.login(credentials);
          set({ user: authUser, isInitialized: true, isLoading: false });
          return authUser;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } finally {
          set({ user: null, isInitialized: true, isLoading: false });
        }
      },

      setUser: (user: AuthUser | null) => {
        set({ user });
      },

      requireManagerPin: (reason: string, callback: () => void) => {
        set({
          isPinModalOpen: true,
          pinReason: reason,
          onPinSuccessCallback: callback,
        });
      },

      closePinModal: () => {
        set({
          isPinModalOpen: false,
          pinReason: "",
          onPinSuccessCallback: null,
        });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
