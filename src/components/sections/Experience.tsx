import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import "./sections.css";

// newest first; bullet keys follow the messages (experience.jobs.<id>.items.<key>)
const jobs = [
  { id: "fullstack", items: ["a", "b", "c", "d"] },
  { id: "support", items: ["a", "b", "c"] },
] as const;

/** Experience: company on the left, timeline of roles on the right. */
export async function Experience({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "experience" });
  return (
    <section id="experiencia" className="mx-auto flex max-w-[1120px] flex-wrap gap-12 px-6 pt-12 pb-24">
      <div className="reveal flex-[1_1_280px]">
        <h2 className="m-0 mb-3 font-display text-[clamp(44px,8vw,56px)] leading-none font-semibold tracking-[-0.045em]">{t("title")}</h2>
        <p className="m-0 text-base leading-relaxed text-muted">
          {t("company")}
          <br />
          {t("span")}
        </p>
      </div>
      <ol className="m-0 flex flex-[2_1_520px] list-none flex-col p-0">
        {jobs.map((job) => (
          <li key={job.id} className="reveal grid grid-cols-[20px_1fr] gap-5">
            <div className="flex flex-col items-center" aria-hidden="true">
              <span className="mt-2 size-3 rounded-full bg-fg" />
              <span className="mt-2 w-px flex-1 bg-line" />
            </div>
            <div className="pb-10">
              <div className="flex flex-wrap justify-between gap-2">
                <h3 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">{t(`jobs.${job.id}.role`)}</h3>
                <span className="font-mono text-[13px] text-muted">{t(`jobs.${job.id}.period`)}</span>
              </div>
              <p className="mt-2 mb-3.5 text-[15px] leading-relaxed text-muted">{t(`jobs.${job.id}.summary`)}</p>
              <ul className="m-0 flex list-disc flex-col gap-1.5 pl-[18px] text-[15px] leading-[1.55]">
                {job.items.map((item) => (
                  <li key={item}>{t(`jobs.${job.id}.items.${item}`)}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
