"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { courseProgress } from "@/lib/course";

// The site is a static export: values that depend on "now" are rendered at build time
// (server snapshot) and refreshed on the client after hydration.
const BUILD_DAY = new Date().toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);
const noopSubscribe = () => () => {};

function useToday() {
  return useSyncExternalStore(noopSubscribe, today, () => BUILD_DAY);
}

const brtFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const brtNow = () => brtFormat.format(new Date());
function subscribeEverySecond(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

/** Current time in Brasília (UTC−3), ticking every minute. */
export function BrtClock() {
  const t = useTranslations("about");
  const time = useSyncExternalStore(subscribeEverySecond, brtNow, () => "--:--");
  return <span>{t("now", { time })}</span>;
}

/** Semester label and progress bar, computed from today's date. */
export function CourseProgress() {
  const t = useTranslations("about");
  const { pct, semester, semesters } = courseProgress(new Date(`${useToday()}T12:00:00Z`));
  return (
    <>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted">{t("education")}</span>
        <span className="font-mono text-xs font-medium text-muted">{t("semester", { semester, semesters, pct })}</span>
      </div>
      <div className="font-display text-xl font-semibold tracking-[-0.02em]">{t("course")}</div>
      <div
        className="mt-3.5 h-2 overflow-hidden rounded-full bg-chip"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={t("course")}
      >
        <div className="course-grow relative h-full overflow-hidden rounded-full bg-fg" style={{ width: `${pct}%` }}>
          <span className="course-shine" />
        </div>
      </div>
      <div className="mt-2 flex justify-between gap-3 font-mono text-xs text-muted">
        <span className="shrink-0">{t("courseStart")}</span>
        <span className="text-right">{t("courseEnd")}</span>
      </div>
    </>
  );
}
