"use client";

// ============================================================================
// Product Thumbnail: Edge-to-Edge Pure <img> with Smart Fallback
// 100% Compatible with Next.js Static Export & Mobile Webview
// ============================================================================

import React, { useState } from "react";
import { Package } from "lucide-react";

interface ProductThumbnailProps {
  src?: string | null;
  alt: string;
  name?: string;
  className?: string;
}

export function ProductThumbnail({
  src,
  alt,
  name,
  className = "",
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

  // Determine fallback monogram (first 2 characters of name)
  const monogram = (name || alt || "SP")
    .replace(/[^\u0E80-\u0EFFa-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();

  // 1. Direct Emoji Fallback
  if (isEmoji) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100/90 text-zinc-700 select-none overflow-hidden ${className}`}
        aria-label={alt}
      >
        <span className="text-3xl leading-none">{src}</span>
      </div>
    );
  }

  // 2. Missing URL or Image Load Failed -> Clean Monogram Fallback
  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200/90 text-zinc-600 select-none overflow-hidden font-bold ${className}`}
        aria-label={alt}
      >
        {monogram ? (
          <span className="text-sm font-extrabold tracking-tight text-zinc-700">
            {monogram}
          </span>
        ) : (
          <Package className="h-6 w-6 text-zinc-400" />
        )}
      </div>
    );
  }

  // 3. Pure <img> Filling 100% Edge-to-Edge (object-cover)
  return (
    <div className={`relative overflow-hidden bg-zinc-50 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-center block transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}
