import { describe, expect, it } from "vitest";
import { brtTime, handAngles } from "./clock";

describe("clock", () => {
  it("formats Brasília time regardless of the input's zone", () => {
    expect(brtTime(new Date("2026-11-13T15:07:00Z"))).toBe("12:07");
    expect(brtTime(new Date("2026-11-13T02:30:00Z"))).toBe("23:30");
  });

  it("points the hands like a real clock", () => {
    expect(handAngles("03:00")).toEqual({ hour: 90, minute: 0 });
    expect(handAngles("12:30")).toEqual({ hour: 15, minute: 180 });
  });
});
