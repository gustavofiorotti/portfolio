import { stopWheelGlide } from "./smooth-wheel";

/** easeOutQuart: fast start, gentle stop. */
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/** easeOutBack: overshoots a little, then settles (used by morphing icons). */
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Scroll duration grows with distance, clamped to 0.42–0.85 s (kit: neither slow nor instant). */
export const scrollDuration = (distance: number) => Math.min(850, 420 + Math.abs(distance) * 0.12);

/**
 * Interpolates two SVG paths with the same command structure, number by number.
 * Safari cannot transition the `d` property in CSS, so morphing icons go through this.
 */
export function lerpPath(a: string, b: string, k: number): string {
  const re = /-?\d*\.?\d+/g;
  const nb = b.match(re) ?? [];
  let i = 0;
  return a.replace(re, (n) => {
    const target = Number(nb[i++] ?? n);
    return String(Math.round((Number(n) + (target - Number(n)) * k) * 100) / 100);
  });
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Moves keyboard and screen-reader focus to the section the page scrolled to. */
function focusSection(el: HTMLElement | null) {
  if (!el) return;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

/** easeInOutCubic: eases in and out softly, the curve of the topic jumps. */
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Topic jumps take 1.0 s plus 0.1 s per screen of distance, up to 1.4 s (asked on 18/11). */
export const jumpDuration = (distance: number, viewport: number) =>
  Math.min(1400, 1000 + (100 * Math.abs(distance)) / Math.max(1, viewport));

/** Where a jump from `from` to `to` is after `elapsed` ms of a `duration` ms glide. */
export function glideAt(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0 || elapsed >= duration) return to;
  return from + (to - from) * easeInOutCubic(Math.max(0, elapsed) / duration);
}

let scrollCall = 0; // only the latest jump may move focus
let smoothScrolling = 0; // jumps still on their way
let cancelGlide: (() => void) | null = null;

/**
 * Whether the page is in a jump started by smoothScrollTo or jumpToEdge (a tapped topic). In
 * WebKit, touching another element's scroll position during a smooth scroll cancels it, so
 * callers wait while this is true.
 */
export function isSmoothScrolling(): boolean {
  return smoothScrolling > 0;
}

/**
 * Glides the page to `destination()` over the whole distance, whatever its length, in
 * jumpDuration (1.0–1.4 s) with easeInOutCubic. Each frame places the page where the time says
 * it should be, so a frame the 3D delays is skipped, never slowed down.
 *
 * It replaced the browser's smooth scroll after an instant pre-jump: that jump (up to 4 screens
 * in one frame) was a visible cut, and WebKit's native glide ran the last 1.5 screens in about
 * 0.23 s, up to 600 px per frame. The destination is measured again every frame (late images or
 * fonts can move it). The wheel, a touch, a key or a press on the scrollbar hands the page back
 * to the visitor at once.
 */
function glideTo(destination: () => number, onArrive: () => void) {
  cancelGlide?.();
  stopWheelGlide(); // the wheel's own easing would pull the page against this one
  const from = window.scrollY;
  // already there (the topic of the section on screen): arrive now, not after a 1 s glide
  if (Math.abs(destination() - from) < 2) return onArrive();
  const duration = jumpDuration(destination() - from, window.innerHeight);
  const start = performance.now();
  let raf = 0;
  let done = false;
  smoothScrolling++;
  const stop = (arrived: boolean) => {
    if (done) return;
    done = true;
    smoothScrolling--;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    for (const type of INTERRUPTS) window.removeEventListener(type, interrupt);
    if (cancelGlide === cancel) cancelGlide = null;
    if (arrived) onArrive();
  };
  const cancel = () => stop(false);
  // the event that started the jump (⌘K's Enter is still on its way to window) never stops it;
  // of the keys, only those that scroll the page do
  const interrupt = (e: Event) => {
    if (e.timeStamp <= start) return;
    if (e instanceof KeyboardEvent && !SCROLL_KEYS.has(e.key)) return;
    stop(false);
  };
  const place = (now: number) => {
    const to = destination();
    window.scrollTo({ top: Math.round(glideAt(from, to, now - start, duration)), behavior: "instant" });
    if (now - start >= duration) return stop(true);
    raf = requestAnimationFrame(place);
  };
  // without frames (a hidden tab) the page still gets there
  const timer = setTimeout(() => {
    window.scrollTo({ top: destination(), behavior: "instant" });
    stop(true);
  }, duration + 400);
  for (const type of INTERRUPTS) window.addEventListener(type, interrupt, { passive: true });
  cancelGlide = cancel;
  raf = requestAnimationFrame(place);
}

const INTERRUPTS = ["wheel", "touchstart", "keydown", "mousedown"] as const;
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

/** The furthest the page can scroll. */
const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

/**
 * Home and End: the page's top or bottom, gliding like a topic jump. The global
 * `scroll-behavior: smooth` turned them into a native glide of the whole page (1.1 s, with a
 * 100–250 ms frame while the 3D drew); Space and Page Up/Down move a screen and stay native.
 */
export function jumpToEdge(edge: "top" | "bottom") {
  const destination = () => (edge === "top" ? 0 : maxScroll());
  ++scrollCall;
  if (prefersReducedMotion()) return window.scrollTo({ top: destination(), behavior: "instant" });
  glideTo(destination, () => {});
}

/** Whether a key press belongs to a field or a widget (its own Home/End), not to the page. */
export function keyIsForPage(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false;
  const el = e.target as HTMLElement | null;
  if (!el || el === document.body || el === document.documentElement) return true;
  if (el.isContentEditable || el.closest("input, textarea, select, [role=listbox], [role=menu], [role=tablist], [role=slider], [cmdk-root], dialog")) return false;
  // a scrollable box with the focus scrolls itself
  return !el.closest("[data-own-keys]");
}

/**
 * Whether a jump to `el` should end at the bottom of the page: the closing section
 * (data-scroll-end) is shown whole with the footer under it, not aligned to the top with the
 * footer cut off (Gustavo, 19/11).
 */
export const scrollsToEnd = (el: Element | null) => !!el?.hasAttribute("data-scroll-end");

/** A page opened at a closing section's anchor (/#contato) lands at the bottom, like a jump to it. */
export function settleHashAtEnd() {
  let id = location.hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // a malformed escape (/#%E0%A4%A): look it up as written
  }
  if (!id || !scrollsToEnd(document.getElementById(id))) return;
  // once the visitor scrolls on their own, a late settle never pulls the page back
  let touched = false;
  const touch = () => (touched = true);
  for (const type of INTERRUPTS) addEventListener(type, touch, { once: true, passive: true });
  const settle = () => {
    if (!touched && !isSmoothScrolling()) window.scrollTo({ top: maxScroll(), behavior: "instant" });
  };
  settle();
  // late fonts and images grow the page after the browser's own jump
  if (document.readyState !== "complete") addEventListener("load", settle, { once: true });
  void document.fonts?.ready.then(settle);
}

export function smoothScrollTo(id: string | null, offset = 0) {
  const call = ++scrollCall;
  const target = id ? document.getElementById(id) : null;
  const toEnd = scrollsToEnd(target);
  // near the bottom the page stops short of the target, at the end of the scroll range
  const destination = () => {
    if (toEnd) return maxScroll();
    const top = Math.max(0, target ? target.getBoundingClientRect().top + window.scrollY - offset : 0);
    const max = maxScroll();
    return max > 0 ? Math.min(top, max) : top;
  };
  if (prefersReducedMotion()) {
    window.scrollTo({ top: destination(), behavior: "instant" });
    focusSection(target);
    return;
  }
  // focus once it arrives; a newer jump takes over and leaves focus to it
  glideTo(destination, () => {
    if (call === scrollCall) focusSection(target);
  });
}
