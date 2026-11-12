"use client";

// ============================================================================
// Category Filter Pills: Compact Density (py-1 px-2.5 text-xs)
// ============================================================================

import React from "react";
import { LayoutGrid, Beer, Utensils, Milk, Scale, Coffee, Zap, ShoppingBag } from "lucide-react";
import { usePosStore } from "../stores/pos.store";

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutGrid: <LayoutGrid className="h-3 w-3" />,
  Beer: <Beer className="h-3 w-3" />,
  Utensils: <Utensils className="h-3 w-3" />,
  Milk: <Milk className="h-3 w-3" />,
  Scale: <Scale className="h-3 w-3" />,
  Coffee: <Coffee className="h-3 w-3" />,
  Zap: <Zap className="h-3 w-3" />,
  ShoppingBag: <ShoppingBag className="h-3 w-3" />,
};

export function CategoryFilter() {
  const categories = usePosStore((s) => s.categories);
  const activeCategory = usePosStore((s) => s.activeCategory);
  const setActiveCategory = usePosStore((s) => s.setActiveCategory);

  return (
    <div className="flex w-full items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar select-none">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? "bg-slate-900 text-white shadow-2xs"
                : "border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300"
            }`}
          >
            <span className={isActive ? "text-emerald-400" : "text-slate-500"}>
              {ICON_MAP[cat.icon || ""] || <LayoutGrid className="h-3 w-3" />}
            </span>
            <span>{cat.name_lo}</span>
          </button>
        );
      })}
    </div>
  );
}
