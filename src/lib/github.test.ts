import { describe, expect, it } from "vitest";
import data from "../data/github-contributions.json";
import { contributionLevel, type Contributions } from "./github";

describe("contributionLevel", () => {
  it("keeps valid levels and clamps the rest", () => {
    expect([0, 1, 2, 3, 4].map(contributionLevel)).toEqual([0, 1, 2, 3, 4]);
    expect(contributionLevel(-1)).toBe(0);
    expect(contributionLevel(9)).toBe(4);
    expect(contributionLevel(Number.NaN)).toBe(0);
  });
});

describe("github-contributions.json", () => {
  const c = data as Contributions;
  it("has 53 weeks of 7 days with levels 0-4", () => {
    expect(c.weeks).toHaveLength(53);
    for (const week of c.weeks) {
      expect(week).toHaveLength(7);
      for (const level of week) expect(contributionLevel(level)).toBe(level);
    }
  });
  it("has a numeric total and an ISO fetch date", () => {
    expect(Number.isInteger(c.total)).toBe(true);
    expect(new Date(c.fetchedAt).toISOString()).toBe(c.fetchedAt);
  });
});
