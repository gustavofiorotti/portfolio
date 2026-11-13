"use client";
import { useEffect, useRef, useState } from "react";
import { easeOutBack, prefersReducedMotion } from "./motion-utils";

/** Animates a number from its current value to `target` (easeOutBack), for morphing icons. */
export function useTween(target: number, duration = 520): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    // with reduced motion the jump still happens inside rAF, just with no duration
    const dur = prefersReducedMotion() ? 0 : duration;
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = dur === 0 ? 1 : Math.min(1, (now - t0) / dur);
      const v = start + (target - start) * easeOutBack(t);
      from.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}
