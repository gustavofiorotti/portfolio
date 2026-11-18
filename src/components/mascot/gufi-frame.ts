// Framing and behaviour of the footer's 3D Gufi, kept out of the component so it can be tested.

/** The ball with its fur, in scene units (Strands radius 0.92 plus ~0.2 of fur). */
export const BALL_R = 1.12;
/** The stage is this much wider than the ball, so the fur on the sides is never cut. */
export const STAGE_OVER_BALL = 1.1;

/**
 * Camera for a stage w × h px that shows the upper half of the ball: as wide as the stage allows
 * (STAGE_OVER_BALL), its equator on the stage's bottom edge. Returns the vertical field of view
 * (degrees) and the height the camera looks at, for a camera `dist` units away.
 */
export function frameUpperHalf(w: number, h: number, dist: number): { fov: number; y: number } {
  const unitsPerPx = (2 * BALL_R) / (w / STAGE_OVER_BALL);
  const visible = h * unitsPerPx;
  return { fov: (2 * Math.atan(visible / 2 / dist) * 180) / Math.PI, y: visible / 2 };
}

/** Turn around the vertical axis for a scroll progress 0..1: his back, then his face at the end. */
export function turnAt(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return -Math.PI * (1 - p);
}

/**
 * Strands for this GPU: the frames he replaces had 420k, far too many live. A desktop GPU (Apple
 * silicon, discrete cards) gets 120k, an integrated or unknown one 50k; the component halves it
 * again if frames come slow.
 */
export function strandsFor(renderer: string): number {
  const r = renderer.toLowerCase();
  if (/apple m\d|apple gpu|nvidia|geforce|radeon(?! (vega|graphics))|rtx|arc a/.test(r)) return 120000;
  return 50000;
}

/** Eye openness for a blink that started at `at` (s), 0.16 s long; 1 when not blinking. */
export function blinkOpen(t: number, at: number): number {
  const u = (t - at) / 0.16;
  if (u < 0 || u > 1) return 1;
  return 1 - 0.93 * Math.sin(u * Math.PI);
}
