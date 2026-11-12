"use client";

// ============================================================================
// Category Badge: Renders Lucide Icon & Lao Label with Preset Colors
// ============================================================================

import React from "react";
import { getCategoryIconComponent, getCategoryColorStyle } from "../utils/category.util";

interface CategoryBadgeProps {
  name: string;
  icon?: string | null;
  color?: string | null;
  className?: string;
}

export function CategoryBadge({
  name,
  icon,
  color,
  className = "",
}: CategoryBadgeProps) {
  const colorStyle = getCategoryColorStyle(color);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-semibold ${colorStyle.bgClass} ${colorStyle.borderClass} ${colorStyle.textClass} ${className}`}
    >
      <span className="shrink-0">{getCategoryIconComponent(icon, "h-3.5 w-3.5")}</span>
      <span className="truncate">{name}</span>
    </span>
  );
}

