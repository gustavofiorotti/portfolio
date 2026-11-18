import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_KEY, themeInitScript } from "./theme";

const run = () => new Function(themeInitScript)();

function mockSystem(dark: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: dark && q.includes("dark") }));
}

describe("themeInitScript", () => {
  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    vi.unstubAllGlobals();
  });

  it("uses the saved theme when there is one", () => {
    mockSystem(false);
    localStorage.setItem(THEME_KEY, "dark");
    run();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("falls back to the system preference", () => {
    mockSystem(true);
    run();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("ignores an invalid saved value", () => {
    mockSystem(false);
    localStorage.setItem(THEME_KEY, "purple");
    run();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("opening flag", () => {
  afterEach(() => {
    sessionStorage.clear();
    delete document.documentElement.dataset.intro;
    vi.unstubAllGlobals();
  });

  it("plays the opening on the first visit of the session", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    run();
    expect(document.documentElement.dataset.intro).toBe("wait");
  });

  it("skips it when it was already seen or with reduced motion", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce") }));
    run();
    expect(document.documentElement.dataset.intro).toBeUndefined();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    sessionStorage.setItem("intro-seen", "1");
    run();
    expect(document.documentElement.dataset.intro).toBeUndefined();
  });
});
