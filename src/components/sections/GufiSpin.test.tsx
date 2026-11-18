import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import frames from "@/lib/gufi-frames.json";
import { GufiSpin } from "./GufiSpin";

let requested: string[];
function setup({ reduce = false, phone = false } = {}) {
  requested = [];
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("reduced-motion") ? reduce : phone,
    addEventListener() {},
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
      onload: (() => void) | null = null;
      set src(v: string) {
        requested.push(v);
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
});
