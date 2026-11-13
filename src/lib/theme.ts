export type Theme = "light" | "dark";
export const THEME_KEY = "theme";
export const INTRO_KEY = "intro-seen";

/**
 * Runs inline before the first paint: applies the saved theme (or the system preference),
 * so the page never flashes the wrong colors, and marks whether the opening plays
 * (once per session, never with reduced motion).
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t;if(!sessionStorage.getItem("${INTRO_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.intro="1"}}catch(e){document.documentElement.dataset.theme="light"}})()`;
