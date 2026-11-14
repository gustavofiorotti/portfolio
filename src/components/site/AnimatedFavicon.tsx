"use client";
import { useEffect } from "react";
import { eyesAt, frameKey } from "@/lib/favicon-eyes";

const SIZE = 64;
const S = SIZE / 32; // the eye keys are in the logo's 32×32 box

/**
 * The tab icon blinks and glances like the header logo. SVG favicons do not animate in Chrome
 * or Safari, so frames are drawn on a canvas and swapped into the <link rel="icon">.
 * Hidden tabs throttle timers to about 1/s, which still shows the glances.
 */
export function AnimatedFavicon() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    const g = canvas.getContext("2d");
    if (!g) return;
    const img = new Image();
    img.src = "/brand/favicon-base.png";
    // animate the icon links Next.js renders (a link of our own can end up before them and lose,
    // and streamed metadata can add more later, so they are looked up on every frame); their
    // original hrefs come back on unmount
    const original = new Map<HTMLLinkElement, string>();
    const links = () => [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')];
    let cancelled = false;
    let last = "";
    let timer: ReturnType<typeof setTimeout> | undefined;
    const t0 = performance.now();

    const draw = () => {
      const e = eyesAt(performance.now() - t0);
      const key = frameKey(e);
      if (key !== last || links().some((l) => !original.has(l))) {
        last = key;
        g.clearRect(0, 0, SIZE, SIZE);
        g.drawImage(img, 0, 0, SIZE, SIZE);
        g.fillStyle = "#FAFAF9";
        // eye spots on the tightly cropped base image (it fills the whole icon edge to edge)
        for (const cx of [12.85, 19.17]) {
          g.beginPath();
          g.ellipse((cx + e.dx) * S, (13.85 + e.dy) * S, 2.33 * S, 3.35 * S * e.open, 0, 0, Math.PI * 2);
          g.fill();
        }
        const url = canvas.toDataURL("image/png");
        for (const l of links()) {
          if (!original.has(l)) original.set(l, l.href);
          l.href = url;
        }
      }
      timer = setTimeout(draw, 66);
    };
    img.onload = () => {
      if (!cancelled) draw();
    };
    return () => {
      cancelled = true;
      clearTimeout(timer);
      original.forEach((href, l) => (l.href = href));
    };
  }, []);
  return null;
}
