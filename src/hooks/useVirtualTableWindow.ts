"use client";

import { useEffect, useRef, useState } from "react";

interface VirtualWindow {
  startIndex: number;
  endIndex: number;
}

/**
 * Finds the closest scrollable vertical ancestor element (e.g. backoffice <main>).
 */
function findScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let curr = el?.parentElement ?? null;
  while (curr) {
    const style = window.getComputedStyle(curr);
    const overflowY = style.overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      return curr;
    }
    curr = curr.parentElement;
  }
  return window;
}

/**
 * Lightweight fixed-height table row virtualizer tied to the nearest vertical scroll container.
 * Keeps DOM size bounded (~20-30 <tr> nodes) even with thousands of products/stock rows.
 */
export function useVirtualTableWindow(
  totalCount: number,
  rowHeight: number = 66,
  overscan: number = 6
) {
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null);
  const [windowRange, setWindowRange] = useState<VirtualWindow>(() => ({
    startIndex: 0,
    endIndex: Math.min(totalCount, 24),
  }));

  useEffect(() => {
    if (totalCount <= 30) {
      setWindowRange({ startIndex: 0, endIndex: totalCount });
      return;
    }

    const tbody = tbodyRef.current;
    if (!tbody) return;

    const scrollParent = findScrollParent(tbody);
    let rafId = 0;

    const measureAndSlice = () => {
      rafId = 0;
      const currentTbody = tbodyRef.current;
      if (!currentTbody) return;

      const rect = currentTbody.getBoundingClientRect();
      let visibleTop: number;
      let visibleBottom: number;

      if (scrollParent === window) {
        visibleTop = 0;
        visibleBottom = window.innerHeight;
      } else {
        const parentRect = (scrollParent as HTMLElement).getBoundingClientRect();
        visibleTop = parentRect.top;
        visibleBottom = parentRect.bottom;
      }

      const scrolledPastStart = Math.max(0, visibleTop - rect.top);
      const viewportOverlapEnd = Math.max(0, visibleBottom - rect.top);

      const startIndex = Math.max(
        0,
        Math.floor(scrolledPastStart / rowHeight) - overscan
      );
      const endIndex = Math.min(
        totalCount,
        Math.max(startIndex + 16, Math.ceil(viewportOverlapEnd / rowHeight) + overscan)
      );

      setWindowRange((prev) =>
        prev.startIndex === startIndex && prev.endIndex === endIndex
          ? prev
          : { startIndex, endIndex }
      );
    };

    const scheduleMeasure = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(measureAndSlice);
    };

    measureAndSlice();

    const target: EventTarget = scrollParent;
    target.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure, { passive: true });

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      target.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [totalCount, rowHeight, overscan]);

  const startIndex = Math.min(windowRange.startIndex, totalCount);
  const fallbackEnd = totalCount <= 30 ? totalCount : Math.min(totalCount, 24);
  const rawEnd =
    windowRange.endIndex <= startIndex && totalCount > 0
      ? fallbackEnd
      : windowRange.endIndex;
  const endIndex = Math.min(Math.max(rawEnd, startIndex), totalCount);

  return {
    tbodyRef,
    startIndex,
    endIndex,
    topSpacerHeight: startIndex * rowHeight,
    bottomSpacerHeight: Math.max(0, (totalCount - endIndex) * rowHeight),
  };
}
