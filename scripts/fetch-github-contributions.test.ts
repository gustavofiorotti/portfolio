// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { levelFromGitHub, run, toContributions } from "./fetch-github-contributions.mjs";

type Day = { weekday: number; contributionLevel: string };

function response(weeks: Day[][], total = 10) {
  return {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: total,
            weeks: weeks.map((contributionDays) => ({ contributionDays })),
          },
        },
      },
    },
  };
}

const fullWeek = (level = "NONE"): Day[] =>
  Array.from({ length: 7 }, (_, weekday) => ({ weekday, contributionLevel: level }));

const silentLog = { info: vi.fn(), warn: vi.fn() };

describe("levelFromGitHub", () => {
  it("maps the ContributionLevel enum to 0-4", () => {
    expect(levelFromGitHub("NONE")).toBe(0);
    expect(levelFromGitHub("FIRST_QUARTILE")).toBe(1);
    expect(levelFromGitHub("SECOND_QUARTILE")).toBe(2);
    expect(levelFromGitHub("THIRD_QUARTILE")).toBe(3);
    expect(levelFromGitHub("FOURTH_QUARTILE")).toBe(4);
  });

  it("treats unknown levels as 0", () => {
    expect(levelFromGitHub("SOMETHING_NEW")).toBe(0);
    expect(levelFromGitHub(undefined)).toBe(0);
  });
});

describe("toContributions", () => {
  const fetchedAt = new Date("2026-11-13T12:00:00Z");

  it("returns total, ISO fetchedAt and 53 weeks of 7 days", () => {
    const weeks = Array.from({ length: 53 }, () => fullWeek("SECOND_QUARTILE"));
    const data = toContributions(response(weeks, 46), fetchedAt);

    expect(data.total).toBe(46);
    expect(data.fetchedAt).toBe("2026-11-13T12:00:00.000Z");
    expect(data.weeks).toHaveLength(53);
    expect(data.weeks.every((w) => w.length === 7 && w.every((d) => d === 2))).toBe(true);
  });

  it("places days of partial weeks by weekday and pads the rest with 0", () => {
    const first: Day[] = [
      { weekday: 5, contributionLevel: "FOURTH_QUARTILE" },
      { weekday: 6, contributionLevel: "FIRST_QUARTILE" },
    ];
    const last: Day[] = [
      { weekday: 0, contributionLevel: "THIRD_QUARTILE" },
      { weekday: 1, contributionLevel: "NONE" },
    ];
    const weeks = [first, ...Array.from({ length: 51 }, () => fullWeek()), last];
    const data = toContributions(response(weeks), fetchedAt);

    expect(data.weeks[0]).toEqual([0, 0, 0, 0, 0, 4, 1]);
    expect(data.weeks[52]).toEqual([3, 0, 0, 0, 0, 0, 0]);
  });

  it("keeps the most recent 53 weeks when GitHub returns more", () => {
    const weeks = [fullWeek("FOURTH_QUARTILE"), ...Array.from({ length: 53 }, () => fullWeek())];
    const data = toContributions(response(weeks), fetchedAt);

    expect(data.weeks).toHaveLength(53);
    expect(data.weeks.flat().every((d) => d === 0)).toBe(true);
  });

  it("pads at the start when GitHub returns fewer weeks", () => {
    const data = toContributions(response([fullWeek("FIRST_QUARTILE")]), fetchedAt);

    expect(data.weeks).toHaveLength(53);
    expect(data.weeks[0]).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(data.weeks[52]).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  it("throws with the GraphQL error message on an unexpected response", () => {
    expect(() => toContributions({ errors: [{ message: "Could not resolve user" }] })).toThrow(
      "Could not resolve user",
    );
    expect(() => toContributions({})).toThrow("unexpected response shape");
  });
});

describe("run (fallback)", () => {
  const okFetch = vi.fn(async () =>
    new Response(JSON.stringify(response(Array.from({ length: 53 }, () => fullWeek()), 7))),
  );

  it("skips without a token and does not touch the file", async () => {
    const write = vi.fn();
    const fetchImpl = vi.fn();

    await expect(run({ token: "", write, fetchImpl, log: silentLog })).resolves.toBe("skipped");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it("keeps the snapshot on a network error", async () => {
    const write = vi.fn();
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(run({ token: "t", write, fetchImpl, log: silentLog })).resolves.toBe("kept");
    expect(write).not.toHaveBeenCalled();
  });

  it("keeps the snapshot on an HTTP error", async () => {
    const write = vi.fn();
    const fetchImpl = vi.fn(async () => new Response("Bad credentials", { status: 401 }));

    await expect(run({ token: "t", write, fetchImpl, log: silentLog })).resolves.toBe("kept");
    expect(write).not.toHaveBeenCalled();
  });

  it("keeps the snapshot when GitHub answers with GraphQL errors", async () => {
    const write = vi.fn();
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ errors: [{ message: "nope" }] })));

    await expect(run({ token: "t", write, fetchImpl, log: silentLog })).resolves.toBe("kept");
    expect(write).not.toHaveBeenCalled();
  });

  it("writes the converted JSON when the request succeeds", async () => {
    const write = vi.fn();

    await expect(
      run({ token: "t", outputPath: "/tmp/out.json", write, fetchImpl: okFetch, log: silentLog }),
    ).resolves.toBe("updated");
    expect(write).toHaveBeenCalledOnce();
    const [path, content] = write.mock.calls[0];
    expect(path).toBe("/tmp/out.json");
    const json = JSON.parse(content);
    expect(json.total).toBe(7);
    expect(json.weeks).toHaveLength(53);
  });
});
