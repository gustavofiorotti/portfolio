"use client";
import { useEffect, useRef, useState } from "react";
import frames from "@/lib/gufi-frames.json";
import { prefersReducedMotion } from "@/lib/motion-utils";
import { frameAt, loadOrder, nearestLoaded, spinProgress } from "./gufi-spin";

type Set = keyof typeof frames;
const PHONE = "(max-width: 640px)"; // same width as the phone aspect ratio in footer.css
const src = (set: Set, i: number) => `/gufi/${set}/${String(i).padStart(2, "0")}.webp`;

/**
 * The giant Gufi behind the footer, turning half a turn with the scroll (his back when the footer
 * comes in, his face at the very end, like the Open Graph image). A sequence of pre-rendered
 * pictures drawn on a 2D canvas, no second WebGL scene: phones get fewer and smaller frames, and
 * with reduced motion only the last pose loads, standing still.
 */
export function GufiSpin() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [set, setSet] = useState<Set | null>(null);

  // the frame set follows the width (a window resized across the phone width swaps it)
  useEffect(() => {
    const mq = matchMedia(PHONE);
    const pick = () => setSet(mq.matches ? "m" : "d");
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, []);

  useEffect(() => {
    if (!set) return;
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const still = prefersReducedMotion();
    const { count } = frames[set];
    const images: HTMLImageElement[] = [];
    const loaded: boolean[] = Array(count).fill(false);
    let shown = -1;
    let raf = 0;
    let started = false;

    const fit = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
      shown = -1;
    };
    const wanted = () => {
      if (still) return count - 1;
      const top = el.getBoundingClientRect().top + scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      return frameAt(spinProgress(scrollY, innerHeight, top, max), count);
    };
    const draw = () => {
      raf = 0;
      const i = nearestLoaded(wanted(), loaded);
      if (i < 0 || i === shown) return;
      shown = i;
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.drawImage(images[i], 0, 0, el.width, el.height);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const load = () => {
      if (started) return;
      started = true;
      const order = still ? [count - 1] : loadOrder(wanted(), count);
      for (const i of order) {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          loaded[i] = true;
          schedule();
        };
        img.src = src(set, i);
        images[i] = img;
      }
    };

    fit();
    // fetch the frames only when the footer gets close
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && load(), { rootMargin: "100% 0px" });
    io.observe(el);
    const ro = new ResizeObserver(() => {
      fit();
      schedule();
    });
    ro.observe(el);
    if (!still) addEventListener("scroll", schedule, { passive: true });
    return () => {
      io.disconnect();
      ro.disconnect();
      removeEventListener("scroll", schedule);
      cancelAnimationFrame(raf);
    };
  }, [set]);

  return <canvas ref={canvas} className="gufi-canvas" aria-hidden="true" />;
}
