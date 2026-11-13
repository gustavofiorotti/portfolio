import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { Dock } from "./Dock";
import "./sections.css";

/** Contact: big question and the dock. Last section of <main>. */
export async function Contact({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "contact" });
  return (
    <section id="contato" className="mx-auto flex max-w-[1120px] flex-col items-center gap-5 px-6 pt-[72px] text-center">
      <h2 className="reveal m-0 font-display text-[clamp(44px,7vw,88px)] leading-none font-semibold tracking-[-0.05em]">{t("title")}</h2>
      <div className="mt-[72px] flex justify-center">
        <Dock />
      </div>
    </section>
  );
}

/** One-line footer: no navigation repeated (kit-gustavo). */
export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "contact" });
  return (
    <footer className="mx-auto max-w-[1120px] px-6 pb-14">
      <div className="mt-[88px] flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-[13px] text-muted">
        <span>{t("copyright", { year: String(new Date().getFullYear()) })}</span>
        <span>{t("madeWith")}</span>
      </div>
    </footer>
  );
}
