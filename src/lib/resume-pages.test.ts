import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "./resume-pages.json";
import { RESUME_URL } from "./resume";

describe("résumé page pictures", () => {
  it("were made from the current PDF (run `pnpm resume:pages` after changing it)", () => {
    const pdf = readFileSync(`public${RESUME_URL}`);
    expect(createHash("sha256").update(pdf).digest("hex")).toBe(manifest.pdfSha256);
  });

  it("exist for every page", () => {
    expect(manifest.pages.length).toBeGreaterThan(0);
    for (const p of manifest.pages) expect(existsSync(`public${p.src}`)).toBe(true);
  });
});
