import { describe, expect, it } from "vitest";
import { DOCK, dockSizes, dockWidth, hoveredIcon } from "./dock";

const center = (i: number) => DOCK.pad + i * (DOCK.base + DOCK.gap) + DOCK.base / 2;

describe("dockSizes", () => {
  it("keeps every icon at rest when the pointer is outside", () => {
    expect(dockSizes(null, 5)).toEqual([42, 42, 42, 42, 42]);
  });

  it("grows the icon under the pointer to the max size", () => {
    expect(dockSizes(center(2), 5)[2]).toBeCloseTo(DOCK.max);
  });

  it("falls off symmetrically and monotonically with distance", () => {
    const s = dockSizes(center(2), 5);
    expect(s[1]).toBeCloseTo(s[3]);
    expect(s[0]).toBeCloseTo(s[4]);
    expect(s[2]).toBeGreaterThan(s[1]);
    expect(s[1]).toBeGreaterThan(s[0]);
  });

  it("follows the cos² curve and leaves icons beyond the range at rest", () => {
    const s = dockSizes(center(0), 5);
    // 56 px away: cos²(56/150 · π/2) of the extra 18 px
    expect(s[1]).toBeCloseTo(42 + 18 * Math.cos((56 / 150) * (Math.PI / 2)) ** 2);
    expect(s[3]).toBe(DOCK.base); // 168 px away
    expect(s[4]).toBe(DOCK.base);
  });

  it("never goes below the base nor above the max", () => {
    for (let x = -50; x < 400; x += 7) {
      for (const size of dockSizes(x, 5)) {
        expect(size).toBeGreaterThanOrEqual(DOCK.base);
        expect(size).toBeLessThanOrEqual(DOCK.max);
      }
    }
  });

  it("maps the pointer back to the resting layout, so the hovered icon stays under it", () => {
    const first = dockSizes(center(3), 5);
    const grown = dockSizes(center(3) + 20, 5, first);
    expect(hoveredIcon(center(3) + 20, grown)).toBe(3);
  });

  it("only grows the bar a little (icons push each other, never overlap)", () => {
    const s = dockSizes(center(2), 5);
    const rest = dockWidth(dockSizes(null, 5));
    expect(dockWidth(s)).toBeGreaterThan(rest);
    expect(dockWidth(s) - rest).toBeLessThan(DOCK.max); // less than one extra icon
  });
});

describe("hoveredIcon", () => {
  it("finds the icon under the pointer and splits the gaps", () => {
    const s = dockSizes(null, 5);
    expect(hoveredIcon(center(0), s)).toBe(0);
    expect(hoveredIcon(center(4), s)).toBe(4);
    expect(hoveredIcon(DOCK.pad + DOCK.base + 3, s)).toBe(0);
    expect(hoveredIcon(DOCK.pad + DOCK.base + 11, s)).toBe(1);
    expect(hoveredIcon(null, s)).toBe(-1);
    expect(hoveredIcon(1000, s)).toBe(-1);
  });
});
