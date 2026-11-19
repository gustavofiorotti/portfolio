import type Lenis from "lenis";

/**
 * Wheel and trackpad smoothing with inertia (Lenis, lerp 0.1, as studied on ndstudio.gov). Touch
 * stays native, so phones never load it; less motion turns it off. Scrollable boxes (⌘K list,
 * dialogs, the topic strip) keep their own scrolling, and while a modal is open the wheel is left
 * to the browser, which keeps the page behind it still.
 */
const WHEEL_LERP = 0.1;

let lenis: Lenis | null = null;

const OWN_SCROLL = "dialog, [role=dialog], [cmdk-root], [data-own-keys], [data-lenis-prevent]";

function modalOpen(): boolean {
  return !!document.querySelector("dialog[open], [role=dialog][data-state=open]");
}

/** Whether this device should get the smoothing: a mouse or trackpad, and motion allowed. */
export function wantsSmoothWheel(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(any-pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export async function startSmoothWheel(): Promise<void> {
  if (lenis || !wantsSmoothWheel()) return;
  const { default: LenisClass } = await import("lenis");
  if (lenis || !wantsSmoothWheel()) return;
  lenis = new LenisClass({
    lerp: WHEEL_LERP,
    smoothWheel: true,
    syncTouch: false,
    autoRaf: true,
    allowNestedScroll: true,
    anchors: false, // ScrollJumps glides anchors
    prevent: (node) => node.matches(OWN_SCROLL),
    virtualScroll: () => !modalOpen(),
  });
}

export function stopSmoothWheel(): void {
  lenis?.destroy();
  lenis = null;
}

/** Halts a wheel glide in progress where the page is, so a topic jump starts from rest. */
export function stopWheelGlide(): void {
  if (lenis?.isScrolling === "smooth") lenis.scrollTo(window.scrollY, { immediate: true, force: true });
}
