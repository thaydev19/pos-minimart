"use client";

// ============================================================================
// StaffTable: Responsive Enterprise Staff Directory Table
// 100% Consistent with ProductTable & CategoryTable UI Architecture
// ============================================================================

import React, { useState } from "react";
import {
  KeyRound,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import { StaffUser, STAFF_ROLES_CONFIG } from "../types/staff.types";

interface StaffTableProps {
  staffList: StaffUser[];
  isLoading: boolean;
  onEdit: (staff: StaffUser) => void;
  onChangePin: (staff: StaffUser) => void;
  onToggleStatus: (staff: StaffUser) => void;
  onDelete: (staff: StaffUser) => void;
  onAddNew?: () => void;
}

export function StaffTable({
  staffList,
  isLoading,
  onEdit,
  onChangePin,
  onToggleStatus,
  onDelete,
  onAddNew,
}: StaffTableProps) {
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  const togglePinVisibility = (staffId: string) => {
    setVisiblePins((prev) => ({
      ...prev,
      [staffId]: !prev[staffId],
    }));
  };
  if (isLoading && staffList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200/80">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-500">
          ກຳລັງໂຫຼດລາຍຊື່ພະນັກງານ...
        </p>
      </div>
    );
  }

  if (staffList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200/80 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">ບໍ່ພົບຂໍ້ມູນພະນັກງານ</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          ບໍ່ມີຂໍ້ມູນທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ ຫຼື ຍັງບໍ່ໄດ້ເພີ່ມພະນັກງານເຂົ້າສູ່ລະບົບ
        </p>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>ເພີ່ມພະນັກງານທຳອິດ</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
      <div className="overflow-x-auto touch-pan-x touch-pan-y overscroll-x-contain">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-slate-50/80 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">ພະນັກງານ (Staff Member)</th>
              <th className="py-3 px-3">ຊື່ເຂົ້າໃຊ້ງານ (Username)</th>
              <th className="py-3 px-3">ສິດການໃຊ້ງານ (Role)</th>
              <th className="py-3 px-3 text-center">ລະຫັດ PIN</th>
              <th className="py-3 px-3 text-center">ສະຖານະ</th>
              <th className="py-3 px-4 text-center">ຈັດການ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {staffList.map((staff) => {
              const roleConfig = STAFF_ROLES_CONFIG[staff.role];
              const initials =
                staff.full_name_lo
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("") || "ST";

              return (
                <tr
                  key={staff.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* Name & Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-100 shadow-2xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {staff.full_name_lo}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {staff.email || "ບໍ່ມີອີເມວ"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Username */}
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    @{staff.username}
                  </td>

                  {/* Role */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleConfig.badgeClass}`}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      <span>{roleConfig.label_lo}</span>
                    </span>
                  </td>

                  {/* PIN Toggle Show/Hide */}
                  <td className="py-3 px-3 text-center">
                    {(() => {
                      const isPinVisible = Boolean(visiblePins[staff.id]);
                      const rawPin = staff.pin || staff.pin_hash || "123456";

                      return (
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(staff.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95 ${
                            isPinVisible
                              ? "border-emerald-300 bg-emerald-50 text-emerald-850 shadow-xs"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                          title={
                            isPinVisible
                              ? "ກົດເພື່ອເຊື່ອງລະຫັດ PIN"
                              : "ກົດເພື່ອເບິ່ງລະຫັດ PIN"
                          }
                        >
                          {isPinVisible ? (
                            <>
                              <EyeOff className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span className="tracking-widest">{rawPin}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="tracking-wider">••••••</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(staff)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer shadow-2xs ${
                        staff.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      }`}
                      title={
                        staff.is_active
                          ? "ກົດເພື່ອປິດການໃຊ້ງານຊົ່ວຄາວ"
                          : "ກົດເພື່ອເປີດການໃຊ້ງານ"
                      }
                    >
                      {staff.is_active ? (
                        <>
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                          <span>ເປີດໃຊ້ງານ</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-2.5 w-2.5 text-slate-400" />
                          <span>ປິດໃຊ້ງານ</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions: Change PIN, Edit, Delete */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* 1. Change PIN Button (Moved here per user request) */}
                      <button
                        type="button"
                        onClick={() => onChangePin(staff)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs"
                        title="ປ່ຽນລະຫັດ PIN 6 ຕົວເລກ"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>

                      {/* 2. Edit Profile Button */}
                      <button
                        type="button"
                        onClick={() => onEdit(staff)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                        title="ແກ້ໄຂຂໍ້ມູນພະນັກງານ"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* 3. Delete Staff Button */}
                      <button
                        type="button"
                        onClick={() => onDelete(staff)}
                        disabled={staff.role === "owner"}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                        title={
                          staff.role === "owner"
                            ? "ບໍ່ສາມາດລຶບເຈົ້າຂອງຮ້ານໄດ້"
                            : "ລຶບພະນັກງານ"
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
