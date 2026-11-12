"use client";

// ============================================================================
// Settings & Staff Management Page (ຕັ້ງຄ່າ & ພະນັກງານ)
// ============================================================================

import React from "react";
import { Store, Printer, Users, Shield, Save } from "lucide-react";
import { DEFAULT_STORE } from "@/features/pos/constants/pos.constants";

export function SettingsPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
            ຕັ້ງຄ່າລະບົບ & ພະນັກງານ (Settings & Users)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ກຳນົດຂໍ້ມູນຮ້ານ, ອາກອນມູນຄ່າເພີ່ມ (VAT), ເຄື່ອງພິມໃບບິນ ແລະ ສິດທິການໃຊ້ງານ
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>ບັນທຶກການຕັ້ງຄ່າ</span>
        </button>
      </div>

      {/* Store Profile Card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <Store className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">ຂໍ້ມູນຮ້ານຄ້າ (Store Profile)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">ຊື່ຮ້ານ (ພາສາລາວ)</label>
            <input
              type="text"
              defaultValue={DEFAULT_STORE.name_lo}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 font-medium outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">ສາຂາ & ທີ່ຕັ້ງ</label>
            <input
              type="text"
              defaultValue={DEFAULT_STORE.branch}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 font-medium outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">ເບີໂທລະສັບຕິດຕໍ່</label>
            <input
              type="text"
              defaultValue={DEFAULT_STORE.phone}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 font-medium outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">ສະກຸນເງິນຫຼັກ</label>
            <input
              type="text"
              defaultValue="ກີບລາວ (LAK)"
              disabled
              className="h-9 w-full rounded-lg border border-slate-200 px-3 bg-slate-50 font-medium text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* POS & Printer Card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <Printer className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">ເຄື່ອງພິມໃບບິນ & ລິ້ນຊັກເງິນ</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">ຂະໜາດເຈ້ຍໃບບິນ</label>
            <select className="h-9 w-full rounded-lg border border-slate-200 px-3 font-medium outline-none focus:border-emerald-600">
              <option value="80mm">Thermal 80mm (ມາດຕະຖານຮ້ານມິນິມາດ)</option>
              <option value="58mm">Thermal 58mm (ຂະໜາດນ້ອຍ)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">ການພິມອັດຕະໂນມັດ</label>
            <select className="h-9 w-full rounded-lg border border-slate-200 px-3 font-medium outline-none focus:border-emerald-600">
              <option value="ask">ຖາມກ່ອນພິມ (ແນະນຳ)</option>
              <option value="auto">ພິມທັນທີເມື່ອຊຳລະສຳເລັດ</option>
              <option value="manual">ພິມເມື່ອກົດປຸ່ມເທົ່ານັ້ນ</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

