import { act, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MorphIcon, MORPHS } from "./MorphIcon";

function Hoverable() {
  const [on, setOn] = useState(false);
  return (
    <a href="#" onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)}>
      <MorphIcon {...MORPHS.code} active={on} />
    </a>
  );
}

describe("MorphIcon", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("morphs to the second shape on hover and back when the mouse leaves", () => {
    const { container } = render(<Hoverable />);
    const d = () => container.querySelector("path")!.getAttribute("d");
    expect(d()).toBe(MORPHS.code.from);
    fireEvent.mouseEnter(container.querySelector("a")!);
    act(() => vi.advanceTimersByTime(600));
    expect(d()).toBe(MORPHS.code.to);
    fireEvent.mouseLeave(container.querySelector("a")!);
    act(() => vi.advanceTimersByTime(600));
    expect(d()).toBe(MORPHS.code.from);
  });

  it("is halfway through the shape change mid-animation", () => {
    const { container } = render(<Hoverable />);
    fireEvent.mouseEnter(container.querySelector("a")!);
    act(() => vi.advanceTimersByTime(150));
    const d = container.querySelector("path")!.getAttribute("d");
    expect(d).not.toBe(MORPHS.code.from);
    expect(d).not.toBe(MORPHS.code.to);
  });
});
