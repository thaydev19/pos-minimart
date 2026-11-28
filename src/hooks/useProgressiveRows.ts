"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Progressively reveals table rows in batches so initial mount stays instant
 * on low-power CPUs while still loading remaining rows automatically on scroll.
 */
export function useProgressiveRows(
  totalCount: number,
  batchSize: number = 30,
  rootMargin: string = "350px"
) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount((prev) =>
      prev < batchSize ? batchSize : Math.min(prev, Math.max(batchSize, totalCount))
    );
  }, [totalCount, batchSize]);

  useEffect(() => {
    if (visibleCount >= totalCount) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(totalCount, prev + batchSize));
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, totalCount, batchSize, rootMargin]);

  return {
    visibleCount,
    hasMore: visibleCount < totalCount,
    sentinelRef,
    showMore: () => setVisibleCount((prev) => Math.min(totalCount, prev + batchSize)),
  };
}
