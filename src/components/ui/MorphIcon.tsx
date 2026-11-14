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
  // sized like the dock's filled glyphs (≈ 1.3–22.7 with the 2.6 stroke)
  mail: { from: "M2.6 4.6 L21.4 4.6 L21.4 19.4 L2.6 19.4 L2.6 4.6 M3 6 L12 12.6 L21 6", to: "M9 18 L9 18 L9 18 L9 18 L9 18 M3.4 12.4 L9 18 L20.6 6.4" },
  // globe turns into ⇄ (switch language): the halves of the circle become the top arrow,
  // the meridian and the equator become the bottom one
  language: {
    from:
      "M12 3.5 C7.3 3.5 3.5 7.3 3.5 12 C3.5 16.7 7.3 20.5 12 20.5 M12 3.5 C16.7 3.5 20.5 7.3 20.5 12 C20.5 16.7 16.7 20.5 12 20.5 M12 3.5 C9 6.5 9 17.5 12 20.5 C15 17.5 15 6.5 12 3.5 M3.5 12 C9 12 15 12 20.5 12 C20.5 12 20.5 12 20.5 12",
    to: "M4 8.5 C9 8.5 15 8.5 20 8.5 C20 8.5 20 8.5 20 8.5 M16 4.5 C17.3 5.8 18.7 7.2 20 8.5 C18.7 9.8 17.3 11.2 16 12.5 M20 15.5 C15 15.5 9 15.5 4 15.5 C4 15.5 4 15.5 4 15.5 M8 11.5 C6.7 12.8 5.3 14.2 4 15.5 C5.3 16.8 6.7 18.2 8 19.5",
  },
} as const;
