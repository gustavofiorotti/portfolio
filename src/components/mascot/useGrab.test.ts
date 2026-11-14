import { afterEach, describe, expect, it, vi } from "vitest";
import { createThrow } from "./throw";
import { reachable } from "./useGrab";

function under(el: Element | null) {
  Object.defineProperty(document, "elementFromPoint", { configurable: true, value: vi.fn(() => el) });
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("reachable", () => {
  it("is false over links and buttons, so a press there stays a click on the page", () => {
    document.body.innerHTML = '<a href="#"><span id="in">x</span></a><button id="b">y</button>';
    under(document.getElementById("in"));
    expect(reachable(createThrow(), 0, 0)).toBe(false);
    under(document.getElementById("b"));
    expect(reachable(createThrow(), 0, 0)).toBe(false);
  });

  it("is true over plain content", () => {
    document.body.innerHTML = "<p id='p'>text</p>";
    under(document.getElementById("p"));
    expect(reachable(createThrow(), 0, 0)).toBe(true);
  });

  it("is false while he runs behind the page", () => {
    under(document.body);
    const th = createThrow();
    th.mode = "running";
    expect(reachable(th, 0, 0)).toBe(false);
  });
});
