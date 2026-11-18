// Pictures of the résumé pages for the in-site preview (iOS shows only the first page of a PDF
// in an iframe). PDFKit (Swift, macOS) draws each page to PNG; sharp turns it into WebP.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

// sharp is not a dependency of ours: Next.js already installs it (image optimization)
const sharp = createRequire(createRequire(import.meta.url).resolve("next/package.json"))("sharp");

const MANIFEST = "src/lib/resume-pages.json";
execFileSync("swift", ["scripts/render-resume-pages.swift"], { stdio: "inherit" });
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
for (const page of manifest.pages) {
  const png = `public${page.src}`;
  await sharp(png).webp({ quality: 85 }).toFile(png.replace(/\.png$/, ".webp"));
  rmSync(png);
  page.src = page.src.replace(/\.png$/, ".webp");
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`${manifest.pages.length} page(s) in WebP`);
