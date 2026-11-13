"use client";
import { lerpPath } from "@/lib/motion-utils";
import { useTween } from "@/lib/use-tween";

/**
 * Icon that morphs between two paths with the same command structure (Benji Taylor's
 * morphing icons): the numbers are interpolated with a little overshoot.
 */
export function MorphIcon({ from, to, active, size = 14, strokeWidth = 2.2 }: { from: string; to: string; active: boolean; size?: number; strokeWidth?: number }) {
  const k = useTween(active ? 1 : 0, 420);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={lerpPath(from, to, k)} />
    </svg>
  );
}

/** Morph pairs used across the site; each pair shares the same commands. */
export const MORPHS = {
  // ↗ "opens elsewhere" stretches into → "go"
  arrow: { from: "M7 17 L17 7 M8 7 L17 7 L17 16", to: "M4 12 L20 12 M13 5 L20 12 L13 19" },
  // <> gains the slash: </>
  code: { from: "M8 7 L3 12 L8 17 M16 7 L21 12 L16 17 M3 12 L3 12", to: "M8 7 L3 12 L8 17 M16 7 L21 12 L16 17 M14 5 L10 19" },
} as const;
