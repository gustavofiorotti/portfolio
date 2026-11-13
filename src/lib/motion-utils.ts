/** easeOutQuart: fast start, gentle stop. */
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/** easeOutBack: overshoots a little, then settles (used by morphing icons). */
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Scroll duration grows with distance, clamped to 0.42–0.85 s (kit: neither slow nor instant). */
export const scrollDuration = (distance: number) => Math.min(850, 420 + Math.abs(distance) * 0.12);

/**
 * Interpolates two SVG paths with the same command structure, number by number.
 * Safari cannot transition the `d` property in CSS, so morphing icons go through this.
 */
export function lerpPath(a: string, b: string, k: number): string {
  const re = /-?\d*\.?\d+/g;
  const nb = b.match(re) ?? [];
  let i = 0;
  return a.replace(re, (n) => {
    const target = Number(nb[i++] ?? n);
    return String(Math.round((Number(n) + (target - Number(n)) * k) * 100) / 100);
  });
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Animated scroll to an element id (or to the top), with the kit's timing. */
export function smoothScrollTo(id: string | null, offset = 0) {
  const target = id ? document.getElementById(id) : null;
  const to = target ? target.getBoundingClientRect().top + window.scrollY - offset : 0;
  const from = window.scrollY;
  if (prefersReducedMotion()) return window.scrollTo(0, to);
  const dur = scrollDuration(to - from);
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / dur);
    window.scrollTo(0, from + (to - from) * easeOutQuart(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
