import { describe, expect, it } from "vitest";
import { alignToToday, localDay } from "./github-calendar";

// a 3-week grid is enough to test (the site uses 53); 2026-11-14 is a Saturday
const sat = new Date(2026, 10, 14, 10);
const grid = () => [
  [1, 1, 1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3, 3, 3],
];

describe("alignToToday", () => {
  it("same day as the snapshot: nothing changes", () => {
    expect(alignToToday(grid(), sat, new Date(2026, 10, 14, 22))).toEqual(grid());
  });

  it("a new week started (Sunday): shifts one column and draws only today", () => {
    const g = alignToToday(grid(), sat, new Date(2026, 10, 15, 9));
    expect(g[0]).toEqual([2, 2, 2, 2, 2, 2, 2]);
    expect(g[1]).toEqual([3, 3, 3, 3, 3, 3, 3]);
    expect(g[2]).toEqual([0, null, null, null, null, null, null]);
  });

  it("a snapshot from mid-week with null future days: days up to today become 0", () => {
    const wed = new Date(2026, 10, 11, 12);
    const g = alignToToday([[1, 1, 1, 1, 1, 1, 1], [2, 2, 2, 2, null, null, null]], wed, new Date(2026, 10, 13, 8));
    expect(g[1]).toEqual([2, 2, 2, 2, 0, 0, null]);
  });

  it("keeps days before the calendar start out", () => {
    const g = alignToToday([[null, null, 5, 5, 5, 5, 5], [1, 1, 1, 1, 1, 1, 1]], sat, sat);
    expect(g[0]).toEqual([null, null, 5, 5, 5, 5, 5]);
  });

  it("a visitor clock behind the snapshot never shifts backwards", () => {
    const g = alignToToday(grid(), sat, new Date(2026, 10, 12, 12));
    expect(g[2]).toEqual([3, 3, 3, 3, 3, null, null]);
  });

  it("localDay ignores the time of day", () => {
    expect(localDay(new Date(2026, 10, 14, 0, 1))).toBe(localDay(new Date(2026, 10, 14, 23, 59)));
  });
});
