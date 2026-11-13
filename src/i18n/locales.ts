export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Path of the home page for a locale: PT has no prefix, EN lives under /en. */
export function homePath(locale: Locale): string {
  return locale === defaultLocale ? "/" : `/${locale}`;
}
