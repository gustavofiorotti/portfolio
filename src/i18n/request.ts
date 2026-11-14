import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale } from "./locales";

// Each root layout calls setRequestLocale(), so the locale is known at build time.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
