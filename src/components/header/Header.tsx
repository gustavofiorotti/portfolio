"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { homePath, type Locale } from "@/i18n/locales";
import { lerpPath, smoothScrollTo } from "@/lib/motion-utils";
import { useTween } from "@/lib/use-tween";
import { BrandLogo } from "./BrandLogo";
import { BrtClock } from "./BrtClock";
import { CommandMenu } from "./CommandMenu";
import { ResumeButton } from "./ResumeButton";
import { activeSection, SECTION_IDS, type SectionId } from "./sections";

const ARROW_HIDDEN = "M12 12 L12 12 M12 12 L12 12 L12 12";
const ARROW_UP = "M12 19 L12 5 M6 11 L12 5 L18 11";

type Pill = { left: number; width: number } | null;

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const other: Locale = locale === "pt" ? "en" : "pt";
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<SectionId>("topo");
  const [hover, setHover] = useState<Pill>(null);
  const [activePill, setActivePill] = useState<Pill>(null);
  const navRef = useRef<HTMLElement>(null);
  const arrowK = useTween(active === "topo" ? 0 : 1);

  useEffect(() => {
    // measure once per frame at most: reading 4 section positions forces layout
    let frame = 0;
    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 40);
      const tops: Record<string, number> = {};
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el) tops[id] = el.getBoundingClientRect().top;
      }
      const atBottom = y + window.innerHeight >= document.documentElement.scrollHeight - 8;
      setActive(activeSection(tops, atBottom && y > 0));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // the glass pill rests on the current section when the mouse is not over the menu
  useEffect(() => {
    const place = () => {
      const el = navRef.current?.querySelector<HTMLElement>(`[data-nav="${active}"]`);
      setActivePill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    place();
    // fonts and resizes change the menu widths, so the pill is placed again
    document.fonts?.ready.then(place);
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [active, scrolled]);

  const pill = hover ?? activePill;
  const go = (id: SectionId) => (e: React.MouseEvent) => {
    e.preventDefault();
    smoothScrollTo(id, 72);
    history.replaceState(null, "", id === "topo" ? location.pathname : `#${id}`);
  };

  return (
    <div className={`site-header sticky z-20 flex justify-center px-4 transition-[top] duration-300 sm:px-6 ${scrolled ? "top-2.5" : "top-5"}`}>
      <header
        className={`glass grid w-full grid-cols-[1fr_auto] items-center rounded-full transition-[max-width,padding] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] lg:grid-cols-[1fr_auto_1fr] ${
          scrolled ? "max-w-[1040px] py-1.5 pr-1.5 pl-3" : "max-w-[1120px] py-2.5 pr-2.5 pl-4"
        }`}
      >
        <div className="flex items-center gap-1.5 justify-self-start">
          <a
            href="#topo"
            onClick={go("topo")}
            aria-label={t("backToTop")}
            className={`brand flex items-center gap-2.5 rounded-full border py-[3px] pr-3 pl-[3px] font-display text-base font-semibold tracking-[-0.02em] whitespace-nowrap transition-colors duration-300 ${
              active === "topo" ? "border-transparent bg-transparent" : "border-[var(--pill-border)] bg-[var(--pill)]"
            }`}
          >
            <BrandLogo className="brand-logo" />
            gus.poke.site
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="-ml-1 h-3.5 transition-[width,opacity] duration-300"
              style={{ width: active === "topo" ? 0 : 14, opacity: active === "topo" ? 0 : 1 }}
            >
              <path d={lerpPath(ARROW_HIDDEN, ARROW_UP, arrowK)} />
            </svg>
          </a>
          <span className="hidden md:inline">
            <BrtClock label={t("brasiliaTime")} />
          </span>
        </div>

        <nav ref={navRef} aria-label={t("sections")} onMouseLeave={() => setHover(null)} className="relative hidden gap-0.5 text-sm lg:flex">
          <span
            aria-hidden="true"
            className="nav-pill absolute inset-y-0 rounded-full"
            style={{ left: pill?.left ?? 0, width: pill?.width ?? 0, opacity: pill ? 1 : 0 }}
          />
          {SECTION_IDS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              data-nav={id}
              onClick={go(id)}
              onMouseEnter={(e) => setHover({ left: e.currentTarget.offsetLeft, width: e.currentTarget.offsetWidth })}
              aria-current={active === id ? "location" : undefined}
              className={`relative z-[1] rounded-full px-4 py-2 transition-colors duration-200 ${active === id ? "font-semibold text-fg" : "font-medium text-muted hover:text-fg"}`}
            >
              {t(id)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <CommandMenu />
          <Link
            href={homePath(other)}
            hrefLang={other}
            aria-label={t("switchLanguage")}
            className="btn btn-ghost flex h-9 items-center rounded-full border border-line px-3 text-[13px] font-medium whitespace-nowrap"
          >
            <span className={locale === "pt" ? "text-fg" : "text-muted"}>PT</span>
            <span className="text-muted">&nbsp;/&nbsp;</span>
            <span className={locale === "en" ? "text-fg" : "text-muted"}>EN</span>
          </Link>
          <ResumeButton label={t("resume")} />
        </div>
      </header>
    </div>
  );
}
