"use client";
import { useSyncExternalStore } from "react";
import { isWebKitEngine } from "./browser";
import { THEME_KEY, type Theme } from "./theme";

export const THEME_EVENT = "themechange";

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/**
 * Every element used to fade on its own clock (body 0.5 s, buttons 0.3 s, borders instantly),
 * so a theme switch looked broken. Now element transitions are switched off for the change and
 * the whole page crossfades as one picture (View Transitions); without that API it just snaps.
 */
let intended: Theme | null = null; // the theme last asked for, even before the page shows it
let switchId = 0; // only the latest switch may turn element transitions back on

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.add("theme-switching");
  html.dataset.theme = theme;
  void html.offsetHeight; // commit the new colors while transitions are off
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

/**
 * Turns element transitions back on two frames after the switch. After a dry switch (WebKit)
 * the glass also repaints for one frame: WebKit can keep the old backdrop under it, and the
 * header looked see-through. A one-frame change of the blur radius makes it rebuild the
 * backdrop, and the glass stays glass (no denser fill).
 */
function endSwitch(id: number, dry: boolean) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (id !== switchId) return;
      const html = document.documentElement;
      html.classList.remove("theme-switching", "theme-snapshot");
      if (!dry) return;
      html.classList.add("theme-repaint");
      requestAnimationFrame(() => html.classList.remove("theme-repaint"));
    }),
  );
}

/** Applies and remembers the theme, and tells listeners once the page has it. */
export function setTheme(theme: Theme) {
  intended = theme;
  const id = ++switchId;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // Chromium and Firefox crossfade the whole page; WebKit gets the dry switch (transitions off),
  // because its View Transition snapshots drop backdrop-filter and the header lost its glass.
  // Re-evaluate when Safari keeps backdrop-filter in snapshots: in a real Safari (not headless),
  // flip the theme with the header over content; if the glass keeps its blur through the
  // crossfade, WebKit can crossfade too (drop the isWebKitEngine check)
  if (typeof document.startViewTransition === "function" && !reduce && !isWebKitEngine(navigator.userAgent)) {
    // before the old snapshot is taken: snapshots drop backdrop-filter, so the glass goes dense
    // for the crossfade instead of turning see-through (theme-snapshot: only on this path; the
    // dry switch keeps the glass as it is, or the header jumped to the dense fill for a moment)
    document.documentElement.classList.add("theme-switching", "theme-snapshot");
    const vt = document.startViewTransition(() => applyTheme(theme));
    // a switch started during another one skips the older transition: that rejection is expected
    vt.ready.catch(() => {});
    vt.finished.catch(() => {}).finally(() => endSwitch(id, false));
  } else {
    applyTheme(theme);
    endSwitch(id, true);
  }
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // private mode: the theme still applies for this visit
  }
}

/** Flips from the theme last asked for, so two quick toggles do not collapse into one. */
export function toggleTheme() {
  setTheme((intended ?? currentTheme()) === "dark" ? "light" : "dark");
}

/** Current theme as React state; follows every change to html[data-theme], from anywhere. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, currentTheme, () => "light");
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
