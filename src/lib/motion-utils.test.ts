import { afterEach, describe, expect, it, vi } from "vitest";
import { lerpPath, scrollDuration, smoothScrollTo } from "./motion-utils";

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

describe("smoothScrollTo", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });

  it("ignores an early scrollend (WebKit touch) and moves focus only when the page arrives", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    const section = document.createElement("section");
    section.id = "alvo";
    section.getBoundingClientRect = () => ({ top: 1000 }) as DOMRect;
    document.body.append(section);
    const focus = vi.spyOn(section, "focus");

    smoothScrollTo("alvo");
    window.dispatchEvent(new Event("scrollend")); // fired mid-way: focusing now would cancel the scroll
    expect(focus).not.toHaveBeenCalled();

    Object.defineProperty(window, "scrollY", { configurable: true, value: 1000 });
    window.dispatchEvent(new Event("scrollend"));
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("still moves focus after the timer if scrollend never comes", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    const section = document.createElement("section");
    section.id = "alvo";
    section.getBoundingClientRect = () => ({ top: 500 }) as DOMRect;
    document.body.append(section);
    const focus = vi.spyOn(section, "focus");
    smoothScrollTo("alvo");
    vi.advanceTimersByTime(2000);
    expect(focus).toHaveBeenCalledTimes(1);
  });
});
