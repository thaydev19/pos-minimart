import React from "react";
import * as LucideIcons from "lucide-react";
import { LayoutGrid } from "lucide-react";
import {
  CATEGORY_COLOR_OPTIONS,
  CategoryColorOption,
} from "../constants/category.constants";

export function getCategoryIconComponent(
  iconName?: string | null,
  className = "h-4 w-4"
): React.ReactNode {
  // If icon is serialized as "IconName:color", extract just the "IconName"
  const cleanName = iconName?.split(":")[0]?.trim() || "LayoutGrid";
  const IconComponent = (LucideIcons as Record<string, any>)[cleanName] || LayoutGrid;
  return React.createElement(IconComponent, { className });
}

export function parseCategoryIconAndColor(rawIcon?: string | null): {
  icon: string;
  color?: string;
} {
  if (!rawIcon) return { icon: "LayoutGrid" };
  if (rawIcon.includes(":")) {
    const [icon, color] = rawIcon.split(":");
    return {
      icon: icon?.trim() || "LayoutGrid",
      color: color?.trim() || undefined,
    };
  }
  return { icon: rawIcon.trim() };
}

export function getCategoryColorStyle(colorId?: string | null): CategoryColorOption {
  const match = CATEGORY_COLOR_OPTIONS.find((c) => c.id === colorId);
  return match || CATEGORY_COLOR_OPTIONS[0];
}
