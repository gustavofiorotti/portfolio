import { afterEach, describe, expect, it, vi } from "vitest";
import { GLIDE_SCREENS, glideStart, lerpPath, scrollDuration, smoothScrollTo } from "./motion-utils";

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
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 0 });
  });

  // a section whose top (in page coordinates) follows window.scrollY like a real element
  const section = (id: string, pageTop: number) => {
    const el = document.createElement("section");
    el.id = id;
    el.getBoundingClientRect = () => ({ top: pageTop - window.scrollY }) as DOMRect;
    document.body.append(el);
    return el;
  };
  const at = (y: number) => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: y });
    window.dispatchEvent(new Event("scrollend"));
  };

  it("ignores an early scrollend (WebKit touch) and moves focus only when the page arrives", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    const focus = vi.spyOn(section("alvo", 1000), "focus");

    smoothScrollTo("alvo");
    at(0); // fired mid-way: focusing now would cancel the scroll
    expect(focus).not.toHaveBeenCalled();

    at(1000);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("still moves focus after the timer if scrollend never comes", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    const focus = vi.spyOn(section("alvo", 500), "focus");
    smoothScrollTo("alvo");
    vi.advanceTimersByTime(2000);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("near the end of the page it counts as arrived where the scroll range ends", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: window.innerHeight + 900 });
    const last = section("fim", 1400); // can never reach 1400: the page ends at 900
    const focus = vi.spyOn(last, "focus");
    smoothScrollTo("fim");
    at(600);
    expect(focus).not.toHaveBeenCalled();
    at(900);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("a newer jump takes over: the older one never moves focus", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    const first = section("um", 800);
    const second = section("dois", 2000);
    const f1 = vi.spyOn(first, "focus");
    const f2 = vi.spyOn(second, "focus");
    smoothScrollTo("um");
    smoothScrollTo("dois");
    at(800); // passes the first section on the way
    at(2000);
    vi.advanceTimersByTime(3000);
    expect(f1).not.toHaveBeenCalled();
    expect(f2).toHaveBeenCalledTimes(1);
  });
});

describe("glideStart", () => {
  it("keeps short jumps whole and glides only the last stretch of long ones", () => {
    const vh = 800;
    expect(glideStart(0, 1000, vh)).toBe(0);
    expect(glideStart(0, 5000, vh)).toBe(5000 - GLIDE_SCREENS * vh);
    expect(glideStart(5000, 0, vh)).toBe(GLIDE_SCREENS * vh);
    expect(glideStart(300, 300 + GLIDE_SCREENS * vh, vh)).toBe(300);
  });
});

