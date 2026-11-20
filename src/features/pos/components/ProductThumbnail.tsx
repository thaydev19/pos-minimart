"use client";

// ============================================================================
// Product Thumbnail: Edge-to-Edge Pure <img> with Modern Product Icon Fallback
// 100% Compatible with Next.js Static Export & Mobile Webview
// ============================================================================

import React, { useState } from "react";
import { Package } from "lucide-react";

// Legacy paper bag Unsplash image that was previously used as default fallback
const LEGACY_DEFAULT_BAG_URL = "photo-1544816155-12df9643f363";

interface ProductThumbnailProps {
  src?: string | null;
  alt: string;
  name?: string;
  className?: string;
  imgClassName?: string;
}

export function ProductThumbnail({
  src,
  alt,
  className = "",
  imgClassName = "",
}: ProductThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  // Check if src is an emoji string rather than a web URL
  const isEmoji =
    src &&
    src.trim().length > 0 &&
    src.trim().length <= 4 &&
    !src.startsWith("http") &&
    !src.startsWith("/") &&
    !src.startsWith("data:");

  // 1. Direct Emoji Fallback
  if (isEmoji) {
    return (
      <div
        className={`flex items-center justify-center select-none overflow-hidden ${className}`}
        aria-label={alt}
      >
        <span className="text-4xl leading-none scale-105 group-hover:scale-110 transition-transform duration-200">
          {src}
        </span>
      </div>
    );
  }

  // Treat missing URL, image load failure, or legacy brown paper bag placeholder as NO image
  const isLegacyBag = Boolean(src && src.includes(LEGACY_DEFAULT_BAG_URL));
  const hasValidImage = Boolean(src && !isLegacyBag && !hasError);

  // 2. Missing URL or Image Load Failed -> Sleek, Modern Product Icon Fallback
  if (!hasValidImage) {
    const isLarge =
      className.includes("w-full") ||
      className.includes("h-full") ||
      className.includes("h-40") ||
      className.includes("h-36") ||
      className.includes("h-32");

    if (isLarge) {
      return (
        <div
          className={`flex items-center justify-center bg-linear-to-b from-slate-50/80 via-zinc-50/60 to-slate-100/70 select-none overflow-hidden ${className}`}
          aria-label={alt}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200/70 shadow-2xs text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 group-hover:scale-105 transition-all duration-200">
            <Package className="h-8 w-8 stroke-[1.5]" />
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center justify-center bg-slate-100/90 border border-slate-200/60 text-slate-400 group-hover:text-emerald-600 select-none overflow-hidden transition-colors ${className}`}
        aria-label={alt}
      >
        <Package className="h-5 w-5 stroke-[1.65]" />
      </div>
    );
  }

  // 3. Image Container with proper containment (Prevents flex overflow in list view)
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 overflow-hidden ${className}`}
    >
      <img
        src={src!}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className={`w-full h-full block ${imgClassName || "object-contain object-center transition-transform duration-200 group-hover:scale-105"}`}
      />
    </div>
  );
}
