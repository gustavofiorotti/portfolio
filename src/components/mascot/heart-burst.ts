// Little hearts that float up beside Bobby's head while he is being petted, kept out of the
// scene so the timing and the layout can be tested.

export const HEART_GAP_S = 0.7; // at most one burst this often, however fast the strokes come
export const HEART_LIFE_MS = 1200; // one heart floats up and fades in this long
export const MAX_BURSTS = 3; // bursts on screen at once

type Heart = { glyph: string; dx: number; delay: number; size: number };
export type Burst = { id: number; hearts: Heart[] };

/** Whether a stroke at time t (s) may send a new burst, given the last one. */
export function heartsDue(lastAt: number, t: number): boolean {
  return t - lastAt >= HEART_GAP_S;
}

const GLYPHS = ["💕", "❤️"];

// Hearts leave from the sides of the head, not its top: the speech bubble sits right above it
// and covered them for seconds. Hearts.tsx anchors them on the head's centre line (layout.headX
// already is that line), a little below the top of the head.
export const BELOW_TOP_PX = 24;

// Distances are measured from the edge of the body, the same on both sides. The body (fur
// included) is BODY_R units across from its centre, and the anchor sits ANCHOR_UP units above
// the centre, so the edge is EDGE_PX from the centre line there. Kept as numbers (a test checks
// them against PPU) so the page bundle does not pull three.js in through ViewRig.
export const BODY_R = 1.1;
export const ANCHOR_UP = 0.82; // 1.3 units (headY) minus BELOW_TOP_PX
export const EDGE_PX = 37;
export const GAP_PX = 10; // from the body's edge to the heart's near edge
const GAP_JITTER_PX = 6; // outwards only, so no heart ever starts closer than GAP_PX

/**
 * 2 or 3 small hearts, from a random source in [0, 1). They alternate left and right (and each
 * burst starts on the other side from the last one), so a petting session sprinkles both sides.
 * dx is the heart's centre from the head's centre line (the CSS centres the glyph on it).
 */
export function makeBurst(id: number, random: () => number = Math.random): Burst {
  const n = random() < 0.5 ? 2 : 3;
  const hearts = Array.from({ length: n }, (_, i) => {
    const side = (id + i) % 2 === 0 ? 1 : -1;
    const glyph = GLYPHS[Math.floor(random() * GLYPHS.length)];
    const size = 11 + Math.round(random() * 4); // px
    const gap = GAP_PX + Math.round(random() * GAP_JITTER_PX);
    return {
      glyph,
      dx: side * (EDGE_PX + gap + size / 2), // px, right (+) or left (-)
      delay: i * 110 + Math.round(random() * 60), // ms
      size,
    };
  });
  return { id, hearts };
}

/** Adds a burst, keeping only the newest MAX_BURSTS. */
export function addBurst(list: Burst[], burst: Burst): Burst[] {
  return [...list, burst].slice(-MAX_BURSTS);
}
