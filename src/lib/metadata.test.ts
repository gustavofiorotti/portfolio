import { describe, expect, it, vi } from "vitest";
import pt from "@/messages/pt.json";
import en from "@/messages/en.json";

vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale }: { locale: string }) => (key: string) =>
    ((locale === "pt" ? pt : en).meta as Record<string, string>)[key],
}));

const { buildMetadata } = await import("./metadata");

describe("buildMetadata", () => {
  it("gives the share card an absolute base, the large image card and the locale", async () => {
    const m = await buildMetadata("pt");
    expect(String(m.metadataBase)).toMatch(/^https:\/\//);
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
    expect(m.openGraph).toMatchObject({ locale: "pt_BR", url: "/", siteName: "gus.poke.site" });
    expect(m.title).toContain("Fullstack");
  });

  it("points the English page to /en and back to Portuguese", async () => {
    const m = await buildMetadata("en");
    expect(m.openGraph).toMatchObject({ locale: "en_US", url: "/en" });
    expect(m.alternates).toMatchObject({ canonical: "/en", languages: { "pt-BR": "/" } });
  });
});
