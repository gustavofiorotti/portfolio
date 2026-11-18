/**
 * Scroll progress of the footer's Gufi: 0 when the top of his stage reaches the bottom of the
 * screen, 1 at the very end of the page (he faces you there, in the Open Graph pose).
 */
export function spinProgress(scrollY: number, viewport: number, stageTop: number, maxScroll: number): number {
  const start = stageTop - viewport;
  const span = maxScroll - start;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (scrollY - start) / span));
}

/** Frame for a progress, 0 (his back) … count - 1 (his face). */
export function frameAt(progress: number, count: number): number {
  return Math.round(Math.min(1, Math.max(0, progress)) * (count - 1));
}

/** Frames to fetch, the one on screen first and then outwards, so the turn fills in around it. */
export function loadOrder(current: number, count: number): number[] {
  const order = [current];
  for (let d = 1; order.length < count; d++) {
    if (current + d < count) order.push(current + d);
    if (current - d >= 0) order.push(current - d);
  }
  return order;
}

/** The loaded frame nearest to the wanted one (while the rest still downloads). */
export function nearestLoaded(wanted: number, loaded: readonly boolean[]): number {
  for (let d = 0; d < loaded.length; d++) {
    if (loaded[wanted + d]) return wanted + d;
    if (loaded[wanted - d]) return wanted - d;
  }
  return -1;
}
