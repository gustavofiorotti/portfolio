import { describe, expect, it } from "vitest";
import { sleepLine, sleepPose } from "./sleep";

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
