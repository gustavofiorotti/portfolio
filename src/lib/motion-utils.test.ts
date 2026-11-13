import { describe, expect, it } from "vitest";
import { lerpPath, scrollDuration } from "./motion-utils";

describe("motion utils", () => {
  it("interpolates path numbers and keeps commands", () => {
    expect(lerpPath("M0 0 L10 10", "M10 20 L20 0", 0.5)).toBe("M5 10 L15 5");
    expect(lerpPath("M0 0 L10 10", "M10 20 L20 0", 0)).toBe("M0 0 L10 10");
    expect(lerpPath("M0 0 L10 10", "M10 20 L20 0", 1)).toBe("M10 20 L20 0");
  });

  it("keeps scroll between 0.42 and 0.85 s", () => {
    expect(scrollDuration(0)).toBe(420);
    expect(scrollDuration(1000)).toBe(540);
    expect(scrollDuration(-99999)).toBe(850);
  });
});
