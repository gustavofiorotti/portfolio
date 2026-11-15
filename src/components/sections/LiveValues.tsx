"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { courseProgress } from "@/lib/course";

// The site is a static export: values that depend on "now" are rendered at build time
// (server snapshot, passed down from the server) and refreshed on the client after hydration.
const today = () => new Date().toISOString().slice(0, 10);
const noopSubscribe = () => () => {};

const brtFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const brtNow = () => brtFormat.format(new Date());
// polls every second so the minute flips on time; React only re-renders when the text changes
function subscribeEverySecond(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

/** Current time in Brasília (UTC−3), HH:MM. */
export function BrtClock() {
  const t = useTranslations("about");
  const time = useSyncExternalStore(subscribeEverySecond, brtNow, () => "--:--");
  return <span>{t("now", { time })}</span>;
}

/** Semester label and progress bar, computed from today's date (YYYY-MM-DD). */
export function CourseProgress({ buildDay }: { buildDay: string }) {
  const t = useTranslations("about");
  const day = useSyncExternalStore(noopSubscribe, today, () => buildDay);
  const { pct, semester, semesters } = courseProgress(new Date(`${day}T12:00:00Z`));
  // the bar grows once when it enters the view. Server render and first paint show it full
  // ("done"); a bar still below the fold drops to 0 out of sight ("wait") and grows ("go") when
  // it is reached. One already on screen at load just stays full.
  const bar = useRef<HTMLDivElement>(null);
  const [grow, setGrow] = useState<"done" | "wait" | "go">("done");
  useEffect(() => {
    const el = bar.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    setGrow("wait");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        requestAnimationFrame(() => setGrow("go")); // a frame at width 0 first, so it transitions
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted">{t("education")}</span>
        <span className="font-mono text-xs font-medium text-muted">{t("semester", { semester, semesters, pct })}</span>
      </div>
      <div className="font-display text-xl font-semibold tracking-[-0.02em]">{t("course")}</div>
      <div
        ref={bar}
        className="mt-3.5 h-2 rounded-full bg-chip"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={t("course")}
      >
        <div className="course-fill relative h-full rounded-full" data-grow={grow} style={{ width: `${pct}%` }}>
          {/* the shimmer runs inside the fill; the tip glow sits outside it, so it is not clipped */}
          <span className="absolute inset-0 overflow-hidden rounded-full">
            <span className="course-shine" />
          </span>
          <span className="course-tip" />
        </div>
      </div>
      <div className="mt-2 flex justify-between gap-3 font-mono text-xs text-muted">
        <span className="shrink-0">{t("courseStart")}</span>
        <span className="text-right">{t("courseEnd")}</span>
      </div>
    </>
  );
}
