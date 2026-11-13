import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import data from "@/data/github-contributions.json";
import { contributionLevel, type Contributions } from "@/lib/github";
import "./sections.css";

const PROFILE = "https://github.com/gustavofiorotti";
const LEVELS = [0, 1, 2, 3, 4] as const;
const cell = (level: number) => `var(--gh-${level})`;

/** Contribution grid (53 weeks x 7 days) read from src/data/github-contributions.json, refreshed on each deploy. */
export async function GithubActivity({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "about.github" });
  const { total, weeks } = data as Contributions;
  return (
    <section aria-label={t("title")} className="reveal mx-auto max-w-[1120px] px-6 pb-24">
      <div className="rounded-[28px] border border-line bg-surface px-7 pt-7 pb-[22px] max-sm:px-5">
        <div className="mb-[18px] flex flex-wrap justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 font-semibold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            {t("title")}
            <a
              href={PROFILE}
              target="_blank"
              rel="noopener"
              className="font-mono text-[13px] font-medium text-muted underline decoration-line underline-offset-[3px] transition-colors hover:text-fg"
            >
              @gustavofiorotti ↗
            </a>
          </div>
          <span className="text-xs text-muted">{t("total", { total })}</span>
        </div>
        {/* rtl container: on narrow screens the scroll starts at the latest weeks */}
        <div
          className="overflow-x-auto rounded-md [direction:rtl] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
          tabIndex={0}
          role="group"
          aria-label={t("total", { total })}
        >
          <div className="flex w-max gap-[3px] [direction:ltr]" aria-hidden="true">
            {weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {week.map((level, d) => (
                  <span key={d} className="size-[15px] rounded-[4px]" style={{ background: cell(contributionLevel(level)) }} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted" aria-hidden="true">
          {t("less")}
          {LEVELS.map((l) => (
            <span key={l} className="size-3 rounded-[3px]" style={{ background: cell(l) }} />
          ))}
          {t("more")}
        </div>
      </div>
    </section>
  );
}
