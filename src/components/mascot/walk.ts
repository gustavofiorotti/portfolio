// Bobby walks down the right edge as the page scrolls, like the mockup: his center goes from
// WALK_MARGIN px to (viewport height - WALK_MARGIN) px with the scroll progress, while the
// switch stays at the vertical middle. When he has to press it, he walks back to it first.

export const WALK_MARGIN = 190;

/** Pixels from the switch (positive = below it) where Bobby should be for this scroll. */
export function walkOffsetPx(progress: number, viewportHeight: number): number {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const center = WALK_MARGIN + p * Math.max(0, viewportHeight - 2 * WALK_MARGIN);
  return center - viewportHeight / 2;
}

/** Scroll progress of the page, 0 at the top and 1 at the bottom. */
export function scrollProgress(scrollY: number, scrollHeight: number, viewportHeight: number): number {
  const max = scrollHeight - viewportHeight;
  return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
}
