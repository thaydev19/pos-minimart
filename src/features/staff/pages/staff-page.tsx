"use client";

// ============================================================================
// StaffPage: Enterprise Staff & Role-Based Access Control Management
// 100% Consistent with ProductsPage, CategoriesPage, and InventoryPage Architecture
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Shield,
  Search,
  RefreshCw,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import {
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
  useUpdateStaffPin,
  useToggleStaffStatus,
  useDeleteStaff,
} from "../hooks/useStaff";
import { StaffUser, CreateStaffInput, UpdateStaffInput } from "../types/staff.types";
import { StaffTable } from "../components/StaffTable";
import { StaffFormModal } from "../components/StaffFormModal";
import { StaffPinModal } from "../components/StaffPinModal";
import { triggerHapticFeedback } from "@/utils/haptics";
import { HeaderRefreshButton } from "@/components/HeaderRefreshButton";

export function StaffPage() {
  const { data: staffList = [], isLoading, refetch, isRefetching } = useStaffList();

  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const updatePinMutation = useUpdateStaffPin();
  const toggleStatusMutation = useToggleStaffStatus();
  const deleteMutation = useDeleteStaff();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [pinEditingStaff, setPinEditingStaff] = useState<StaffUser | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const matchSearch =
        staff.full_name_lo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staff.email && staff.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === "all" || staff.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [staffList, searchTerm, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.is_active).length;
    const managers = staffList.filter((s) => s.role === "owner" || s.role === "store_manager").length;
    const cashiers = staffList.filter((s) => s.role === "cashier").length;
    return { total, active, managers, cashiers };
  }, [staffList]);

  // Handlers
  const handleOpenCreateModal = () => {
    triggerHapticFeedback(20);
    setEditingStaff(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffUser) => {
    triggerHapticFeedback(20);
    setEditingStaff(staff);
    setIsFormModalOpen(true);
  };

  const handleOpenPinModal = (staff: StaffUser) => {
    triggerHapticFeedback(20);
    setPinEditingStaff(staff);
  };

  const handleFormSubmit = async (
    data: CreateStaffInput | { id: string; input: UpdateStaffInput }
  ) => {
    if ("id" in data) {
      await updateMutation.mutateAsync({ id: data.id, input: data.input });
      showToast("ອັບເດດຂໍ້ມູນພະນັກງານສຳເລັດແລ້ວ");
    } else {
      await createMutation.mutateAsync(data);
      showToast("ເພີ່ມພະນັກງານໃໝ່ສຳເລັດແລ້ວ");
    }
  };

  const handleSavePin = async (staffId: string, newPin: string) => {
    await updatePinMutation.mutateAsync({ id: staffId, pin: newPin });
    showToast("ປ່ຽນລະຫັດ PIN ໃໝ່ສຳເລັດແລ້ວ");
  };

  const handleToggleStatus = async (staff: StaffUser) => {
    triggerHapticFeedback(30);
    try {
      await toggleStatusMutation.mutateAsync({
        id: staff.id,
        isActive: !staff.is_active,
      });
      showToast(
        !staff.is_active
          ? `ເປີດການໃຊ້ງານ ${staff.full_name_lo} ແລ້ວ`
          : `ປິດການໃຊ້ງານ ${staff.full_name_lo} ແລ້ວ`
      );
    } catch (err: any) {
      showToast(err.message || "ປ່ຽນສະຖານະບໍ່ສຳເລັດ", "error");
    }
  };

  const handleDeleteStaff = async (staff: StaffUser) => {
    triggerHapticFeedback(40);
    const confirmed = window.confirm(
      `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບພະນັກງານ "${staff.full_name_lo}" (@${staff.username}) ອອກຈາກລະບົບ?`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(staff.id);
      showToast(`ລຶບພະນັກງານ ${staff.full_name_lo} ສຳເລັດແລ້ວ`);
    } catch (err: any) {
      showToast(err.message || "ລຶບພະນັກງານບໍ່ສຳເລັດ", "error");
    }
  };

  const roleFilterTabs = [
    { key: "all", label: "ທັງໝົດ" },
    { key: "owner", label: "ເຈົ້າຂອງຮ້ານ" },
    { key: "store_manager", label: "ຜູ້ຈັດການ" },
    { key: "cashier", label: "ພະນັກງານຂາຍ" },
  ];

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-xl border animate-in slide-in-from-bottom duration-200 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20"
              : "bg-rose-600 text-white border-rose-500 shadow-rose-600/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* 1. Header Bar & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              ຈັດການພະນັກງານ (Staff Management)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ຄຸ້ມຄອງບັນຊີຜູ້ໃຊ້ງານ, ກຳນົດສິດການເຂົ້າເຖິງ ແລະ ລະຫັດ PIN ປະຈຳຕົວ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HeaderRefreshButton />

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>ເພີ່ມພະນັກງານໃໝ່</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Compact 2-Line Design) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Staff */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold text-slate-600 truncate">ພະນັກງານທັງໝົດ</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 shrink-0">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-tight">
            {stats.total} <span className="text-[11px] font-normal text-slate-400">ຄົນ</span>
          </div>
        </div>

        {/* Active Staff */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold text-slate-600 truncate">ກຳລັງປະຕິບັດງານ</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 shrink-0">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-600 tabular-nums mt-1 leading-tight">
            {stats.active} <span className="text-[11px] font-normal text-slate-400">ຄົນ</span>
          </div>
        </div>

        {/* Managers & Owners */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold text-slate-600 truncate">ຜູ້ຈັດການ & ເຈົ້າຂອງ</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 shrink-0">
              <Shield className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-tight">
            {stats.managers} <span className="text-[11px] font-normal text-slate-400">ຄົນ</span>
          </div>
        </div>

        {/* Cashiers */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold text-slate-600 truncate">ພະນັກງານຂາຍ</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-700 shrink-0">
              <KeyRound className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums mt-1 leading-tight">
            {stats.cashiers} <span className="text-[11px] font-normal text-slate-400">ຄົນ</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ຄົ້ນຫາຊື່ພະນັກງານ, username, ອີເມວ..."
            className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {roleFilterTabs.map((tab) => {
            const isActive = roleFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Staff Directory Table */}
      <StaffTable
        staffList={filteredStaff}
        isLoading={isLoading}
        onEdit={handleOpenEditModal}
        onChangePin={handleOpenPinModal}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteStaff}
        onAddNew={handleOpenCreateModal}
      />

      {/* Staff Create / Edit Modal */}
      <StaffFormModal
        key={`staff-modal-${editingStaff?.id || "new"}-${isFormModalOpen}`}
        staff={editingStaff}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Touch 6-Digit PIN Modal */}
      <StaffPinModal
        key={`pin-modal-${pinEditingStaff?.id || "none"}-${Boolean(pinEditingStaff)}`}
        staff={pinEditingStaff}
        isOpen={Boolean(pinEditingStaff)}
        onClose={() => setPinEditingStaff(null)}
        onSavePin={handleSavePin}
      />
    </div>
  );
}
