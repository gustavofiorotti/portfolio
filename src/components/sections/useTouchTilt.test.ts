import { describe, expect, it } from "vitest";
import { isControl } from "./useTouchTilt";

describe("isControl", () => {
  it("a tap on a link, a button or inside one is a control; the card body is not", () => {
    document.body.innerHTML = `<article><p id="body">text</p><a href="#" target="_blank"><span id="in-link">x</span></a><button id="btn">b</button></article>`;
    expect(isControl(document.getElementById("in-link"))).toBe(true);
    expect(isControl(document.getElementById("btn"))).toBe(true);
    expect(isControl(document.getElementById("body"))).toBe(false);
    expect(isControl(null)).toBe(false);
  });
});
