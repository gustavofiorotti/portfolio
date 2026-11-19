"use client";
import { useMemo, useSyncExternalStore } from "react";
import { contributionLevel } from "@/lib/github";
import { alignToToday, localDay } from "@/lib/github-calendar";

const cell = (level: number) => `var(--gh-${level})`;
const noSubscribe = () => () => {};
const todayOnClient = () => localDay(new Date()); // a number, so the snapshot is stable
const noTodayOnServer = () => null;

/**
 * The contribution cells. The static HTML shows the snapshot as built; after hydration the grid
 * lines up with the visitor's today (github-calendar.ts), so no day after today is drawn even
 * with an old snapshot.
 */
export function GithubGrid({ weeks, fetchedAt }: { weeks: (number | null)[][]; fetchedAt: string }) {
  const today = useSyncExternalStore(noSubscribe, todayOnClient, noTodayOnServer);
  const grid = useMemo(() => (today === null ? weeks : alignToToday(weeks, new Date(fetchedAt), new Date())), [today, weeks, fetchedAt]);
  return (
    <div className="ml-auto flex w-max gap-[3px] [direction:ltr]" aria-hidden="true">
      {grid.map((week, w) => (
        <div key={w} className="flex flex-col gap-[3px]">
          {/* days outside the calendar (after today) keep their slot but are not drawn, like GitHub */}
          {week.map((level, d) =>
            level === null ? (
              <span key={d} className="size-[15px]" />
            ) : (
              <span key={d} className="size-[15px] rounded-[4px]" style={{ background: cell(contributionLevel(level)) }} />
            ),
          )}
        </div>
      ))}
    </div>
  );
}
