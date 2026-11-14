"use client";
import { useSyncExternalStore } from "react";
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

function endSwitch(id: number) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (id === switchId) document.documentElement.classList.remove("theme-switching");
    }),
  );
}

/** Applies and remembers the theme, and tells listeners once the page has it. */
export function setTheme(theme: Theme) {
  intended = theme;
  const id = ++switchId;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (typeof document.startViewTransition === "function" && !reduce) {
    const vt = document.startViewTransition(() => applyTheme(theme));
    // a switch started during another one skips the older transition: that rejection is expected
    vt.ready.catch(() => {});
    vt.finished.catch(() => {}).finally(() => endSwitch(id));
  } else {
    applyTheme(theme);
    endSwitch(id);
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
