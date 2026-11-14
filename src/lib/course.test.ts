import { describe, expect, it } from "vitest";
import { courseProgress } from "./course";

describe("courseProgress", () => {
  it("starts at 0% in the 1st semester", () => {
    expect(courseProgress(new Date(Date.UTC(2024, 0, 1)))).toMatchObject({ pct: 0, semester: 1 });
  });

  it("is about halfway at the end of 2025", () => {
    expect(courseProgress(new Date(Date.UTC(2025, 11, 31)))).toMatchObject({ pct: 50, semester: 4 });
  });

  it("is in the 6th semester in nov/2026", () => {
    expect(courseProgress(new Date(Date.UTC(2026, 10, 13)))).toMatchObject({ pct: 72, semester: 6 });
  });

  it("clamps before the start and after the end", () => {
    expect(courseProgress(new Date(Date.UTC(2023, 5, 1)))).toMatchObject({ pct: 0, semester: 1 });
    expect(courseProgress(new Date(Date.UTC(2029, 0, 1)))).toMatchObject({ pct: 100, semester: 8 });
  });
});
