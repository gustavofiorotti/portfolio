import { describe, expect, it } from "vitest";
import { addBurst, HEART_GAP_S, heartsDue, makeBurst, MAX_BURSTS, SIDE_PX } from "./heart-burst";

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
      expect(Math.abs(h.dx)).toBeGreaterThanOrEqual(SIDE_PX);
      expect(Math.abs(h.dx)).toBeLessThanOrEqual(SIDE_PX + 8);
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
});
