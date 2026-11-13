import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { Header } from "@/components/header/Header";
import { HeroActions } from "./HeroActions";
import { Intro } from "./Intro";

export async function HomePage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  return (
    <>
      <Intro />
      <Header />
      <main>
        <section id="topo" className="mx-auto flex max-w-[1120px] flex-col items-center gap-7 px-6 pt-40 pb-24 text-center">
          <h1 className="font-display text-[clamp(56px,10vw,136px)] leading-[0.94] font-semibold tracking-[-0.055em]">
            <span className="block">Gustavo</span>
            <span className="block">Fiorotti</span>
          </h1>
          <p className="max-w-[640px] text-xl leading-relaxed text-muted">
            {t.rich("hero.lead", {
              stack: (chunks) => <span className="font-medium text-fg">{chunks}</span>,
            })}
          </p>
          <HeroActions />
        </section>
      </main>
    </>
  );
}
