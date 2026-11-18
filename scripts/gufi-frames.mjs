// Frames of the footer's Gufi turning half a turn (back → front, the Open Graph pose), as WebP.
// Input: square PNGs f000.png … f035.png rendered from the plush prototype
// (portfolio-materiais/prototipo-pelucia, `?char=1&hq=1&size=900&spin=<radians>`, -π → 0).
// Only the top of the ball shows in the footer, so the frames are cropped there.
// Desktop gets every frame; phones every other frame, smaller.
// Run: node scripts/gufi-frames.mjs <dir with the PNGs>
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

// sharp is not a dependency of ours: Next.js already installs it (image optimization)
const sharp = createRequire(createRequire(import.meta.url).resolve("next/package.json"))("sharp");

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/gufi-frames.mjs <png dir>");
const files = readdirSync(src).filter((f) => /^f\d+\.png$/.test(f)).sort();
// crop: share of the square, from the top, that the footer shows. Phones show more of the ball,
// so the credits (two lines there) sit below his eyes.
const sets = { d: { size: 1600, step: 1, quality: 58, crop: 0.64 }, m: { size: 480, step: 2, quality: 70, crop: 0.84 } };
const manifest = {};
for (const [key, { size, step, quality, crop }] of Object.entries(sets)) {
  mkdirSync(`public/gufi/${key}`, { recursive: true });
  const picked = files.filter((_, i) => i % step === 0 || i === files.length - 1);
  let i = 0;
  for (const f of picked) {
    await sharp(`${src}/${f}`)
      .resize(size, size)
      .extract({ left: 0, top: 0, width: size, height: Math.round(size * crop) })
      .webp({ quality, alphaQuality: 80 })
      .toFile(`public/gufi/${key}/${String(i++).padStart(2, "0")}.webp`);
  }
  manifest[key] = { count: picked.length, width: size, height: Math.round(size * crop) };
}
writeFileSync("src/lib/gufi-frames.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(manifest);
