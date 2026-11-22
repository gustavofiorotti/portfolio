// Pictures of the résumé pages for the in-site preview, one set per language (iOS shows only the
// first page of a PDF in an iframe). PDFKit (Swift, macOS) draws each page to PNG; sharp turns it
// into WebP. The manifest keeps each language's pages and its PDF's SHA-256.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

// sharp is not a dependency of ours: Next.js already installs it (image optimization)
const sharp = createRequire(createRequire(import.meta.url).resolve("next/package.json"))("sharp");

const MANIFEST = "src/lib/resume-pages.json";
// the Portuguese pictures keep their old place; the English ones get a folder of their own
const RESUMES = {
  pt: { pdf: "public/curriculo-gustavo-fiorotti.pdf", src: "/curriculo" },
  en: { pdf: "public/curriculo-gustavo-fiorotti-en.pdf", src: "/curriculo/en" },
};

const tmp = mkdtempSync(join(tmpdir(), "resume-pages-"));
const manifest = {};
for (const [lang, { pdf, src }] of Object.entries(RESUMES)) {
  mkdirSync(`public${src}`, { recursive: true });
  const entry = join(tmp, `${lang}.json`);
  execFileSync("swift", ["scripts/render-resume-pages.swift", pdf, `public${src}`, src, entry], { stdio: "inherit" });
  const pages = JSON.parse(readFileSync(entry, "utf8"));
  for (const page of pages.pages) {
    const png = `public${page.src}`;
    await sharp(png).webp({ quality: 85 }).toFile(png.replace(/\.png$/, ".webp"));
    rmSync(png);
    page.src = page.src.replace(/\.png$/, ".webp");
  }
  manifest[lang] = pages;
  console.log(`${lang}: ${pages.pages.length} page(s) in WebP`);
}
rmSync(tmp, { recursive: true });
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
