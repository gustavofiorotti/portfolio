import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import frames from "@/lib/gufi-frames.json";
import { GufiSpin } from "./GufiSpin";

let requested: string[];
let hold: boolean; // images stay "downloading" until released
let pending: (() => void)[];
let mqListeners: Record<string, () => void>;
const media = { reduce: false, phone: false };
function setup({ reduce = false, phone = false, saveData = false } = {}) {
  requested = [];
  hold = false;
  pending = [];
  mqListeners = {};
  media.reduce = reduce;
  media.phone = phone;
  Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData } });
  vi.stubGlobal("matchMedia", (q: string) => ({
    get matches() {
      return q.includes("reduced-motion") ? media.reduce : media.phone;
    },
    addEventListener(_: string, cb: () => void) {
      mqListeners[q] = cb;
    },
    removeEventListener() {},
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: (e: { isIntersecting: boolean }[]) => void) {}
      observe() {
        this.cb([{ isIntersecting: true }]);
      }
      disconnect() {}
    },
  );
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal(
    "Image",
    class {
      decoding = "";
      complete = true;
      naturalWidth = 1;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(v: string) {
        requested.push(v);
        const done = () => this.onload?.();
        if (hold) pending.push(done);
        else done();
      }
    },
  );
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ clearRect() {}, drawImage() {} })) as never;
}

describe("GufiSpin", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
  beforeEach(() => vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0));

  it("is decorative: an aria-hidden canvas", () => {
    setup();
    const { container } = render(<GufiSpin />);
    expect(container.querySelector("canvas")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("loads every desktop frame, starting with the one for the current scroll", () => {
    setup();
    render(<GufiSpin />);
    expect(requested).toHaveLength(frames.d.count);
    expect(new Set(requested).size).toBe(frames.d.count);
    expect(requested.every((s) => s.startsWith("/gufi/d/"))).toBe(true);
  });

  it("phones get the smaller set", () => {
    setup({ phone: true });
    render(<GufiSpin />);
    expect(requested).toHaveLength(frames.m.count);
    expect(requested[0]).toMatch(/^\/gufi\/m\//);
  });

  it("with reduced motion only the last pose (his face, the Open Graph one) loads", () => {
    setup({ reduce: true });
    render(<GufiSpin />);
    expect(requested).toEqual([`/gufi/d/${String(frames.d.count - 1).padStart(2, "0")}.webp`]);
  });

  it("loads in batches: the next one only starts when the previous has arrived", () => {
    setup();
    hold = true;
    render(<GufiSpin />);
    expect(requested).toHaveLength(6);
    pending.splice(0).forEach((f) => f());
    expect(requested).toHaveLength(12);
  });

  it("Save-Data gets every other frame, still ending on his face", () => {
    setup({ saveData: true });
    render(<GufiSpin />);
    expect(requested).toHaveLength(Math.ceil(frames.d.count / 2) + (frames.d.count % 2 === 0 ? 1 : 0));
    expect(requested).toContain(`/gufi/d/${String(frames.d.count - 1).padStart(2, "0")}.webp`);
  });

  it("turning reduced motion on later swaps to the still pose, and the old loads are dropped", () => {
    setup();
    hold = true;
    render(<GufiSpin />);
    const before = requested.length;
    act(() => {
      media.reduce = true;
      mqListeners["(prefers-reduced-motion: reduce)"]();
    });
    expect(requested.slice(before)).toEqual([`/gufi/d/${String(frames.d.count - 1).padStart(2, "0")}.webp`]);
    // the first set's images arriving now start no new batch
    const n = requested.length;
    pending.splice(0, 6).forEach((f) => f());
    expect(requested.length).toBe(n);
  });
});
