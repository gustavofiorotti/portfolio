import { describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists PT at / and EN at /en with language alternates", () => {
    const entries = sitemap();
    expect(entries.map((e) => e.url)).toEqual(["https://gufi.vercel.app", "https://gufi.vercel.app/en"]);
    for (const entry of entries) {
      expect(entry.alternates?.languages).toEqual({
        "pt-BR": "https://gufi.vercel.app",
        en: "https://gufi.vercel.app/en",
      });
    }
  });
});

describe("robots", () => {
  it("allows everything and points to the sitemap", () => {
    expect(robots()).toMatchObject({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://gufi.vercel.app/sitemap.xml",
    });
  });
});
