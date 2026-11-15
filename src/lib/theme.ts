import { CHROMIUM_UA } from "./browser";

export type Theme = "light" | "dark";
export const THEME_KEY = "theme";
export const INTRO_KEY = "intro-seen";

/**
 * Runs inline before the first paint: applies the saved theme (or the system preference),
 * so the page never flashes the wrong colors, marks whether the opening plays (once per
 * session, never with reduced motion) and, outside Chromium, asks for the denser glass
 * (html[data-glass="dense"], see CHROMIUM_UA in browser.ts).
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}try{var d=document.documentElement;if(!sessionStorage.getItem("${INTRO_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.intro="wait";setTimeout(function(){if(d.dataset.intro==="wait")delete d.dataset.intro},4000)}}catch(e){}try{if(!/${CHROMIUM_UA.source}/.test(navigator.userAgent))document.documentElement.dataset.glass="dense"}catch(e){}})()`;
