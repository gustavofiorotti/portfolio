import { describe, expect, it } from "vitest";
import { frameAt, inBatches, loadOrder, nearestLoaded, pickFrames, spinProgress } from "./gufi-spin";

describe("footer Gufi spin", () => {
  it("starts when the stage enters the screen and ends at the bottom of the page", () => {
    // stage at 3000 px, 800 px screen, page scrolls to 3400
    expect(spinProgress(1000, 800, 3000, 3400)).toBe(0);
    expect(spinProgress(2200, 800, 3000, 3400)).toBe(0);
    expect(spinProgress(2800, 800, 3000, 3400)).toBe(0.5);
    expect(spinProgress(3400, 800, 3000, 3400)).toBe(1);
  });

  it("is already facing you when the page is too short to scroll through the turn", () => {
    expect(spinProgress(0, 900, 300, 0)).toBe(1);
  });

  it("maps progress to a frame, his back first and his face last", () => {
    expect(frameAt(0, 36)).toBe(0);
    expect(frameAt(1, 36)).toBe(35);
    expect(frameAt(0.5, 36)).toBe(18);
    expect(frameAt(2, 19)).toBe(18);
    expect(frameAt(-1, 19)).toBe(0);
  });

  it("loads the frame on screen first, then its neighbours", () => {
    expect(loadOrder(2, 5)).toEqual([2, 3, 1, 4, 0]);
    expect(loadOrder(4, 5)).toEqual([4, 3, 2, 1, 0]);
  });

  it("draws the nearest loaded frame while the others download", () => {
    expect(nearestLoaded(3, [true, false, false, false, false])).toBe(0);
    expect(nearestLoaded(3, [false, false, false, false, true])).toBe(4);
    expect(nearestLoaded(1, [false, false, false])).toBe(-1);
  });
});

describe("footer Gufi loading", () => {
  it("Save-Data keeps every other frame and always the last pose", () => {
    expect(pickFrames(5, false)).toEqual([0, 1, 2, 3, 4]);
    expect(pickFrames(5, true)).toEqual([0, 2, 4]);
    expect(pickFrames(6, true)).toEqual([0, 2, 4, 5]);
  });

  it("splits the load order into batches", () => {
    expect(inBatches([4, 5, 3, 6, 2], 2)).toEqual([[4, 5], [3, 6], [2]]);
  });
});

describe("footer Gufi frames", () => {
  it("the stage's aspect ratios in footer.css match the frames", async () => {
    const { readFileSync, existsSync } = await import("node:fs");
    const frames = (await import("@/lib/gufi-frames.json")).default;
    const css = readFileSync("src/components/sections/footer.css", "utf8");
    expect(css).toContain(`aspect-ratio: ${frames.d.width} / ${frames.d.height}`);
    expect(css).toContain(`aspect-ratio: ${frames.m.width} / ${frames.m.height}`);
    for (const set of ["d", "m"] as const)
      for (let i = 0; i < frames[set].count; i++) expect(existsSync(`public/gufi/${set}/${String(i).padStart(2, "0")}.webp`)).toBe(true);
  });
});
