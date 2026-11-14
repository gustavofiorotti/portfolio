/** Shape of src/data/github-contributions.json (generated at build time). */
export type Contributions = {
  total: number;
  /** ISO 8601 timestamp of when the data was fetched. */
  fetchedAt: string;
  /** 53 weeks x 7 days, each a level from 0 (none) to 4 (most). */
  weeks: number[][];
};

/** Clamps any value to a valid level (0–4), so a bad entry never breaks the grid colors. */
export function contributionLevel(value: number): 0 | 1 | 2 | 3 | 4 {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(4, Math.round(value))) as 0 | 1 | 2 | 3 | 4;
}
