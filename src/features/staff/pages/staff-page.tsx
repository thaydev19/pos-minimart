"use client";

// ============================================================================
// StaffPage: Complete Staff & Role-Based Access Control Management
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
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
import { StaffUser, StaffRole, CreateStaffInput, UpdateStaffInput } from "../types/staff.types";
import { StaffTable } from "../components/StaffTable";
import { StaffFormModal } from "../components/StaffFormModal";
import { StaffPinModal } from "../components/StaffPinModal";
import { triggerHapticFeedback } from "@/utils/haptics";

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

  return (
    <div className="flex-1 space-y-5 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto">
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

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                ຈັດການພະນັກງານ (Staff Management)
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                ຄຸ້ມຄອງບັນຊີຜູ້ໃຊ້ງານ, ກຳນົດສິດການເຂົ້າເຖິງ ແລະ ລະຫັດ PIN ປະຈຳຕົວ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="flex h-10 items-center gap-1.5 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-500 ${isRefetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">ໂຫຼດໃໝ່</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex h-10 items-center gap-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ ເພີ່ມພະນັກງານໃໝ່</span>
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold">ພະນັກງານທັງໝົດ</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.total} <span className="text-xs font-normal text-slate-400">ຄົນ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">ບັນຊີທີ່ໄດ້ລົງທະບຽນ</div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1.5">
            <span className="text-xs font-bold">ກຳລັງປະຕິບັດງານ</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {stats.active} <span className="text-xs font-normal text-emerald-600">ຄົນ</span>
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">ພ້ອມເຂົ້າສູ່ລະບົບ</div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 mb-1.5">
            <span className="text-xs font-bold">ຜູ້ຈັດການ & ເຈົ້າຂອງ</span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono">
            {stats.managers} <span className="text-xs font-normal text-blue-600">ຄົນ</span>
          </div>
          <div className="text-[11px] text-blue-600/80 mt-0.5">ມີສິດເຂົ້າຫຼັງຮ້ານ</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold">ພະນັກງານຂາຍໜ້າຮ້ານ</span>
            <KeyRound className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.cashiers} <span className="text-xs font-normal text-slate-400">ຄົນ</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">ປະຈຳຈຸດຂາຍ POS</div>
        </div>
      </div>

      {/* Toolbar: Search & Filter Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ຄົ້ນຫາຊື່ພະນັກງານ, username, ອີເມວ..."
            className="h-10 w-full pl-9.5 pr-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10 transition-all"
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "ທັງໝົດ" },
            { id: "owner", label: "ເຈົ້າຂອງຮ້ານ" },
            { id: "store_manager", label: "ຜູ້ຈັດການ" },
            { id: "cashier", label: "ພະນັກງານຂາຍ" },
          ].map((pill) => {
            const isActive = roleFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setRoleFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff Directory Table */}
      <StaffTable
        staffList={filteredStaff}
        isLoading={isLoading}
        onEdit={handleOpenEditModal}
        onChangePin={handleOpenPinModal}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteStaff}
      />

      {/* Modals */}
      <StaffFormModal
        staff={editingStaff}
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingStaff(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {pinEditingStaff && (
        <StaffPinModal
          staff={pinEditingStaff}
          isOpen={Boolean(pinEditingStaff)}
          onClose={() => setPinEditingStaff(null)}
          onSavePin={handleSavePin}
        />
      )}
    </div>
  );
}
