"use client";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Horizontal scroller that fades only the edges hiding content (data-fade = left | right | both).
 * Works in rtl too (scrollLeft is 0 at the right edge and negative towards the left).
 */
export function EdgeFadeScroll({ className, label, children }: { className: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const rtl = getComputedStyle(el).direction === "rtl";
      // distance already scrolled from the left edge, whatever the direction
      const fromLeft = rtl ? max + el.scrollLeft : el.scrollLeft;
      const left = max > 1 && fromLeft > 1;
      const right = max > 1 && fromLeft < max - 1;
      const fade = left && right ? "both" : left ? "left" : right ? "right" : "";
      if (fade) el.dataset.fade = fade;
      else delete el.dataset.fade;
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className={className} tabIndex={0} role="group" aria-label={label}>
      {children}
    </div>
  );
}
