/** Computer Science course at UVV: jan/2024 to dec/2027, 8 semesters. */
const COURSE_START = Date.UTC(2024, 0, 1);
const COURSE_END = Date.UTC(2027, 11, 31);
const SEMESTERS = 8;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Course progress for a given date: whole percentage (0–100) and current semester (1–8). */
export function courseProgress(now: Date) {
  const pct = Math.round(clamp((now.getTime() - COURSE_START) / (COURSE_END - COURSE_START), 0, 1) * 100);
  const months = (now.getUTCFullYear() - 2024) * 12 + now.getUTCMonth();
  const semester = clamp(Math.floor(months / 6) + 1, 1, SEMESTERS);
  return { pct, semester, semesters: SEMESTERS };
}
