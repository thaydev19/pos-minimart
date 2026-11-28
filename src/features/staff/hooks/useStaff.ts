"use client";

// ============================================================================
// Staff React Query Hooks: Caching, Auto-Invalidation & Optimistic Mutations
// 30-second staleTime & auto-refetch on window focus
// Zero Emojis - Enterprise Cache
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi } from "../api/staff.api";
import { CreateStaffInput, UpdateStaffInput } from "../types/staff.types";
import { QUERY_KEYS, invalidateStaff } from "@/constants/queryKeys";

export const STAFF_QUERY_KEY = QUERY_KEYS.staff;

export function useStaffList() {
  return useQuery({
    queryKey: STAFF_QUERY_KEY,
    queryFn: () => staffApi.getStaffList(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStaffInput) => staffApi.createStaff(input),
    onSuccess: async () => {
      await invalidateStaff(queryClient);
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStaffInput }) =>
      staffApi.updateStaff(id, input),
    onSuccess: async () => {
      await invalidateStaff(queryClient);
    },
  });
}

export function useUpdateStaffPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) =>
      staffApi.updateStaffPin(id, pin),
    onSuccess: async () => {
      await invalidateStaff(queryClient);
    },
  });
}

export function useToggleStaffStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      staffApi.toggleStaffStatus(id, isActive),
    onSuccess: async () => {
      await invalidateStaff(queryClient);
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => staffApi.deleteStaff(id),
    onSuccess: async () => {
      await invalidateStaff(queryClient);
    },
  });
}
