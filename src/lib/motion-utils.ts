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

/**
 * Scrolls to a section (or the top) and focuses it. Uses the browser's own smooth scrolling:
 * it runs on the compositor, so it stays fluid while the main thread is busy (the 3D scene
 * draws every frame while Bobby walks). The old requestAnimationFrame loop stuttered there.
 */
let scrollCall = 0; // only the latest smoothScrollTo may move focus

export function smoothScrollTo(id: string | null, offset = 0) {
  const call = ++scrollCall;
  const target = id ? document.getElementById(id) : null;
  const to = Math.max(0, target ? target.getBoundingClientRect().top + window.scrollY - offset : 0);
  if (prefersReducedMotion()) {
    window.scrollTo(0, to);
    focusSection(target);
    return;
  }
  window.scrollTo({ top: to, behavior: "smooth" });
  // focus once it arrives: scrollend where supported, a timer otherwise. WebKit on touch devices
  // can fire an early scrollend, and focusing mid-way (even with preventScroll) cancels its smooth
  // scroll, so a scrollend only counts when the page is really there.
  // the destination is measured again at each check: late images or fonts can move the target,
  // and near the bottom the page stops short of it (at the end of the scroll range)
  const destination = () => {
    const top = Math.max(0, target ? target.getBoundingClientRect().top + window.scrollY - offset : 0);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(top, max) : top;
  };
  const arrived = () => Math.abs(window.scrollY - destination()) <= 2;
  let done = false;
  const finish = (force: boolean) => {
    if (done || (!force && !arrived())) return;
    done = true;
    window.removeEventListener("scrollend", onEnd);
    if (call === scrollCall) focusSection(target); // a newer jump took over: leave focus to it
  };
  const onEnd = () => finish(false);
  window.addEventListener("scrollend", onEnd);
  setTimeout(() => finish(true), scrollDuration(to - window.scrollY) + 400);
}
