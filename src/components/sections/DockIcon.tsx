"use client";

import { useId, type ReactNode } from "react";

/** Filled glyphs of the dock (24×24), drawn as translucent glass. */
export const GLYPHS = {
  linkedin:
    "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.6c.6-1 1.9-1.9 3.9-1.9 3.6 0 4.3 2.3 4.3 5.4v5.9h-4v-5.2c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8v5.3h-4z",
  x: "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z",
  github:
    "M12 .3a12 12 0 0 0-3.8 23.38c.6.12.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3",
  instagram:
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM17.3 5.4a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z",
} as const;

/** Where the specular light sits, in glyph units (24×24 box). */
export type Light = { x: number; y: number; z: number; strength: number };
export const RESTING_LIGHT: Light = { x: 3, y: 1, z: 9, strength: 1 };

/**
 * Glass glyph lit by real SVG lighting (feSpecularLighting): the edge becomes a rounded
 * surface that reflects a point light. Colors come from the --glyph-* tokens, so the light
 * theme mirrors the dark one without JS.
 */
export function GlassGlyph({ light, lit, children }: { light: Light; lit: boolean; children: (filter: string) => ReactNode }) {
  const fid = `glass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="overflow-visible transition-[filter] duration-[350ms]"
      style={{ filter: lit ? "drop-shadow(0 0 10px var(--glyph-glow))" : "none" }}
    >
      <defs>
        <filter id={fid} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" result="soft" />
          <feSpecularLighting in="soft" surfaceScale="2.4" specularConstant={light.strength} specularExponent="22" lightingColor="#fafaf9" result="spec">
            <fePointLight x={light.x} y={light.y} z={light.z} />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="b2" />
          <feOffset in="b2" dy="1" result="off" />
          <feComposite in="SourceAlpha" in2="off" operator="arithmetic" k2="1" k3="-1" result="edge" />
          <feFlood style={{ floodColor: "var(--glyph-inner)", floodOpacity: "var(--glyph-inner-opacity)" }} />
          <feComposite in2="edge" operator="in" result="inner" />
          {/* the highlight takes the theme color: light on dark, dark on light */}
          <feFlood style={{ floodColor: "var(--glyph-light)" }} />
          <feComposite in2="specIn" operator="in" result="specC" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="inner" />
            <feMergeNode in="specC" />
          </feMerge>
        </filter>
      </defs>
      {children(`url(#${fid})`)}
    </svg>
  );
}

/** A filled glyph: glass body plus a thin rim. */
export function FilledGlyph({ d, filter }: { d: string; filter: string }) {
  return (
    <>
      <path d={d} fillRule="evenodd" filter={filter} style={{ fill: "var(--glyph-fill)" }} />
      <path d={d} fillRule="evenodd" fill="none" strokeWidth={0.3} style={{ stroke: "var(--glyph-rim)" }} />
    </>
  );
}

/**
 * A stroked glyph (the e-mail icon, which morphs into a check) drawn as glass like the filled
 * ones: the strokes become a mask, so crossings and joins never stack their alpha (no darker
 * dots), the light filter sees one solid shape, and the rim follows its outline.
 */
export function StrokedGlyph({ d, filter }: { d: string; filter: string }) {
  const id = `stroke-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const line = { d, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <>
      {/* mask luminance only (white shows, black hides): never painted on screen */}
      <defs>
        <mask id={`${id}-body`} maskUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28">
          <path {...line} stroke="#fff" strokeWidth={2.6} />
        </mask>
        <mask id={`${id}-rim`} maskUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28">
          <path {...line} stroke="#fff" strokeWidth={2.9} />
          <path {...line} stroke="#000" strokeWidth={2.3} />
        </mask>
      </defs>
      <g filter={filter}>
        <rect x="-2" y="-2" width="28" height="28" mask={`url(#${id}-body)`} style={{ fill: "var(--glyph-fill)" }} />
      </g>
      <rect x="-2" y="-2" width="28" height="28" mask={`url(#${id}-rim)`} style={{ fill: "var(--glyph-rim)" }} />
    </>
  );
}
