/**
 * Lines the contribution grid up with the visitor's today, so the last column ends today like on
 * GitHub even when the snapshot (src/data/github-contributions.json) is a few days old: days after
 * today are not drawn (null), and days between the snapshot and today count as empty (0).
 */

type Grid = (number | null)[][];

const DAY_MS = 86_400_000;

/** Days since the epoch for the local calendar date of `date` (time of day and DST ignored). */
export function localDay(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

/** Weekday (0 = Sunday) of a day number from localDay. */
function weekday(day: number): number {
  return new Date(day * DAY_MS).getUTCDay();
}

/** The grid (Sunday-first columns, oldest first) shifted and trimmed to end on `today`. */
export function alignToToday(weeks: Grid, fetchedAt: Date, today: Date): Grid {
  const n = weeks.length;
  const fetchDay = localDay(fetchedAt);
  const todayDay = localDay(today);
  const lastSunday = fetchDay - weekday(fetchDay);
  const todaySunday = todayDay - weekday(todayDay);
  const shift = Math.max(0, Math.round((todaySunday - lastSunday) / 7));
  return Array.from({ length: n }, (_, c) => {
    const source = weeks[c + shift] ?? [];
    return Array.from({ length: 7 }, (_, d) => {
      const day = todaySunday - (n - 1 - c) * 7 + d;
      if (day > todayDay) return null; // the future: GitHub draws nothing there
      const level = source[d];
      if (level === undefined || level === null) return day > fetchDay ? 0 : null; // after the snapshot: no data yet
      return level;
    });
  });
}
