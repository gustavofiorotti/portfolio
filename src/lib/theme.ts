export type Theme = "light" | "dark";
export const THEME_KEY = "theme";

/**
 * Runs inline in <head>, before the first paint: applies the saved theme, or the
 * system preference, so the page never flashes the wrong colors.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})()`;
