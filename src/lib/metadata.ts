import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { SITE_URL } from "@/lib/site";

/**
 * Title, description and share card for a locale. The share card is the image with only his name
 * as its title, no role (Gustavo, 20/11). Its description is the page's: Next fills og and twitter
 * descriptions from it whenever they are empty. The image comes from the file convention (src/app/opengraph-image.jpg
 * and twitter-image.jpg, with their alt, width and height); metadataBase makes its URL absolute,
 * which WhatsApp, X and LinkedIn require.
 */
export async function buildMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("title");
  const description = t("description");
  // just the name: the image already shows the role
  const shareTitle = t("shareTitle");
  const path = locale === "pt" ? "/" : "/en";
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: path, languages: locale === "pt" ? { en: "/en" } : { "pt-BR": "/" } },
    openGraph: {
      type: "website",
      siteName: "gus.poke.site",
      locale: locale === "pt" ? "pt_BR" : "en_US",
      url: path,
      title: shareTitle,
    },
    twitter: { card: "summary_large_image", title: shareTitle },
  };
}
