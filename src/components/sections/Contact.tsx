import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { CurrentYear } from "./CurrentYear";
import { Dock } from "./Dock";
import { GufiStill } from "./GufiStill";
import "./sections.css";
import "./footer.css";

/**
 * Contact and footer as one closing scene: the big question, the dock floating in front of a giant
 * Gufi (the header logo's character, upper half only) and the credits on glass over him. On desktop
 * with 3D he is live in Bobby's canvas (FooterGufi); otherwise a still picture that blinks.
 */
export async function Contact({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "contact" });
  return (
    <section id="contato" data-scroll-end aria-labelledby="contato-title" className="contact-stage">
      <h2 id="contato-title" className="reveal m-0 font-display text-[clamp(44px,7vw,96px)] leading-none font-semibold tracking-[-0.05em]">{t("title")}</h2>
      <div className="contact-dock">
        <Dock />
      </div>
      <div className="gufi-stage">
        <GufiStill />
      </div>
    </section>
  );
}

/** Credits and the year, on glass over the Gufi; no navigation repeated, no back to top (kit-gustavo). */
export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "contact" });
  return (
    <footer className="site-credits">
      <p className="glass site-credits-pill">
        <span>{t.rich("copyright", { year: () => <CurrentYear fallback={new Date().getFullYear()} /> })}</span>
        <span aria-hidden="true" className="site-credits-dot">·</span>
        <span>{t("madeWith")}</span>
      </p>
    </footer>
  );
}
