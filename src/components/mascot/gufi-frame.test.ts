import { describe, expect, it } from "vitest";
import { BALL_R, STAGE_OVER_BALL, blinkOpen, frameUpperHalf, strandsFor, turnAt } from "./gufi-frame";
import { clip } from "./overlays";

describe("footer Gufi framing", () => {
  it("shows the upper half: equator on the bottom edge, ball 1/1.1 of the width", () => {
    const w = 902, h = 451, dist = 9;
    const { fov, y } = frameUpperHalf(w, h, dist);
    const visible = 2 * dist * Math.tan(((fov / 2) * Math.PI) / 180);
    expect(y).toBeCloseTo(visible / 2); // the camera centre is half the view up: equator at the bottom
    const ballPx = ((2 * BALL_R) / visible) * h;
    expect(ballPx).toBeCloseTo(w / STAGE_OVER_BALL);
  });
  it("turns from his back to his face with the scroll, clamped", () => {
    expect(turnAt(0)).toBeCloseTo(-Math.PI);
    expect(turnAt(1)).toBe(-0);
    expect(turnAt(2)).toBe(turnAt(1));
    expect(turnAt(-1)).toBe(turnAt(0));
  });
  it("gives fewer strands to integrated or unknown GPUs", () => {
    expect(strandsFor("ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)")).toBe(120000);
    expect(strandsFor("ANGLE (NVIDIA GeForce RTX 3060)")).toBe(120000);
    expect(strandsFor("ANGLE (Intel, Intel(R) UHD Graphics 620)")).toBe(50000);
    expect(strandsFor("")).toBe(50000);
  });
  it("blinks for 0.16 s and is open otherwise", () => {
    expect(blinkOpen(1, 2)).toBe(1);
    expect(blinkOpen(2.08, 2)).toBeCloseTo(0.07);
    expect(blinkOpen(2.3, 2)).toBe(1);
  });
});

describe("overlay scissor box", () => {
  it("clips to the canvas and flips y", () => {
    expect(clip({ left: 100, top: 600, right: 500, bottom: 1000 }, 1440, 900)).toEqual([100, 0, 400, 300]);
    expect(clip({ left: 0, top: 950, right: 10, bottom: 990 }, 1440, 900)).toBeNull();
  });
});
