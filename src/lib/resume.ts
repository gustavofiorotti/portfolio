import type { Locale } from "@/i18n/locales";
import pages from "./resume-pages.json";

/** The résumé PDF for each language, served from public/: /en offers the English one. */
export const RESUME_URLS: Record<Locale, string> = {
  pt: "/curriculo-gustavo-fiorotti.pdf",
  en: "/curriculo-gustavo-fiorotti-en.pdf",
};

export type ResumePage = { src: string; width: number; height: number };

/** The résumé of a language: its PDF and the pictures of its pages for the in-site preview. */
export function resumeFor(locale: Locale): { url: string; pages: ResumePage[] } {
  return { url: RESUME_URLS[locale], pages: pages[locale].pages };
}
