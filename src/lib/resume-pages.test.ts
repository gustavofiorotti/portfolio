import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "./resume-pages.json";
import { RESUME_URLS, resumeFor } from "./resume";

describe.each(["pt", "en"] as const)("résumé page pictures (%s)", (lang) => {
  it("were made from the current PDF (run `pnpm resume:pages` after changing it)", () => {
    const pdf = readFileSync(`public${RESUME_URLS[lang]}`);
    expect(createHash("sha256").update(pdf).digest("hex")).toBe(manifest[lang].pdfSha256);
  });

  it("exist for every page", () => {
    const { pages } = resumeFor(lang);
    expect(pages.length).toBeGreaterThan(0);
    for (const p of pages) expect(existsSync(`public${p.src}`)).toBe(true);
  });
});

describe("résumé per language", () => {
  it("offers the English PDF and pictures on /en and the Portuguese ones on /", () => {
    expect(resumeFor("pt").url).toBe("/curriculo-gustavo-fiorotti.pdf");
    expect(resumeFor("en").url).toBe("/curriculo-gustavo-fiorotti-en.pdf");
    expect(resumeFor("en").pages[0].src).toMatch(/^\/curriculo\/en\//);
    expect(resumeFor("pt").pages[0].src).not.toMatch(/\/en\//);
  });
});
