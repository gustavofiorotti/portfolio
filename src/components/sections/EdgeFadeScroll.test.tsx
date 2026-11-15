import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EdgeFadeScroll } from "./EdgeFadeScroll";

// jsdom has no layout: give every element the widths of a scroller with (or without) overflow
function widths(scroll: number, client: number) {
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(scroll);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(client);
}

const renderIt = () =>
  render(
    <EdgeFadeScroll className="wrap" scrollerClassName="inner" label="101 contribuições">
      <span>grade</span>
    </EdgeFadeScroll>,
  );

describe("EdgeFadeScroll", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("is not a tab stop when everything fits, and has no fade", () => {
    widths(300, 300);
    renderIt();
    const group = screen.getByRole("group", { name: "101 contribuições" });
    expect(group.hasAttribute("tabindex")).toBe(false);
    expect((group.firstElementChild as HTMLElement).dataset.fade).toBeUndefined();
  });

  it("with overflow: the wrapper takes focus, the inner box fades and the arrow keys scroll it", () => {
    widths(900, 300);
    renderIt();
    const group = screen.getByRole("group", { name: "101 contribuições" });
    const inner = group.firstElementChild as HTMLElement;
    inner.scrollBy = vi.fn();
    inner.scrollTo = vi.fn() as unknown as typeof inner.scrollTo;
    expect(group.getAttribute("tabindex")).toBe("0");
    expect(inner.dataset.fade).toBe("right"); // ltr, at the start: weeks hidden on the right
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(inner.scrollBy).toHaveBeenCalledWith({ left: 120 });
    fireEvent.keyDown(group, { key: "Home" });
    expect(inner.scrollTo).toHaveBeenCalled();
  });
});
