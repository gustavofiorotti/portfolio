/** macOS-like dock geometry (kit-gustavo): icons grow from 42 to 60 px with a cos² falloff. */
export const DOCK = { base: 42, max: 60, gap: 14, pad: 16, range: 150 } as const;

type Geometry = typeof DOCK;

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
