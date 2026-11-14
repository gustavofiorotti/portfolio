import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const raf = (cb: FrameRequestCallback) => (cb(0), 0);

describe("setTheme", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("requestAnimationFrame", raf);
    window.matchMedia = vi.fn(() => ({ matches: false })) as unknown as typeof window.matchMedia;
    document.documentElement.className = "";
    document.documentElement.dataset.theme = "light";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (document as { startViewTransition?: unknown }).startViewTransition;
  });

  it("without View Transitions applies at once and turns transitions back on", async () => {
    const { setTheme } = await import("./theme-client");
    setTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.classList.contains("theme-switching")).toBe(false);
  });

  it("with View Transitions applies inside the callback and ignores a skipped transition", async () => {
    let done!: () => void;
    const finished = new Promise<void>((r) => (done = r));
    (document as unknown as { startViewTransition: unknown }).startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return { ready: Promise.reject(new DOMException("skipped", "AbortError")), finished, updateCallbackDone: Promise.resolve() };
    });
    const { setTheme } = await import("./theme-client");
    setTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.classList.contains("theme-switching")).toBe(true);
    done();
    await finished;
    await Promise.resolve();
    await Promise.resolve();
    expect(document.documentElement.classList.contains("theme-switching")).toBe(false);
  });

  it("two quick toggles flip twice, even before the page shows the first", async () => {
    (document as unknown as { startViewTransition: unknown }).startViewTransition = vi.fn(() => ({
      ready: new Promise(() => {}),
      finished: new Promise(() => {}),
      updateCallbackDone: new Promise(() => {}),
    }));
    const { toggleTheme } = await import("./theme-client");
    const vt = document.startViewTransition as unknown as ReturnType<typeof vi.fn>;
    toggleTheme();
    toggleTheme();
    const applied = vt.mock.calls.map(([cb]) => {
      cb();
      return document.documentElement.dataset.theme;
    });
    expect(applied).toEqual(["dark", "light"]);
  });

  it("reduced motion skips the crossfade", async () => {
    window.matchMedia = vi.fn(() => ({ matches: true })) as unknown as typeof window.matchMedia;
    const vt = vi.fn();
    (document as unknown as { startViewTransition: unknown }).startViewTransition = vt;
    const { setTheme } = await import("./theme-client");
    setTheme("dark");
    expect(vt).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
