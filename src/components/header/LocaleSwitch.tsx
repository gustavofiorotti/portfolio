"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { homePath, type Locale } from "@/i18n/locales";
import { MorphIcon, MORPHS } from "@/components/ui/MorphIcon";

/**
 * PT / EN switch. The globe morphs into ⇄ on hover or focus, and spins half a turn on the
 * click while the other language loads. Coming back with the browser's back button restores
 * the page from the back/forward cache, so the spin is undone on "pageshow".
 */
export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  const other: Locale = locale === "pt" ? "en" : "pt";
  const [hot, setHot] = useState(false);
  const [spun, setSpun] = useState(false);
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setSpun(false);
        setHot(false);
      }
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  return (
    <Link
      href={homePath(other)}
      hrefLang={other}
      aria-label={label}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      onClick={() => setSpun(true)}
      className="btn btn-ghost flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-line px-2 text-[13px] font-medium whitespace-nowrap sm:h-9 sm:px-3"
    >
      <span className={`inline-flex text-muted transition-[rotate] duration-[450ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] motion-reduce:transition-none ${spun ? "rotate-180" : ""}`}>
        <MorphIcon from={MORPHS.language.from} to={MORPHS.language.to} active={hot || spun} size={15} strokeWidth={1.9} />
      </span>
      {/* phones show only the language it switches to */}
      <span className="sm:hidden">{other.toUpperCase()}</span>
      <span className="hidden sm:inline">
        <span className={locale === "pt" ? "text-fg" : "text-muted"}>PT</span>
        <span className="text-muted">&nbsp;/&nbsp;</span>
        <span className={locale === "en" ? "text-fg" : "text-muted"}>EN</span>
      </span>
    </Link>
  );
}
