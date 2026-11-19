"use client";

// ============================================================================
// StaffFormModal: Add or Edit Staff Account with Role Selector & PIN Setup
// ============================================================================

import React, { useState } from "react";
import { UserPlus, UserCheck, X, Shield, KeyRound, CheckCircle2, RefreshCw } from "lucide-react";
import { StaffUser, StaffRole, CreateStaffInput, UpdateStaffInput, STAFF_ROLES_CONFIG } from "../types/staff.types";

interface StaffFormModalProps {
  staff?: StaffUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStaffInput | { id: string; input: UpdateStaffInput }) => Promise<void>;
}

export function StaffFormModal({
  staff,
  isOpen,
  onClose,
  onSubmit,
}: StaffFormModalProps) {
  const isEdit = Boolean(staff);

  const [fullName, setFullName] = useState(staff?.full_name_lo || "");
  const [username, setUsername] = useState(staff?.username || "");
  const [email, setEmail] = useState(staff?.email || "");
  const [role, setRole] = useState<StaffRole>(staff?.role || "cashier");
  const [pin, setPin] = useState(staff ? "" : "123456");
  const [isActive, setIsActive] = useState(staff ? staff.is_active : true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateRandomPin = () => {
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(random);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("ກະລຸນາປ້ອນຊື່ ແລະ ນາມສະກຸນ (Full Name)");
      return;
    }

    if (!username.trim()) {
      setError("ກະລຸນາປ້ອນຊື່ເຂົ້າໃຊ້ງານ (Username)");
      return;
    }

    if (!isEdit && (!pin || pin.trim().length !== 6 || !/^\d+$/.test(pin))) {
      setError("ກະລຸນາກຳນົດລະຫັດ PIN 6 ຕົວເລກ");
      return;
    }

    if (isEdit && pin.trim().length > 0 && (pin.trim().length !== 6 || !/^\d+$/.test(pin))) {
      setError("ລະຫັດ PIN ໃໝ່ຕ້ອງເປັນຕົວເລກ 6 ຫຼັກ");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && staff) {
        await onSubmit({
          id: staff.id,
          input: {
            full_name_lo: fullName.trim(),
            username: username.trim().toLowerCase(),
            email: email.trim() || undefined,
            role,
            is_active: isActive,
            pin: pin.trim() || undefined,
          },
        });
      } else {
        await onSubmit({
          full_name_lo: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim() || undefined,
          role,
          is_active: isActive,
          pin: pin.trim() || "123456",
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "ບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              {isEdit ? <UserCheck className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? "ແກ້ໄຂຂໍ້ມູນພະນັກງານ" : "ເພີ່ມພະນັກງານໃໝ່"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isEdit ? `ລະຫັດ: ${staff?.username}` : "ກຳນົດສິດການໃຊ້ງານ ແລະ ລະຫັດ PIN"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name in Lao */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ຊື່ ແລະ ນາມສະກຸນ (ພາສາລາວ) *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ເຊັ່ນ: ທ້າວ ສົມພອນ ໄຊຍະວົງ..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all font-medium"
            />
          </div>

          {/* Username & Email Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ຊື່ເຂົ້າໃຊ້ງານ (Username) *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ເຊັ່ນ: somphone..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-800 font-mono outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ອີເມວ (Email)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="somphone@gmail.com..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              ກຳນົດສິດການໃຊ້ງານ (Role & Permissions) *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(STAFF_ROLES_CONFIG) as StaffRole[]).map((rKey) => {
                const rConf = STAFF_ROLES_CONFIG[rKey];
                const isSelected = role === rKey;
                return (
                  <label
                    key={rKey}
                    onClick={() => setRole(rKey)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-400/50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="staff_role"
                      checked={isSelected}
                      onChange={() => setRole(rKey)}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {rConf.label_lo}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rConf.badgeClass}`}
                        >
                          {rConf.label_en}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {rConf.description_lo}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 6-Digit PIN Setup */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  {isEdit ? "ປ່ຽນລະຫັດ PIN ໃໝ່ (ປະວ່າງໄວ້ຫາກບໍ່ປ່ຽນ)" : "ລະຫັດ PIN 6 ຕົວເລກ *"}
                </span>
              </label>
              <button
                type="button"
                onClick={handleGenerateRandomPin}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>ສຸ່ມລະຫັດ PIN</span>
              </button>
            </div>
            <input
              type="text"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder={isEdit ? "•••••• (ບໍ່ປ່ຽນແປງ)" : "123456"}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-800 font-mono tracking-widest text-center font-bold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
            />
            <p className="text-[10px] text-slate-500 text-center">
              ໃຊ້ສຳລັບການປົດລັອກໜ້າຂາຍ POS ດ່ວນ ແລະ ຢືນຢັນລາຍການສຳຄັນ
            </p>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white">
            <div>
              <div className="text-xs font-bold text-slate-800">
                ສະຖານະການໃຊ້ງານ (Account Active)
              </div>
              <div className="text-[11px] text-slate-500">
                ຫາກປິດໃຊ້ງານ ພະນັກງານຄົນນີ້ຈະບໍ່ສາມາດເຂົ້າສູ່ລະບົບໄດ້
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "ກຳລັງບັນທຶກ..." : isEdit ? "ອັບເດດຂໍ້ມູນ" : "ບັນທຶກພະນັກງານ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
