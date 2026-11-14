import { describe, expect, it } from "vitest";
import { createThrow, move, press, release, step, MAX_THROW, type Bounds } from "./throw";

const B: Bounds = { left: -20, right: 2, floor: -10 };

function run(s: ReturnType<typeof createThrow>, seconds: number, t0 = 0) {
  let t = t0;
  for (let i = 0; i < seconds * 60; i++) {
    t += 1 / 60;
    step(s, 1 / 60, t, B);
  }
  return t;
}

describe("throw physics", () => {
  it("a press without moving is a click, not a drag", () => {
    const s = createThrow();
    press(s, 0, 0, 0);
    expect(move(s, 0.05, 0, 0.1)).toBe(false);
    release(s, 0.2);
    expect(s.mode).toBe("home");
  });

  it("dragging follows the pointer keeping the grab offset", () => {
    const s = createThrow();
    press(s, 0.3, 0.2, 0);
    expect(move(s, -3.7, 0.2, 0.1)).toBe(true);
    run(s, 0.5);
    expect(s.x).toBeCloseTo(-4, 1);
    expect(s.y).toBeCloseTo(0, 1);
  });

  it("a throw falls, bounces, gets dizzy and runs back home", () => {
    const s = createThrow();
    press(s, 0, 0, 0);
    move(s, -1, 0, 0);
    let t = 0;
    for (let i = 0; i < 6; i++) {
      t += 1 / 60;
      move(s, -1 - i * 0.6, 0, t);
      step(s, 1 / 60, t, B);
    }
    release(s, t);
    expect(s.mode).toBe("flying");
    expect(s.vx).toBeLessThan(0);
    t = run(s, 3, t);
    expect(s.impact).toBeGreaterThan(4);
    expect(["dizzy", "running", "home"]).toContain(s.mode);
    run(s, 4, t);
    expect(s.mode).toBe("home");
    expect(s.x).toBe(0);
    expect(s.y).toBe(0);
  });

  it("never leaves the bounds and caps the throw speed", () => {
    const s = createThrow();
    press(s, 0, 0, 0);
    move(s, 1, 0, 0);
    s.vx = 500;
    s.vy = 500;
    s.mode = "held";
    release(s, 0);
    expect(Math.hypot(s.vx, s.vy)).toBeCloseTo(MAX_THROW, 5);
    let t = 0;
    for (let i = 0; i < 300; i++) {
      t += 1 / 60;
      step(s, 1 / 60, t, B);
      expect(s.x).toBeGreaterThanOrEqual(B.left);
      expect(s.x).toBeLessThanOrEqual(B.right);
      expect(s.y).toBeGreaterThanOrEqual(B.floor);
    }
  });

  it("a long frame does not tunnel through the floor", () => {
    const s = createThrow();
    s.mode = "flying";
    s.y = -9.5;
    s.vy = -30;
    step(s, 2, 1, B);
    expect(s.y).toBeGreaterThanOrEqual(B.floor);
  });
});
