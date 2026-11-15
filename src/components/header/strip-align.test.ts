import { describe, expect, it } from "vitest";
import { stripAlign } from "./strip-align";

const base = { smoothScrolling: false, dragging: false, userPauseMs: 0, pageMoving: false };

describe("stripAlign", () => {
  it("waits for a tapped topic's smooth scroll", () => {
    expect(stripAlign({ ...base, smoothScrolling: true, pageMoving: true })).toEqual({ wait: 120 });
  });
  it("waits while the visitor holds or just moved the strip", () => {
    expect(stripAlign({ ...base, dragging: true })).toEqual({ wait: 300 });
    expect(stripAlign({ ...base, userPauseMs: 800 })).toEqual({ wait: 800 });
  });
  it("follows a finger-scrolled page at once, without animation", () => {
    expect(stripAlign({ ...base, pageMoving: true })).toEqual({ behavior: "auto" });
  });
  it("animates when the page is still", () => {
    expect(stripAlign(base)).toEqual({ behavior: "smooth" });
  });
});
