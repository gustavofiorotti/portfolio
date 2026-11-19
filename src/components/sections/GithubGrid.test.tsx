import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GithubGrid } from "./GithubGrid";

afterEach(() => vi.useRealTimers());

describe("GithubGrid", () => {
  it("ends on the visitor's today even with an older snapshot", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 15, 9)); // Sunday
    const weeks = [Array(7).fill(1), Array(7).fill(2)];
    const { container } = render(<GithubGrid weeks={weeks} fetchedAt={new Date(2026, 10, 14, 10).toISOString()} />);
    const columns = container.querySelectorAll(":scope > div > div");
    expect(columns).toHaveLength(2);
    const drawn = [...columns].map((c) => [...c.children].filter((s) => (s as HTMLElement).style.background).length);
    expect(drawn).toEqual([7, 1]); // last week: only Sunday
  });
});
