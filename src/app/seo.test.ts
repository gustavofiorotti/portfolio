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

describe("stable share image", () => {
  // gus.poke.site (hosted outside this repo) points its og:image at these fixed URLs
  it("public/og.png and public/og.jpg exist next to the hashed Open Graph image", async () => {
    const { existsSync } = await import("node:fs");
    expect(existsSync("public/og.png")).toBe(true);
    expect(existsSync("public/og.jpg")).toBe(true);
  });

  it("og.jpg is 1200x630 and under 300 KB (WhatsApp skips heavier previews)", async () => {
    const { readFileSync } = await import("node:fs");
    const jpg = readFileSync("public/og.jpg");
    expect(jpg.length).toBeLessThan(300 * 1024);
    // walk the JPEG markers to the frame header (SOF0-SOF15, except DHT/JPG/DAC)
    let i = 2;
    let size: { width: number; height: number } | null = null;
    while (i < jpg.length) {
      const marker = jpg[i + 1];
      const len = jpg.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        size = { height: jpg.readUInt16BE(i + 5), width: jpg.readUInt16BE(i + 7) };
        break;
      }
      i += 2 + len;
    }
    expect(size).toEqual({ width: 1200, height: 630 });
  });
});
