import { afterEach, describe, expect, it, vi } from "vitest";
import { glideAt, isSmoothScrolling, jumpDuration, jumpToEdge, keyIsForPage, lerpPath, scrollDuration, smoothScrollTo } from "./motion-utils";

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
  // a page as tall as `height`, whose scrollTo really moves scrollY; returns every position set
  const page = (height: number, y = 0) => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: height });
    Object.defineProperty(window, "scrollY", { configurable: true, value: y });
    const tops: number[] = [];
    window.scrollTo = ((o: ScrollToOptions) => {
      expect(o.behavior).toBe("instant");
      tops.push(o.top!);
      Object.defineProperty(window, "scrollY", { configurable: true, value: o.top });
    }) as typeof window.scrollTo;
    return tops;
  };

  it("glides the whole way with no cut: no frame moves more than a quarter of a screen", () => {
    const tops = page(6000);
    const focus = vi.spyOn(section("alvo", 4600), "focus");
    smoothScrollTo("alvo");
    vi.advanceTimersByTime(jumpDuration(4600, 800) - 50);
    expect(focus).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(window.scrollY).toBe(4600);
    expect(focus).toHaveBeenCalledTimes(1);
    const steps = tops.map((y, i) => y - (tops[i - 1] ?? 0));
    expect(steps.every((d) => d >= 0)).toBe(true); // never backwards
    expect(Math.max(...steps)).toBeLessThan(800 / 4);
  });

  it("near the end of the page it stops where the scroll range ends", () => {
    page(800 + 900);
    const focus = vi.spyOn(section("fim", 1400), "focus"); // can never reach 1400
    smoothScrollTo("fim");
    vi.advanceTimersByTime(1500);
    expect(window.scrollY).toBe(900);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("the wheel or a touch hands the page back to the visitor, without moving focus", () => {
    const tops = page(6000);
    const focus = vi.spyOn(section("alvo", 3000), "focus");
    smoothScrollTo("alvo");
    vi.advanceTimersByTime(200);
    window.dispatchEvent(new Event("wheel"));
    const stoppedAt = window.scrollY;
    const frames = tops.length;
    vi.advanceTimersByTime(2000);
    expect(tops.length).toBe(frames);
    expect(window.scrollY).toBe(stoppedAt);
    expect(focus).not.toHaveBeenCalled();
    expect(isSmoothScrolling()).toBe(false);
  });

  it("the Enter that started the jump (⌘K) does not stop it; a later arrow key does", () => {
    page(6000);
    section("alvo", 3000);
    vi.advanceTimersByTime(50);
    const enter = new KeyboardEvent("keydown", { key: "Enter" });
    smoothScrollTo("alvo");
    window.dispatchEvent(enter); // timeStamp from before the jump started
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
    vi.advanceTimersByTime(100);
    expect(isSmoothScrolling()).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(isSmoothScrolling()).toBe(false);
  });

  it("a jump to where the page already is arrives at once", () => {
    page(6000, 1000);
    const focus = vi.spyOn(section("alvo", 1000), "focus");
    smoothScrollTo("alvo");
    expect(focus).toHaveBeenCalledTimes(1);
    expect(isSmoothScrolling()).toBe(false);
  });

  it("a newer jump takes over: the older one never moves focus", () => {
    page(6000);
    const f1 = vi.spyOn(section("um", 800), "focus");
    const f2 = vi.spyOn(section("dois", 2000), "focus");
    smoothScrollTo("um");
    vi.advanceTimersByTime(100);
    smoothScrollTo("dois");
    expect(isSmoothScrolling()).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(window.scrollY).toBe(2000);
    expect(f1).not.toHaveBeenCalled();
    expect(f2).toHaveBeenCalledTimes(1);
    expect(isSmoothScrolling()).toBe(false);
  });

  it("with less motion it goes straight there", () => {
    const tops = page(6000);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const focus = vi.spyOn(section("alvo", 3000), "focus");
    smoothScrollTo("alvo");
    expect(tops).toEqual([3000]);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("Home and End glide the whole page the same way", () => {
    const tops = page(5600, 4800);
    jumpToEdge("top");
    vi.advanceTimersByTime(1500);
    expect(window.scrollY).toBe(0);
    const steps = tops.map((y, i) => (tops[i - 1] ?? 4800) - y);
    expect(Math.max(...steps)).toBeLessThan(800 / 4);
  });
});

describe("jumpDuration", () => {
  it("takes 1.0 s plus 0.1 s per screen, up to 1.4 s", () => {
    expect(jumpDuration(0, 800)).toBe(1000);
    expect(jumpDuration(-1600, 800)).toBe(1200);
    expect(jumpDuration(99999, 800)).toBe(1400);
  });
});

describe("glideAt", () => {
  it("starts at the origin, eases in and out and lands on the destination", () => {
    expect(glideAt(0, 1000, 0, 800)).toBe(0);
    expect(glideAt(0, 1000, 400, 800)).toBeCloseTo(500);
    expect(glideAt(0, 1000, 800, 800)).toBe(1000);
    expect(glideAt(1000, 0, 9999, 800)).toBe(0);
  });

  it("leaves Home/End to fields, menus and the ⌘K list", () => {
    const key = (target: Element, extra: Partial<KeyboardEventInit> = {}) => {
      const e = new KeyboardEvent("keydown", { key: "End", bubbles: true, ...extra });
      Object.defineProperty(e, "target", { value: target });
      return keyIsForPage(e);
    };
    const input = document.createElement("input");
    const div = document.createElement("div");
    document.body.append(input, div);
    expect(key(document.body)).toBe(true);
    expect(key(div)).toBe(true);
    expect(key(input)).toBe(false);
    expect(key(div, { metaKey: true })).toBe(false);
    input.remove();
    div.remove();
  });
});
