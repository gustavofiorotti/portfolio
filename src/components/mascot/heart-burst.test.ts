import { describe, expect, it } from "vitest";
import { addBurst, ANCHOR_UP, BELOW_TOP_PX, BODY_R, EDGE_PX, GAP_PX, HEART_GAP_S, heartsDue, makeBurst, MAX_BURSTS } from "./heart-burst";
import { PPU } from "./ViewRig";

/** Gap (px) between the body's edge and the heart's near edge. */
const gapOf = (h: { dx: number; size: number }) => Math.abs(h.dx) - h.size / 2 - EDGE_PX;

describe("hearts", () => {
  it("limits how often a burst comes", () => {
    expect(heartsDue(10, 10 + HEART_GAP_S / 2)).toBe(false);
    expect(heartsDue(10, 10 + HEART_GAP_S + 0.01)).toBe(true);
    expect(heartsDue(-100, 0)).toBe(true);
  });

  it("makes 2 or 3 small hearts", () => {
    expect(makeBurst(1, () => 0.1).hearts).toHaveLength(2);
    const b = makeBurst(2, () => 0.9);
    expect(b.hearts).toHaveLength(3);
    for (const h of b.hearts) {
      expect(["💕", "❤️"]).toContain(h.glyph);
      // beside the head, never over its top (where the speech bubble is)
      expect(gapOf(h)).toBeGreaterThanOrEqual(GAP_PX);
      expect(gapOf(h)).toBeLessThanOrEqual(GAP_PX + 6);
      expect(h.size).toBeGreaterThanOrEqual(11);
      expect(h.size).toBeLessThanOrEqual(15);
    }
  });

  it("keeps only the newest bursts on screen", () => {
    let list = [makeBurst(0)];
    for (let i = 1; i < 6; i++) list = addBurst(list, makeBurst(i));
    expect(list).toHaveLength(MAX_BURSTS);
    expect(list.at(-1)!.id).toBe(5);
  });

  it("alternates left and right, and each burst starts on the other side", () => {
    const sides = (id: number) => makeBurst(id, () => 0.9).hearts.map((h) => Math.sign(h.dx));
    expect(sides(2)).toEqual([1, -1, 1]);
    expect(sides(3)).toEqual([-1, 1, -1]);
  });

  it("measures the gap from the body's edge, the same on both sides", () => {
    // the anchor is BELOW_TOP_PX under headY, which is 1.3 units over the body's centre
    expect(Math.abs(ANCHOR_UP - (1.3 - BELOW_TOP_PX / PPU))).toBeLessThan(0.01);
    expect(Math.abs(EDGE_PX - Math.sqrt(BODY_R ** 2 - ANCHOR_UP ** 2) * PPU)).toBeLessThan(1);
    for (let id = 0; id < 40; id++) {
      const r = ((id * 7919) % 100) / 100;
      for (const h of makeBurst(id, () => r).hearts) {
        const mirror = { ...h, dx: -h.dx };
        expect(gapOf(mirror)).toBe(gapOf(h));
      }
    }
  });
});
