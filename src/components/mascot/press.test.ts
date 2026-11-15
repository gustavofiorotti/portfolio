import { describe, expect, it } from "vitest";
import { askPress, createPressRequest, DEDUPE_MS, MAX_PENDING } from "./press";

describe("askPress", () => {
  it("counts one physical click once, even if the button and the 3D switch both see it", () => {
    const r = createPressRequest();
    expect(askPress(r, 1000)).toBe(true);
    expect(askPress(r, 1004)).toBe(false); // same click, second handler
    expect(r.pending).toBe(1);
  });

  it("queues a second deliberate click, but never more than the cap", () => {
    const r = createPressRequest();
    askPress(r, 0);
    expect(askPress(r, DEDUPE_MS + 50)).toBe(true);
    expect(askPress(r, 2 * DEDUPE_MS + 100)).toBe(false);
    expect(r.pending).toBe(MAX_PENDING);
  });

  it("two clicks inside the 300 ms window count as one (the price of merging the two handlers)", () => {
    const r = createPressRequest();
    expect(askPress(r, 0)).toBe(true);
    expect(askPress(r, DEDUPE_MS - 1)).toBe(false); // a very fast double click: still one press
    expect(r.pending).toBe(1);
    r.pending = 0; // the scene took it
    expect(askPress(r, 2 * DEDUPE_MS)).toBe(true); // a later click is a new press
  });
});
