"use client";

// ============================================================================
// StaffTable: High-Performance Touch & Desktop Staff Directory Table
// ============================================================================

import React from "react";
import {
  KeyRound,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { StaffUser, STAFF_ROLES_CONFIG } from "../types/staff.types";

interface StaffTableProps {
  staffList: StaffUser[];
  isLoading: boolean;
  onEdit: (staff: StaffUser) => void;
  onChangePin: (staff: StaffUser) => void;
  onToggleStatus: (staff: StaffUser) => void;
  onDelete: (staff: StaffUser) => void;
}

export function StaffTable({
  staffList,
  isLoading,
  onEdit,
  onChangePin,
  onToggleStatus,
  onDelete,
}: StaffTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
        <span className="text-xs font-semibold text-slate-500 mt-3">
          ກຳລັງໂຫຼດລາຍຊື່ພະນັກງານ...
        </span>
      </div>
    );
  }

  if (staffList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="text-sm font-bold text-slate-800">ບໍ່ພົບຂໍ້ມູນພະນັກງານ</div>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          ກະລຸນາກົດປຸ່ມ "+ ເພີ່ມພະນັກງານໃໝ່" ເພື່ອສ້າງບັນຊີຜູ້ໃຊ້ງານໃນລະບົບ
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">ພະນັກງານ (Staff Member)</th>
              <th className="py-3 px-4">ຊື່ເຂົ້າໃຊ້ງານ (Username)</th>
              <th className="py-3 px-4">ສິດການໃຊ້ງານ (Role)</th>
              <th className="py-3 px-4 text-center">ລະຫັດ PIN</th>
              <th className="py-3 px-4 text-center">ສະຖານະ</th>
              <th className="py-3 px-4 text-right">ຈັດການ (Actions)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staffList.map((staff) => {
              const roleConfig = STAFF_ROLES_CONFIG[staff.role];
              const initials = staff.full_name_lo
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
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 font-bold text-xs shadow-2xs border border-slate-200">
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
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                    @{staff.username}
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleConfig.badgeClass}`}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      <span>{roleConfig.label_lo}</span>
                    </span>
                  </td>

                  {/* PIN */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onChangePin(staff)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 font-mono font-bold text-slate-600 text-xs transition-colors cursor-pointer group-hover:border-emerald-300"
                      title="ກົດເພື່ອປ່ຽນລະຫັດ PIN"
                    >
                      <KeyRound className="h-3 w-3 text-slate-400 group-hover:text-emerald-600" />
                      <span>••••••</span>
                    </button>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(staff)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                        staff.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {staff.is_active ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>ເປີດໃຊ້ງານ</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-slate-400" />
                          <span>ປິດໃຊ້ງານ</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(staff)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                        title="ແກ້ໄຂຂໍ້ມູນ"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(staff)}
                        disabled={staff.role === "owner"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
