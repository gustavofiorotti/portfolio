import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { BrtClock, CourseProgress } from "./LiveValues";
import "./sections.css";

const skills = ["languages", "frontend", "backend", "infra", "ai"] as const;

function Tile({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-[22px] border border-line bg-surface p-[22px] ${className}`}>{children}</div>;
}

/** About: short bio plus a bento with education, English, certification, base and skills. */
export async function About({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "about" });
  // rendered at build time; the client swaps in today's date after hydration
  const buildDay = new Date().toISOString().slice(0, 10);
  return (
    <section id="sobre" className="mx-auto max-w-[1120px] px-6 pt-12 pb-24">
      <div className="reveal flex flex-wrap gap-12 rounded-[32px] bg-card p-[clamp(22px,5vw,56px)] transition-colors duration-500">
        <div className="flex-[1_1_420px] max-sm:flex-[1_1_100%]">
          <h2 className="m-0 mb-5 font-display text-[44px] leading-[1.05] font-semibold tracking-[-0.04em]">{t("title")}</h2>
          <p className="m-0 mb-3.5 text-[17px] leading-[1.65] text-muted">{t("p1")}</p>
          <p className="m-0 text-[17px] leading-[1.65] text-muted">{t("p2")}</p>
        </div>

        <div className="grid flex-[1.4_1_480px] grid-cols-2 gap-3 max-sm:flex-[1_1_100%]">
          <Tile className="col-span-2">
            <CourseProgress buildDay={buildDay} />
          </Tile>

          <Tile className="flex flex-col gap-3 max-[420px]:col-span-2">
            <span className="text-xs text-muted">{t("english")}</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[30px] font-semibold tracking-[-0.03em]">C1</span>
              <span className="text-[13px] text-muted">{t("efset")}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[30px] font-semibold tracking-[-0.03em]">94</span>
              <span className="text-[13px] text-muted">{t("toeic")}</span>
            </div>
          </Tile>

          <div className="flex flex-col justify-between gap-[18px] rounded-[22px] bg-fg p-[22px] text-bg max-[420px]:col-span-2">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <ellipse cx="12" cy="5.5" rx="8" ry="3" />
              <path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
            </svg>
            <div>
              <div className="mb-1 text-xs opacity-65">{t("oracle")}</div>
              <div className="font-display text-lg font-semibold tracking-[-0.02em]">{t("oracleName")}</div>
            </div>
          </div>

          <Tile className="col-span-2 flex flex-wrap items-center gap-5">
            <div className="relative grid size-11 flex-none place-items-center" aria-hidden="true">
              <span className="base-pulse absolute size-3.5 rounded-full bg-accent" />
              <span className="relative size-3 rounded-full bg-accent shadow-[0_0_0_3px_var(--surface)]" />
            </div>
            <div className="flex-[1_1_160px]">
              <div className="text-xs text-muted">{t("base")}</div>
              <div className="font-display text-lg font-semibold tracking-[-0.02em]">{t("place")}</div>
            </div>
            <div className="font-mono text-sm font-medium text-muted">
              <BrtClock />
            </div>
          </Tile>

          <Tile className="col-span-2 py-2">
            <dl className="m-0">
              {skills.map((s) => (
                <div key={s} className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 border-b border-line py-3 last:border-b-0">
                  <dt className="flex-[0_0_120px] font-mono text-xs font-medium text-muted">{t(`skills.${s}.k`)}</dt>
                  <dd className="m-0 flex-[1_1_220px] text-[15px]">{t(`skills.${s}.v`)}</dd>
                </div>
              ))}
            </dl>
          </Tile>
        </div>
      </div>
    </section>
  );
}
