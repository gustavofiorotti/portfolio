"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion-utils";
import { SECTION_IDS, type SectionId } from "./sections";

type Props = {
  label: string;
  active: SectionId;
  names: Record<(typeof SECTION_IDS)[number], string>;
  onGo: (id: SectionId) => (e: React.MouseEvent) => void;
};

/**
 * Section menu for screens without room for the full one (< 1024 px): a strip that scrolls by
 * touch with snap. The edges fade where there is more to scroll, so a cut topic reads as
 * "swipe for more", and the strip follows the section on screen like the desktop pill.
 */
export function MobileNav({ label, active, names, onGo }: Props) {
  const strip = useRef<HTMLElement>(null);
  // no fade until measured (a fade on a strip that fits would flash at 600–1023 px)
  const [edges, setEdges] = useState({ start: true, end: true });
  const dragging = useRef(false);
  const userUntil = useRef(0); // the visitor moved the strip: leave it alone until then

  // which edges have more to scroll (drives the fades), measured before the first paint
  useLayoutEffect(() => {
    const el = strip.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const next = { start: el.scrollLeft <= 1, end: el.scrollLeft >= max - 1 };
      setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
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

  // a finger (or a wheel) on the strip: no automatic alignment while it moves, nor 1.5 s after
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const down = () => (dragging.current = true);
    const up = () => {
      dragging.current = false;
      userUntil.current = performance.now() + 1500;
    };
    const wheel = () => (userUntil.current = performance.now() + 1500);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, []);

  // when the active section changes, bring its topic into view once (only the strip scrolls,
  // never the page). It waits for the page to stop scrolling: in WebKit, a smooth scroll started
  // on the strip cancels the page's own smooth scroll (the jump from a tapped topic would stop
  // halfway). If the visitor is moving the strip, it waits for them too.
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let done = false;
    const align = () => {
      const wait = dragging.current ? 300 : userUntil.current - performance.now();
      if (wait > 0) {
        timer = setTimeout(align, wait);
        return;
      }
      done = true;
      window.removeEventListener("scroll", settle);
      const item = el.querySelector<HTMLElement>(`[data-nav="${active}"]`);
      // position inside the strip (offsetLeft would be relative to the header)
      const left = item ? item.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft - 4 : 0;
      el.scrollTo({ left, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    };
    function settle() {
      if (done) return;
      clearTimeout(timer);
      timer = setTimeout(align, 160);
    }
    settle();
    window.addEventListener("scroll", settle, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", settle);
    };
  }, [active]);

  const fade = `linear-gradient(to right, ${edges.start ? "black" : "transparent"} 0, black 12px, black calc(100% - 18px), ${edges.end ? "black" : "transparent"} 100%)`;

  return (
    <nav
      ref={strip}
      aria-label={label}
      className="-my-1 flex min-w-0 snap-x snap-mandatory scroll-px-1 gap-0.5 overflow-x-auto overscroll-x-contain px-1 py-1 text-sm [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
      // mask alpha only (never painted): the fades at the edges with more to scroll; the links'
      // focus ring is drawn inside them (negative offset), so neither the mask nor the overflow cut it
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      {SECTION_IDS.map((id) => (
        <a
          key={id}
          href={`#${id}`}
          data-nav={id}
          onClick={onGo(id)}
          aria-current={active === id ? "location" : undefined}
          className={`flex h-11 shrink-0 snap-start items-center rounded-full border px-3 whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg ${
            active === id ? "border-[var(--pill-border)] bg-[var(--pill)] font-semibold text-fg" : "border-transparent font-medium text-muted"
          }`}
        >
          {names[id]}
        </a>
      ))}
    </nav>
  );
}
