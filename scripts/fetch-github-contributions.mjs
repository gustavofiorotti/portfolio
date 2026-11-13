// Fetches the GitHub contribution calendar and writes src/data/github-contributions.json.
// Runs before `next build` (prebuild). Without GITHUB_TOKEN, or on any error, it keeps the
// committed JSON and exits 0, so the build never breaks because of GitHub.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const GITHUB_LOGIN = "gustavofiorotti";
export const WEEKS = 53;
export const DAYS = 7;
export const OUTPUT_PATH = fileURLToPath(
  new URL("../src/data/github-contributions.json", import.meta.url),
);

const QUERY = `query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { weekday contributionLevel } }
      }
    }
  }
}`;

/** @typedef {{ total: number, fetchedAt: string, weeks: number[][] }} Contributions */

const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

/** Maps GitHub's ContributionLevel enum to 0-4; unknown values count as 0. */
export function levelFromGitHub(level) {
  return LEVELS[level] ?? 0;
}

/**
 * Converts the GraphQL response into { total, fetchedAt, weeks } with exactly 53 weeks of 7 days
 * (Sunday first). Partial weeks are padded with 0 by weekday; extra leading weeks are dropped.
 * Throws when the response does not have the expected shape.
 * @param {any} response
 * @param {Date} [fetchedAt]
 * @returns {Contributions}
 */
export function toContributions(response, fetchedAt = new Date()) {
  const calendar = response?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar || !Array.isArray(calendar.weeks) || typeof calendar.totalContributions !== "number") {
    const reason = response?.errors?.[0]?.message ?? "unexpected response shape";
    throw new Error(`GitHub GraphQL: ${reason}`);
  }

  const weeks = calendar.weeks.map((week) => {
    const days = new Array(DAYS).fill(0);
    for (const day of week.contributionDays ?? []) {
      if (Number.isInteger(day.weekday) && day.weekday >= 0 && day.weekday < DAYS) {
        days[day.weekday] = levelFromGitHub(day.contributionLevel);
      }
    }
    return days;
  });

  const lastWeeks = weeks.slice(-WEEKS);
  const padding = Array.from({ length: WEEKS - lastWeeks.length }, () => new Array(DAYS).fill(0));

  return {
    total: calendar.totalContributions,
    fetchedAt: fetchedAt.toISOString(),
    weeks: [...padding, ...lastWeeks],
  };
}

/** Calls the GitHub GraphQL API and returns the converted contributions. */
export async function fetchContributions({ token, login = GITHUB_LOGIN, fetchImpl = fetch }) {
  const res = await fetchImpl("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "portfolio-build",
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL: HTTP ${res.status}`);
  return toContributions(await res.json());
}

/** True when two snapshots have the same total and calendar (fetchedAt is ignored). */
export function sameData(a, b) {
  return a.total === b.total && JSON.stringify(a.weeks) === JSON.stringify(b.weeks);
}

/** Reads the current snapshot, or null if it is missing or not valid JSON. */
async function readSnapshot(path, read) {
  try {
    return JSON.parse(await read(path, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Refreshes the JSON file. Returns "updated", "unchanged" (same total and weeks, file untouched so
 * builds do not produce a diff), "skipped" (no token) or "kept" (error); never throws, so a missing
 * token or a network failure leaves the committed snapshot in place.
 * @param {{
 *   token?: string,
 *   outputPath?: string,
 *   fetchImpl?: typeof fetch,
 *   write?: (path: string, content: string) => Promise<void>,
 *   read?: (path: string, encoding: "utf8") => Promise<string>,
 *   log?: Pick<Console, "info" | "warn">,
 * }} [options]
 * @returns {Promise<"updated" | "unchanged" | "skipped" | "kept">}
 */
export async function run({
  token = process.env.GITHUB_TOKEN,
  outputPath = OUTPUT_PATH,
  fetchImpl = fetch,
  write = writeFile,
  read = readFile,
  log = console,
} = {}) {
  if (!token) {
    log.warn("[github-contributions] GITHUB_TOKEN not set; keeping the committed snapshot.");
    return "skipped";
  }
  try {
    const data = await fetchContributions({ token, fetchImpl });
    const current = await readSnapshot(outputPath, read);
    if (current && sameData(current, data)) {
      log.info(`[github-contributions] ${data.total} contributions, no changes; file kept as is.`);
      return "unchanged";
    }
    await write(outputPath, `${JSON.stringify(data)}\n`);
    log.info(`[github-contributions] ${data.total} contributions saved.`);
    return "updated";
  } catch (error) {
    log.warn(`[github-contributions] ${error.message}; keeping the committed snapshot.`);
    return "kept";
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await run();
  // Fail loudly only if there is no snapshot at all, since the site imports it.
  await readFile(OUTPUT_PATH).catch(() => {
    console.error(`[github-contributions] ${OUTPUT_PATH} is missing.`);
    process.exitCode = 1;
  });
}
