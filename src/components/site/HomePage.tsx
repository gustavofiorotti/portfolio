import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { Header } from "@/components/header/Header";
import { About } from "@/components/sections/About";
import { Contact, SiteFooter } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { GithubActivity } from "@/components/sections/GithubActivity";
import { Projects } from "@/components/sections/Projects";
import { HeroActions } from "./HeroActions";
import { Intro } from "./Intro";
import { MascotStage } from "@/components/mascot/MascotStage";

export async function HomePage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  return (
    <>
      <Intro />
      <Header />
      <MascotStage />
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
        <Projects />
        <GithubActivity locale={locale} />
        <Experience locale={locale} />
        <About locale={locale} />
      </main>
      {/* the closing scene stays out of <main> on purpose: its dock and credits (z-index 17) must
          stack against Bobby's canvas (16) at the root, and anything that gives <main> a layer of
          its own (z-index while Bobby runs behind, the intro's fade) would push them under the
          3D Gufi drawn in that canvas */}
      <Contact locale={locale} />
      <SiteFooter locale={locale} />
    </>
  );
}
