"use client";

// ============================================================================
// Category Filter Pills: Compact Density with Dynamic Lucide Icons & Colors
// ============================================================================

import React from "react";
import { usePosStore } from "../stores/pos.store";
import {
  getCategoryIconComponent,
  getCategoryColorStyle,
} from "@/features/categories/utils/category.util";

export function CategoryFilter() {
  const categories = usePosStore((s) => s.categories);
  const activeCategory = usePosStore((s) => s.activeCategory);
  const setActiveCategory = usePosStore((s) => s.setActiveCategory);

  return (
    <div className="flex w-full items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar select-none">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const colorStyle = getCategoryColorStyle(cat.color);

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
            <span
              className={
                isActive
                  ? colorStyle.id === "slate"
                    ? "text-slate-300"
                    : colorStyle.textClass
                  : "text-slate-500"
              }
            >
              {getCategoryIconComponent(cat.icon, "h-3.5 w-3.5")}
            </span>
            <span>{cat.name_lo}</span>
            {cat.id !== "cat-all" && (
              <span
                className={`h-1.5 w-1.5 rounded-full ${colorStyle.dotClass} ${
                  isActive ? "ring-2 ring-white/50" : "opacity-80"
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
