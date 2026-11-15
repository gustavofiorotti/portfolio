"use client";
import { useEffect, useRef, useState } from "react";
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
  const [edges, setEdges] = useState({ start: true, end: false });

  // which edges have more to scroll (drives the fades)
  useEffect(() => {
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

  // keep the current section's topic in view (only the strip scrolls, never the page). It waits
  // for the page to stop scrolling: in WebKit, a smooth scroll started on the strip cancels the
  // page's own smooth scroll (the jump from a tapped topic would stop halfway).
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const align = () => {
      const item = el.querySelector<HTMLElement>(`[data-nav="${active}"]`);
      // position inside the strip (offsetLeft would be relative to the header)
      const left = item ? item.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft - 4 : 0;
      el.scrollTo({ left, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    };
    const settle = () => {
      clearTimeout(timer);
      timer = setTimeout(align, 160);
    };
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
      className="flex min-w-0 snap-x snap-mandatory scroll-px-1 gap-0.5 overflow-x-auto overscroll-x-contain px-1 text-sm [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
      // mask alpha only (never painted): the fades at the edges with more to scroll
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      {SECTION_IDS.map((id) => (
        <a
          key={id}
          href={`#${id}`}
          data-nav={id}
          onClick={onGo(id)}
          aria-current={active === id ? "location" : undefined}
          className={`flex h-11 shrink-0 snap-start items-center rounded-full border px-3 whitespace-nowrap transition-colors duration-200 ${
            active === id ? "border-[var(--pill-border)] bg-[var(--pill)] font-semibold text-fg" : "border-transparent font-medium text-muted"
          }`}
        >
          {names[id]}
        </a>
      ))}
    </nav>
  );
}
