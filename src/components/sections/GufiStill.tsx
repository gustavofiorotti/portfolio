/**
 * The footer's Gufi without 3D (phones, no WebGL, Save-Data): a still render of the live one, his
 * upper half looking up at the dock, blinking with a small patch of closed eyes (footer.css).
 */
/* eslint-disable @next/next/no-img-element -- static export: next/image has no optimizer here */
export function GufiStill() {
  return (
    <div className="gufi-still" aria-hidden="true">
      <img src="/gufi/still.webp" alt="" width={1443} height={722} loading="lazy" decoding="async" />
      <img src="/gufi/blink.webp" alt="" className="gufi-blink" loading="lazy" decoding="async" />
    </div>
  );
}
