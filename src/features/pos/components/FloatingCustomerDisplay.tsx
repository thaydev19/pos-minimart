"use client";

// ============================================================================
// Floating In-App Customer Display (Picture-in-Picture & Fullscreen Preview)
// Runs on single-screen devices (WSA, regular tablets, single monitor PC)
// Draggable Top Handle: Drag freely anywhere across the screen
// Fully synchronized via In-Memory + BroadcastChannel + LocalStorage
// Zero Emojis - Lucide Icons Exclusively
// ============================================================================

import React, { useState, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import { Monitor, X, Maximize2, Minimize2, GripHorizontal } from "lucide-react";
import CustomerDisplayPage from "@/app/customer-display/page";
import { broadcastCurrentCustomerDisplayState } from "../utils/customerDisplaySync";

interface FloatingCustomerDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingCustomerDisplay({
  isOpen,
  onClose,
}: FloatingCustomerDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dragControls = useDragControls();

  // Automatically broadcast current customer display state upon opening
  useEffect(() => {
    if (isOpen) {
      broadcastCurrentCustomerDisplayState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      drag={!isExpanded}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      className={`fixed shadow-2xl bg-zinc-950 overflow-hidden flex flex-col ${
        isExpanded
          ? "inset-0 z-[100] w-screen h-screen rounded-none border-none"
          : "bottom-3 right-3 sm:bottom-4 sm:right-4 w-[420px] sm:w-[480px] h-[320px] sm:h-[360px] max-w-[95vw] max-h-[50vh] rounded-2xl border-2 border-emerald-500 z-50 touch-none"
      }`}
    >
      {/* Top Control Bar - Serves as Draggable Handle */}
      <div
        onPointerDown={(e) => {
          if (!isExpanded) {
            dragControls.start(e);
          }
        }}
        className={`flex h-10 items-center justify-between bg-zinc-900 px-3 sm:px-4 text-white border-b border-zinc-800 select-none shrink-0 z-10 transition-colors ${
          !isExpanded
            ? "cursor-grab active:cursor-grabbing hover:bg-zinc-850"
            : ""
        }`}
        title={!isExpanded ? "ກົດຄ້າງແລ້ວລາກເພື່ອຍ້າຍຕຳແໜ່ງ (Drag to move)" : ""}
      >
        <div className="flex items-center gap-2 min-w-0 pointer-events-none">
          {!isExpanded && (
            <GripHorizontal className="h-4 w-4 text-zinc-500 shrink-0" />
          )}
          <Monitor className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-zinc-100 truncate">
            {isExpanded
              ? "ຈໍສະແດງຜົນລູກຄ້າ (Customer Display Fullscreen)"
              : "ຈໍລູກຄ້າຈຳລອງ (Customer Display Preview)"}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2 sm:px-2.5 rounded-lg flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
            title={isExpanded ? "ຫຍໍ້ລົງ (Minimize)" : "ຂະຫຍາຍເຕັມຈໍ (Fullscreen)"}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-zinc-300" />
                <span className="hidden sm:inline text-[11px]">ຫຍໍ້ໜ້າຕ່າງ</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-[11px]">ເຕັມຈໍ</span>
              </>
            )}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-rose-900/60 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
            title="ປິດ (Close)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Embedded Live Customer Display Component */}
      <div className="flex-1 w-full min-h-0 min-w-0 overflow-hidden bg-[#0B0F17] relative">
        <div
          className={`w-full h-full min-h-0 min-w-0 ${
            !isExpanded
              ? "w-[133.33%] h-[133.33%] scale-[0.75] origin-top-left"
              : ""
          }`}
        >
          <CustomerDisplayPage />
        </div>
      </div>
    </motion.div>
  );
}
