/**
 * WebKit engines: Safari on the Mac and every browser on iOS (Chrome and Firefox there are WebKit
 * too: CriOS, FxiOS), plus embedded WKWebViews (no "Safari/" token). One rule for every WebKit
 * workaround in the site: the dry theme switch (theme-client) and the static favicon
 * (AnimatedFavicon).
 */
export function isWebKitEngine(ua: string): boolean {
  return /AppleWebKit/.test(ua) && !CHROMIUM_UA.test(ua);
}

/**
 * Chromium browsers (Chrome, Edge, Opera, Samsung Internet, on every platform but iOS). Outside
 * them (WebKit, Firefox) the backdrop blur reads weaker and text behind the header showed through
 * like a ghost: the inline theme script (theme.ts) marks html[data-glass="dense"] there.
 */
export const CHROMIUM_UA = /(Chrome|Chromium|Edg|OPR|SamsungBrowser)\//;
