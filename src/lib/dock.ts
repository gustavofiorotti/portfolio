/** macOS-like dock geometry (kit-gustavo): icons grow from 42 to 60 px with a cos² falloff. */
export const DOCK = { base: 42, max: 60, gap: 14, pad: 16, range: 150 } as const;

export type Geometry = { base: number; max: number; gap: number; pad: number; range: number };

/**
 * Size of each icon for a pointer at `x` (px from the dock's left edge), or null when the
 * pointer is outside. Icons take real space and push their neighbours apart, so `x` is first
 * mapped back to the resting layout (`current` = sizes shown now); otherwise the icons would
 * slide away from the pointer as they grow.
 */
export function dockSizes(x: number | null, count: number, current?: readonly number[], g: Geometry = DOCK): number[] {
  if (x === null) return Array.from({ length: count }, () => g.base);
  const shown = current && current.length === count ? current : Array.from({ length: count }, () => g.base);
  const restInner = g.base * count + g.gap * (count - 1);
  const nowInner = shown.reduce((a, b) => a + b, 0) + g.gap * (count - 1);
  const xr = (x - g.pad) * (restInner / nowInner);
  return Array.from({ length: count }, (_, i) => {
    const dist = Math.abs(xr - (i * (g.base + g.gap) + g.base / 2));
    if (dist >= g.range) return g.base;
    const f = Math.cos(((dist / g.range) * Math.PI) / 2);
    return g.base + (g.max - g.base) * f * f;
  });
}

/** Index of the icon under the pointer (gaps split between neighbours), or -1. */
export function hoveredIcon(x: number | null, sizes: readonly number[], g: Geometry = DOCK): number {
  if (x === null) return -1;
  let left = g.pad;
  for (let i = 0; i < sizes.length; i++) {
    if (x >= left - g.gap / 2 && x <= left + sizes[i] + g.gap / 2) return i;
    left += sizes[i] + g.gap;
  }
  return -1;
}

/** Total dock width for the given sizes (padding + icons + gaps). */
export function dockWidth(sizes: readonly number[], g: Geometry = DOCK): number {
  return g.pad * 2 + sizes.reduce((a, b) => a + b, 0) + g.gap * Math.max(0, sizes.length - 1);
}

/** Largest bar growth (px) per px of icon growth, over every pointer position. */
function peakGrowth(count: number, g: Geometry): number {
  const rest = Array.from({ length: count }, () => g.base);
  const span = dockWidth(rest, g);
  let peak = 0;
  for (let x = 0; x <= span; x += 2) {
    const extra = dockSizes(x, count, rest, g).reduce((a, b) => a + b - g.base, 0);
    peak = Math.max(peak, extra);
  }
  return peak / (g.max - g.base || 1);
}

/**
 * Geometry that fits `available` px (small phones): the whole dock scales down if even the
 * resting bar is too wide, and the magnification shrinks so the grown bar never overflows.
 */
export function fitDock(available: number, count: number, g: Geometry = DOCK, minZoom = 1.25): Geometry {
  const rest = dockWidth(Array.from({ length: count }, () => g.base), g);
  const growth = peakGrowth(count, g); // scale-free: the same after shrinking everything
  // shrink until the bar still has room for icons to grow at least `minZoom`
  const f = Math.min(1, available / (rest + growth * (minZoom - 1) * g.base));
  if (f === 1 && rest + growth * (g.max - g.base) <= available) return { ...g };
  const scaled = { base: g.base * f, max: g.max * f, gap: g.gap * f, pad: g.pad * f, range: g.range * f };
  const room = Math.max(0, available - rest * f);
  return { ...scaled, max: Math.min(scaled.max, scaled.base + room / growth) };
}
