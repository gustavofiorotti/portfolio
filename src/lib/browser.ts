/**
 * WebKit engines: Safari on the Mac and every browser on iOS (Chrome and Firefox there are WebKit
 * too: CriOS, FxiOS), plus embedded WKWebViews (no "Safari/" token). One rule for every WebKit
 * workaround in the site: the dry theme switch (theme-client) and the static favicon
 * (AnimatedFavicon).
 */
export function isWebKitEngine(ua: string): boolean {
  return /AppleWebKit/.test(ua) && !/(Chrome|Chromium|Edg|OPR|SamsungBrowser)\//.test(ua);
}
