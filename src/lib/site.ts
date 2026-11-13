/** Canonical production URL (no trailing slash). */
export const SITE_URL = "https://gufi.vercel.app";

/** Absolute URL for a site path, e.g. siteUrl("/en") -> "https://gufi.vercel.app/en". */
export function siteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}
