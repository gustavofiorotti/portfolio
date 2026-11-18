"use client";
import { useEffect, useRef, useState } from "react";
import frames from "@/lib/gufi-frames.json";
import { frameAt, inBatches, loadOrder, nearestLoaded, pickFrames, spinProgress } from "./gufi-spin";

type Set = keyof typeof frames;
const PHONE = "(max-width: 640px)"; // same width as the phone aspect ratio in footer.css
const REDUCE = "(prefers-reduced-motion: reduce)";
const BATCH = 6;
const src = (set: Set, i: number) => `/gufi/${set}/${String(i).padStart(2, "0")}.webp`;

/** A media query as state, following its changes. */
function useMedia(query: string): boolean | null {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = matchMedia(query);
    const pick = () => setOn(mq.matches);
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, [query]);
  return on;
}

/**
 * The giant Gufi behind the footer, turning half a turn with the scroll (his back when the footer
 * comes in, his face at the very end, like the Open Graph image). A sequence of pre-rendered
 * pictures drawn on a 2D canvas, no second WebGL scene: phones get fewer and smaller frames,
 * Save-Data every other frame, and with reduced motion only the last pose loads, standing still.
 */
export function GufiSpin() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const phone = useMedia(PHONE);
  const still = useMedia(REDUCE);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || phone === null || still === null) return;
    const set: Set = phone ? "m" : "d";
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    // the frames this visitor gets; the scroll picks a slot among them
    const used = still ? [frames[set].count - 1] : pickFrames(frames[set].count, saveData);
    const images: HTMLImageElement[] = [];
    const loaded: boolean[] = Array(used.length).fill(false);
    let alive = true; // a set swap or unmount drops the old loads and draws
    let shown = -1;
    let raf = 0;
    let started = false;
    let top = 0;
    let max = 0;

    // layout is read only here (on resize), never per frame
    const measure = () => {
      top = el.getBoundingClientRect().top + scrollY;
      max = document.documentElement.scrollHeight - innerHeight;
    };
    const fit = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
      measure();
      shown = -1;
    };
    const wanted = () => (used.length === 1 ? 0 : frameAt(spinProgress(scrollY, innerHeight, top, max), used.length));
    const draw = () => {
      raf = 0;
      if (!alive) return;
      const i = nearestLoaded(wanted(), loaded);
      if (i < 0 || i === shown) return;
      shown = i;
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.drawImage(images[i], 0, 0, el.width, el.height);
    };
    const schedule = () => {
      if (alive && !raf) raf = requestAnimationFrame(draw);
    };
    // batches from the frame on screen outwards: each one starts when the previous has arrived
    const loadBatch = (queue: number[][]) => {
      const batch = queue.shift();
      if (!batch || !alive) return;
      let left = batch.length;
      for (const slot of batch) {
        const img = new Image();
        img.decoding = "async";
        img.onload = img.onerror = () => {
          if (!alive) return;
          if (img.complete && img.naturalWidth > 0) loaded[slot] = true;
          schedule();
          if (--left === 0) loadBatch(queue);
        };
        img.src = src(set, used[slot]);
        images[slot] = img;
      }
    };
    const load = () => {
      if (started) return;
      started = true;
      loadBatch(inBatches(loadOrder(wanted(), used.length), BATCH));
    };

    fit();
    // fetch the frames only when the footer gets close
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && load(), { rootMargin: "100% 0px" });
    io.observe(el);
    // the canvas resizing, or the page growing above it (fonts, images), moves the turn's range
    const ro = new ResizeObserver(() => {
      fit();
      schedule();
    });
    ro.observe(el);
    ro.observe(document.body);
    if (!still) addEventListener("scroll", schedule, { passive: true });
    return () => {
      alive = false;
      io.disconnect();
      ro.disconnect();
      removeEventListener("scroll", schedule);
      cancelAnimationFrame(raf);
      raf = 0;
      for (const img of images) if (img) img.onload = img.onerror = null;
    };
  }, [phone, still]);

  return <canvas ref={canvas} className="gufi-canvas" aria-hidden="true" />;
}
