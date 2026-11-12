import React from "react";
import {
  Beer,
  Milk,
  Utensils,
  Scale,
  Coffee,
  Zap,
  ShoppingBag,
  Cookie,
  Apple,
  Candy,
  Sparkles,
  Package,
  LayoutGrid,
} from "lucide-react";
import { CATEGORY_COLOR_OPTIONS } from "../constants/category.constants";

export function getCategoryIconComponent(
  iconName?: string | null,
  className = "h-4 w-4"
): React.ReactNode {
  switch (iconName) {
    case "Beer":
      return React.createElement(Beer, { className });
    case "Milk":
      return React.createElement(Milk, { className });
    case "Utensils":
      return React.createElement(Utensils, { className });
    case "Scale":
      return React.createElement(Scale, { className });
    case "Coffee":
      return React.createElement(Coffee, { className });
    case "Zap":
      return React.createElement(Zap, { className });
    case "ShoppingBag":
      return React.createElement(ShoppingBag, { className });
    case "Cookie":
      return React.createElement(Cookie, { className });
    case "Apple":
      return React.createElement(Apple, { className });
    case "Candy":
      return React.createElement(Candy, { className });
    case "Sparkles":
      return React.createElement(Sparkles, { className });
    case "Package":
      return React.createElement(Package, { className });
    default:
      return React.createElement(LayoutGrid, { className });
  }
}

export function getCategoryColorStyle(colorId?: string | null) {
  const match = CATEGORY_COLOR_OPTIONS.find((c) => c.id === colorId);
  return (
    match || {
      id: "emerald",
      name_lo: "ຂຽວມໍລະກົດ",
      bgClass: "bg-emerald-50",
      borderClass: "border-emerald-200",
      textClass: "text-emerald-700",
      dotClass: "bg-emerald-500",
    }
  );
}
