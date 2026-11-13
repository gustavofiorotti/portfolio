import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { homePath, type Locale } from "@/i18n/locales";

export async function HomePage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const other: Locale = locale === "pt" ? "en" : "pt";
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1120px] flex-col items-center justify-center gap-7 px-6 text-center">
      <h1 className="font-display text-[clamp(56px,10vw,136px)] leading-[0.94] font-semibold tracking-[-0.055em]">
        Gustavo
        <br />
        Fiorotti
      </h1>
      <p className="max-w-[640px] text-xl leading-relaxed text-muted">
        {t.rich("hero.lead", {
          stack: (chunks) => <span className="font-medium text-fg">{chunks}</span>,
        })}
      </p>
      <Link href={homePath(other)} hrefLang={other} className="rounded-full border border-line px-5 py-2 text-sm">
        {t("nav.switchLanguage")}
      </Link>
    </main>
  );
}
