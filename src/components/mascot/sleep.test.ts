import { describe, expect, it } from "vitest";
import { BREATH_NOD, BREATH_SWELL, sleepLine, sleepPose, zzzNow } from "./sleep";

describe("sleepPose", () => {
  it("is awake before getting sleepy", () => {
    expect(sleepPose(-1)).toBeNull();
  });

  it("goes yawn, nod, jolt, nod, jolt, drop and asleep", () => {
    const stages: string[] = [];
    for (let s = 0; s < 16; s += 0.05) {
      const st = sleepPose(s)!.stage;
      if (stages[stages.length - 1] !== st) stages.push(st);
    }
    expect(stages).toEqual(["yawn", "nod", "jolt", "nod", "jolt", "nod", "drop", "asleep"]);
  });

  it("droops the eyes while nodding and shuts them once asleep", () => {
    expect(sleepPose(2)!.open).toBeGreaterThan(sleepPose(5)!.open);
    expect(sleepPose(5.5)!.open).toBeGreaterThan(0.9); // the jolt
    expect(sleepPose(14)!.open).toBe(0);
  });

  it("drools only when asleep", () => {
    expect(sleepPose(8)!.drool).toBe(0);
    expect(sleepPose(15)!.drool).toBeGreaterThan(0.5);
  });
});

describe("sleepLine", () => {
  it("speaks on the yawn, the first doze, each jolt and falling asleep", () => {
    expect(sleepLine(null, "yawn")).toBe("yawn");
    expect(sleepLine("yawn", "nod")).toBe("doze");
    expect(sleepLine("nod", "jolt")).toBe("jolt");
    expect(sleepLine("jolt", "nod")).toBeNull();
    expect(sleepLine("drop", "asleep")).toBe("asleep");
    expect(sleepLine("asleep", "asleep")).toBeNull();
  });
});

describe("zzzNow", () => {
  it("shows at most three Zzz per nap, the first included, even if the stage blinks to null", () => {
    const z = { count: 0, nextAt: 0 };
    let shown = 0;
    let prev: "asleep" | null = null;
    for (let t = 0; t < 60; t += 0.5) {
      // every 7 s the walk nudges him: one frame without a stage, then asleep again
      const stage = t % 7 === 0 ? null : "asleep";
      const said = prev !== "asleep" && stage === "asleep" ? "asleep" : null;
      if (zzzNow(z, stage, said, false, t)) shown += 1;
      prev = stage;
    }
    expect(shown).toBe(3);
  });

  it("starts counting again only after he is really woken", () => {
    const z = { count: 3, nextAt: 0 };
    expect(zzzNow(z, "asleep", null, false, 10)).toBe(false);
    zzzNow(z, null, null, true, 11); // the pointer moved
    expect(zzzNow(z, "asleep", "asleep", false, 20)).toBe(true);
  });

  it("breathes a little deeper while asleep, without becoming a bob", () => {
    expect(BREATH_NOD).toBeGreaterThan(0.03);
    expect(BREATH_NOD).toBeLessThanOrEqual(0.06);
    expect(BREATH_SWELL).toBeGreaterThan(0.012);
    expect(BREATH_SWELL).toBeLessThanOrEqual(0.03);
    const nods = Array.from({ length: 60 }, (_, i) => sleepPose(1000 + i * 0.1)!.nod);
    expect(Math.max(...nods) - Math.min(...nods)).toBeCloseTo(2 * BREATH_NOD, 2);
  });
});
