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
