import type { CSSProperties } from "react";

/**
 * The plush logo (render of the 3D model) with its SVG eyes glancing and blinking on top.
 * `cycle` and `phase` (s) let a second copy run on its own clock, so two logos on screen never
 * look and blink in lockstep like a copy.
 */
export function BrandLogo({ size = 30, className = "", cycle, phase }: { size?: number; className?: string; cycle?: number; phase?: number }) {
  // one clock for both animations (globals.css reads --logo-cycle and --logo-phase)
  const clock = {
    ...(cycle ? { "--logo-cycle": `${cycle}s` } : {}),
    ...(phase ? { "--logo-phase": `-${phase}s` } : {}),
  } as CSSProperties;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={`overflow-visible ${className}`} style={clock}>
      <image href="/brand/logo-3d.webp" x="-2.2" y="-2.2" width="36.4" height="36.4" />
      <g className="logo-glance">
        <g className="logo-blink">
          <ellipse cx="12.6" cy="15" rx="2.5" ry="3.6" fill="var(--logo-eye)" />
          <ellipse cx="19.4" cy="15" rx="2.5" ry="3.6" fill="var(--logo-eye)" />
        </g>
      </g>
    </svg>
  );
}
