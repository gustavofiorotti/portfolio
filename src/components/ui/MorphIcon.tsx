"use client";
import { lerpPath } from "@/lib/motion-utils";
import { useTween } from "@/lib/use-tween";

/**
 * Icon that morphs between two paths with the same command structure (Benji Taylor's
 * morphing icons): the numbers are interpolated with a little overshoot.
 */
export function MorphIcon({ from, to, active, size = 14, strokeWidth = 2.2 }: { from: string; to: string; active: boolean; size?: number; strokeWidth?: number }) {
  const d = useMorphPath(from, to, active);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** The interpolated `d` for a morph pair, for icons that draw their own <svg> (e.g. the dock glass). */
export function useMorphPath(from: string, to: string, active: boolean, duration = 420): string {
  return lerpPath(from, to, useTween(active ? 1 : 0, duration));
}

/** Morph pairs used across the site; each pair shares the same commands. */
export const MORPHS = {
  // ↗ "opens elsewhere" stretches into → "go"
  arrow: { from: "M7 17 L17 7 M8 7 L17 7 L17 16", to: "M4 12 L20 12 M13 5 L20 12 L13 19" },
  // <> gains the slash: </>
  code: { from: "M8 7 L3 12 L8 17 M16 7 L21 12 L16 17 M3 12 L3 12", to: "M8 7 L3 12 L8 17 M16 7 L21 12 L16 17 M14 5 L10 19" },
  // envelope folds into ✓ (the box collapses onto the check's corner)
  mail: { from: "M4 6 L20 6 L20 18 L4 18 L4 6 M4 7 L12 13 L20 7", to: "M9.5 17 L9.5 17 L9.5 17 L9.5 17 L9.5 17 M4.5 12 L9.5 17 L19.5 7" },
} as const;
