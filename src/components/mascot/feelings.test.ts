import { describe, expect, it } from "vitest";
import { angerAt, createFeel, endStroke, levelOf, poke, stroke, STROKE_PX } from "./feelings";

describe("anger", () => {
  it("climbs one level after another with quick pokes", () => {
    const f = createFeel();
    const levels = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => poke(f, t));
    expect(levels).toEqual([1, 1, 2, 3, 4, 4]);
  });

  it("cools down after a pause", () => {
    const f = createFeel();
    for (let i = 0; i < 5; i++) poke(f, i * 0.1);
    expect(levelOf(angerAt(f, 0.5))).toBe(4);
    expect(levelOf(angerAt(f, 10))).toBe(0);
  });
});

describe("petting", () => {
  it("counts a stroke only after travelling far enough and turning around", () => {
    const f = createFeel();
    const go = (from: number, to: number, step: number) => {
      let counted = 0;
      for (let x = from; step > 0 ? x <= to : x >= to; x += step) if (stroke(f, x)) counted++;
      return counted;
    };
    expect(go(100, 100 + STROKE_PX + 6, 3)).toBe(0); // first sweep right
    expect(go(118, 90, -3)).toBe(1); // turns left: the right sweep counts
    expect(go(93, 140, 3)).toBe(1); // turns right again: the left sweep counts
  });

  it("counts up-and-down strokes too", () => {
    const f = createFeel();
    let counted = 0;
    for (let y = 100; y <= 130; y += 3) if (stroke(f, 200, y)) counted++;
    for (let y = 127; y >= 95; y -= 3) if (stroke(f, 200, y)) counted++;
    for (let y = 98; y <= 130; y += 3) if (stroke(f, 200, y)) counted++;
    expect(counted).toBe(2);
  });

  it("ignores tiny jitters", () => {
    const f = createFeel();
    let counted = 0;
    for (let i = 0; i < 20; i++) if (stroke(f, 100 + (i % 2) * 3)) counted++;
    expect(counted).toBe(0);
  });

  it("starts fresh after the pointer leaves", () => {
    const f = createFeel();
    stroke(f, 100);
    stroke(f, 130);
    endStroke(f);
    expect(stroke(f, 50)).toBe(false);
  });
});

describe("calm and the secret", () => {
  it("petting takes anger away right away", async () => {
    const { calm } = await import("./feelings");
    const f = createFeel();
    for (let i = 0; i < 5; i++) poke(f, i * 0.1);
    calm(f, 0.5);
    calm(f, 0.6);
    expect(levelOf(angerAt(f, 0.6))).toBeLessThan(4);
  });

  it("shows progress every few clicks until it is unlocked", async () => {
    const { eggProgress, EGG_GOAL } = await import("./feelings");
    expect(eggProgress(1)).toBeNull();
    expect(eggProgress(4)).toEqual({ filled: 1, total: 5, done: false });
    expect(eggProgress(16)).toEqual({ filled: 4, total: 5, done: false });
    expect(eggProgress(EGG_GOAL)).toEqual({ filled: 5, total: 5, done: true });
    expect(eggProgress(21)).toBeNull();
    expect(eggProgress(24)).toBeNull(); // the hatch shows only once
  });
});
