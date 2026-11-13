import type { MetadataRoute } from "next";
import { homePath } from "@/i18n/locales";
import { siteUrl } from "@/lib/site";

// Required by `output: "export"` so the file is generated at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { "pt-BR": siteUrl(homePath("pt")), en: siteUrl(homePath("en")) };
  const lastModified = new Date();
  return [
    { url: languages["pt-BR"], lastModified, alternates: { languages } },
    { url: languages.en, lastModified, alternates: { languages } },
  ];
}
