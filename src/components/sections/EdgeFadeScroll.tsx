"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/**
 * Horizontal scroller that fades only the edges hiding content (data-fade = left | right | both
 * on the inner scroller). The focus ring lives on the outer wrapper, so the mask never clips it;
 * the wrapper is focusable only while there is something to scroll, and the arrow keys (plus
 * Home/End) scroll the inner box. Works in rtl too (scrollLeft is 0 at the right edge and
 * negative towards the left).
 */
export function EdgeFadeScroll({ className, scrollerClassName, label, children }: { className: string; scrollerClassName: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

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
      setScrollable(max > 1);
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

  const onKey = (e: KeyboardEvent) => {
    const el = ref.current;
    if (!el) return;
    const step = { ArrowLeft: -120, ArrowRight: 120 }[e.key];
    if (step) el.scrollBy({ left: step });
    else if (e.key === "Home") el.scrollTo({ left: -el.scrollWidth }); // leftmost (rtl and ltr clamp)
    else if (e.key === "End") el.scrollTo({ left: el.scrollWidth });
    else return;
    e.preventDefault();
  };

  return (
    <div className={className} tabIndex={scrollable ? 0 : undefined} role="group" aria-label={label} onKeyDown={scrollable ? onKey : undefined}>
      <div ref={ref} className={scrollerClassName}>
        {children}
      </div>
    </div>
  );
}
