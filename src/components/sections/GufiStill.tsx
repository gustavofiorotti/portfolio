/**
 * The footer's Gufi without 3D (phones, no WebGL, Save-Data): a still render of the live one,
 * looking up at the dock, blinking with a small patch of closed eyes (footer.css). Wider screens
 * get his upper half; phones get his whole body, so the page ends on him with the credits and the
 * wall switch over his belly.
 */
const PHONE = "(max-width: 720px)";

export function GufiStill() {
  return (
    <div className="gufi-still" aria-hidden="true">
      <picture>
        <source media={PHONE} srcSet="/gufi/still-full.webp" width={1000} height={1000} />
        <img src="/gufi/still.webp" alt="" width={1443} height={722} loading="lazy" decoding="async" />
      </picture>
      <picture>
        <source media={PHONE} srcSet="/gufi/blink-full.webp" width={488} height={224} />
        <img src="/gufi/blink.webp" alt="" className="gufi-blink" loading="lazy" decoding="async" />
      </picture>
    </div>
  );
}
