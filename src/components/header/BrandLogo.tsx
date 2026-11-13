/** The plush logo (render of the 3D model) with its SVG eyes glancing and blinking on top. */
export function BrandLogo({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={`overflow-visible ${className}`}>
      <image href="/brand/logo-3d.png" x="-2.2" y="-2.2" width="36.4" height="36.4" />
      <g className="logo-glance">
        <g className="logo-blink">
          <ellipse cx="12.6" cy="15" rx="2.5" ry="3.6" fill="#FAFAF9" />
          <ellipse cx="19.4" cy="15" rx="2.5" ry="3.6" fill="#FAFAF9" />
        </g>
      </g>
    </svg>
  );
}
