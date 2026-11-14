import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CurrentYear } from "./CurrentYear";

describe("CurrentYear", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders the build year on the server", () => {
    expect(renderToString(<CurrentYear fallback={2026} />)).toBe("2026");
  });

  it("shows the visitor's year on the client, not the frozen build year", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2031-03-01T12:00:00Z"));
    const { container } = render(<CurrentYear fallback={2026} />);
    expect(container.textContent).toBe("2031");
  });
});
