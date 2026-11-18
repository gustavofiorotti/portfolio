"use client";
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { addBurst, BELOW_TOP_PX, HEART_LIFE_MS, makeBurst, type Burst } from "./heart-burst";
import type { Layout } from "./ViewRig";
import "./hearts.css";

/** Bursts of hearts and the function that adds one. With less motion it never adds any. */
export function useHearts() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const next = useRef(0);
  const add = useCallback(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return; // the face alone says it
    const id = ++next.current;
    setBursts((list) => addBurst(list, makeBurst(id)));
    // the last heart starts up to ~280 ms late: drop the burst once it is surely gone
    setTimeout(() => setBursts((list) => list.filter((b) => b.id !== id)), HEART_LIFE_MS + 400);
  }, []);
  return { bursts, add };
}

/** Hearts floating up beside Bobby's head (the scene writes the head's screen point into layout). */
export function Hearts({ bursts, layout }: { bursts: Burst[]; layout: MutableRefObject<Layout> }) {
  const el = useRef<HTMLDivElement>(null);
  const active = bursts.length > 0;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const follow = () => {
      const { headX, headY } = layout.current;
      if (el.current) el.current.style.transform = `translate(${headX}px, ${headY + BELOW_TOP_PX}px)`;
      raf = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(raf);
  }, [active, layout]);
  if (!active) return null;
  return (
    <div ref={el} className="bobby-hearts" aria-hidden="true">
      {bursts.flatMap((b) =>
        b.hearts.map((h, i) => (
          <span
            key={`${b.id}-${i}`}
            style={{ "--dx": `${h.dx}px`, animationDelay: `${h.delay}ms`, fontSize: `${h.size}px` } as React.CSSProperties}
          >
            {h.glyph}
          </span>
        )),
      )}
    </div>
  );
}
