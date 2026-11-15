import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isWebKitEngine } from "./browser";

const raf = (cb: FrameRequestCallback) => (cb(0), 0);

describe("setTheme", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("requestAnimationFrame", raf);
    window.matchMedia = vi.fn(() => ({ matches: false })) as unknown as typeof window.matchMedia;
    document.documentElement.className = "";
    document.documentElement.dataset.theme = "light";
    // jsdom's own user agent reads as WebKit; these tests are about the crossfade path
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (document as { startViewTransition?: unknown }).startViewTransition;
  });

  it("in WebKit it switches without the View Transition (Safari kept the glass see-through)", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15");
    const start = vi.fn();
    (document as { startViewTransition?: unknown }).startViewTransition = start;
    const { setTheme } = await import("./theme-client");
    setTheme("dark");
    expect(start).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.classList.contains("theme-switching")).toBe(false);
  });

  it("after a dry switch the glass repaints for one frame, without a denser fill", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (frames.push(cb), 0));
    const { setTheme } = await import("./theme-client");
    setTheme("dark");
    const html = document.documentElement;
    frames.shift()!(0);
    frames.shift()!(0); // two frames: transitions back on
    expect(html.classList.contains("theme-switching")).toBe(false);
    expect(html.classList.contains("theme-settling")).toBe(false);
    expect(html.classList.contains("theme-repaint")).toBe(true);
    frames.shift()!(0);
    expect(html.classList.contains("theme-repaint")).toBe(false);
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

describe("isWebKitEngine", () => {
  const UA = {
    safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
    safariIOS: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1",
    chromeIOS: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
    chromeMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0",
    android: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  };
  it("is true for Safari and every iOS browser (all WebKit)", () => {
    expect(isWebKitEngine(UA.safariMac)).toBe(true);
    expect(isWebKitEngine(UA.safariIOS)).toBe(true);
    expect(isWebKitEngine(UA.chromeIOS)).toBe(true);
  });
  it("is false for Chromium browsers and Firefox", () => {
    expect(isWebKitEngine(UA.chromeMac)).toBe(false);
    expect(isWebKitEngine(UA.edge)).toBe(false);
    expect(isWebKitEngine(UA.android)).toBe(false);
    expect(isWebKitEngine(UA.firefox)).toBe(false);
  });
});
