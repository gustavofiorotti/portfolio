import { afterEach, describe, expect, it, vi } from "vitest";
import { wantsSmoothWheel } from "./smooth-wheel";

const media = (fine: boolean, reduce: boolean) =>
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("pointer") ? fine : reduce }));

describe("wantsSmoothWheel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("smooths a mouse or trackpad", () => {
    media(true, false);
    expect(wantsSmoothWheel()).toBe(true);
  });

  it("leaves touch-only devices native", () => {
    media(false, false);
    expect(wantsSmoothWheel()).toBe(false);
  });

  it("turns off with less motion", () => {
    media(true, true);
    expect(wantsSmoothWheel()).toBe(false);
  });
});
