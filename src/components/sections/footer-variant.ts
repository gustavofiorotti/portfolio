/**
 * Footer variant to compare (Gustavo, 18/11): a bigger Gufi whose fur reaches up behind the dock's
 * glass. Off by default; flip FOOTER_GUFI_BIG, or add ?gufi=grande (or ?gufi=normal) to the URL.
 * The inline script runs before paint and sets <html data-gufi-big>, read by footer.css.
 */
export const FOOTER_GUFI_BIG = false;

export function footerVariantScript(big: boolean): string {
  return `(function(){var q=new URLSearchParams(location.search).get("gufi");if(q?q==="grande":${big})document.documentElement.setAttribute("data-gufi-big","")})()`;
}
