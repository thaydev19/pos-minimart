"use client";

// ============================================================================
// StaffFormModal: Horizontal 2-Column Layout Modal for Adding & Editing Staff
// Column 1: Basic Profile & PIN | Column 2: Rich Role & Permission Selector
// ============================================================================

import React, { useState } from "react";
import {
  UserPlus,
  UserCheck,
  X,
  Shield,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Crown,
  ShoppingCart,
  Lock,
  Mail,
  User,
  Save,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  StaffUser,
  StaffRole,
  CreateStaffInput,
  UpdateStaffInput,
  STAFF_ROLES_CONFIG,
} from "../types/staff.types";
import { triggerHapticFeedback } from "@/utils/haptics";

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
  const initialPin =
    staff?.pin ||
    (staff?.pin_hash && staff.pin_hash.length === 6 ? staff.pin_hash : "123456");

  const [fullName, setFullName] = useState(staff?.full_name_lo || "");
  const [username, setUsername] = useState(staff?.username || "");
  const [email, setEmail] = useState(staff?.email || "");
  const [role, setRole] = useState<StaffRole>(staff?.role || "cashier");
  const [pin, setPin] = useState(isEdit ? initialPin : "123456");
  const [showPin, setShowPin] = useState(true);
  const [isActive, setIsActive] = useState(staff ? staff.is_active : true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateRandomPin = () => {
    triggerHapticFeedback(15);
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

    if (!pin || pin.trim().length !== 6 || !/^\d+$/.test(pin)) {
      setError("ກະລຸນາກຳນົດລະຫັດ PIN 6 ຕົວເລກ");
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
            pin: pin.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150 select-none overflow-y-auto">
      {/* Horizontal Modal Container (max-w-4xl) */}
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-zinc-200/90 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* 1. Header Bar */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-slate-50/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                {isEdit ? <UserCheck className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isEdit ? "ແກ້ໄຂຂໍ້ມູນພະນັກງານ (Edit Staff)" : "ເພີ່ມພະນັກງານໃໝ່ (New Staff)"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isEdit
                    ? `ບັນຊີ: @${staff?.username} • ກຳນົດສິດການເຂົ້າເຖິງ ແລະ ລະຫັດ PIN`
                    : "ສ້າງບັນຊີຜູ້ໃຊ້ງານ, ກຳນົດສິດການເຂົ້າເຖິງ ແລະ ລະຫັດ PIN ປະຈຳຕົວ"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 leading-snug">{error}</div>
            </div>
          )}

          {/* 2. Horizontal 2-Column Body Content */}
          <div className="p-6 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            {/* -------------------------------------------------------------- */}
            {/* LEFT COLUMN: BASIC INFORMATION & PIN                           */}
            {/* -------------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-600" />
                <span>ຂໍ້ມູນພື້ນຖານ (Basic Profile)</span>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  ຊື່ ແລະ ນາມສະກຸນ (ພາສາລາວ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ຕົວຢ່າງ: ສົມພອນ ໄຊຍະວົງ"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs font-semibold text-slate-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Username & Email Sub-grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    ຊື່ເຂົ້າໃຊ້ງານ (Username) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-slate-400">@</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="somphone"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3.5 text-xs font-mono font-bold text-slate-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    ອີເມວ (Email)
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@gmail.com"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs font-medium text-slate-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Touch PIN Setup Card */}
              <div className="p-3.5 rounded-2xl border border-zinc-200/90 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                    <span>ລະຫັດ PIN 6 ຕົວເລກ {isEdit ? "(ສະແດງ / ປ່ຽນໃໝ່)" : <span className="text-rose-500">*</span>}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>ສຸ່ມລະຫັດ PIN</span>
                  </button>
                </div>

                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={6}
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPin(val);
                    }}
                    placeholder="123456"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-mono font-bold tracking-widest text-slate-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((prev) => !prev)}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showPin ? "ເຊື່ອງລະຫັດ PIN (Hide PIN)" : "ເບິ່ງລະຫັດ PIN (Show PIN)"}
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  ໃຊ້ສຳລັບການປົດລັອກໜ້າຂາຍ POS ດ່ວນ, ປິດກະ ແລະ ຢືນຢັນລາຍການ
                </p>
              </div>

              {/* Account Status Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800">
                    ສະຖານະການໃຊ້ງານ (Account Active)
                  </div>
                  <p className="text-[10.5px] text-slate-500">
                    {isActive ? "ເປີດການໃຊ້ງານ (ພ້ອມເຂົ້າສູ່ລະບົບ)" : "ປິດການໃຊ້ງານຊົ່ວຄາວ"}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* RIGHT COLUMN: ROLE & PERMISSION SELECTION                      */}
            {/* -------------------------------------------------------------- */}
            <div className="space-y-3">
              <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  <span>ກຳນົດສິດການໃຊ້ງານ (Role & Permissions) <span className="text-rose-500">*</span></span>
                </div>
              </div>

              {/* Role Cards List */}
              <div className="space-y-2.5">
                {(["owner", "store_manager", "cashier"] as StaffRole[]).map((r) => {
                  const cfg = STAFF_ROLES_CONFIG[r];
                  const isSelected = role === r;

                  return (
                    <div
                      key={r}
                      onClick={() => {
                        triggerHapticFeedback(15);
                        setRole(r);
                      }}
                      className={`relative flex items-start gap-3.5 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                          : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs"
                      }`}
                    >
                      {/* Radio Selector */}
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 transition-colors ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {r === "owner" && <Crown className="h-4 w-4 text-purple-600 shrink-0" />}
                            {r === "store_manager" && <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />}
                            {r === "cashier" && <ShoppingCart className="h-4 w-4 text-emerald-600 shrink-0" />}
                            <span className="text-xs font-bold text-slate-900">
                              {cfg.label_lo}
                            </span>
                          </div>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold border ${cfg.badgeClass}`}
                          >
                            {cfg.label_en}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {cfg.description_lo}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Bottom Footer Bar */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-slate-50/60 px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              ຍົກເລີກ (Cancel)
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>ກຳລັງບັນທຶກ...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{isEdit ? "ອັບເດດຂໍ້ມູນ (Update)" : "ບັນທຶກພະນັກງານ (Create)"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
