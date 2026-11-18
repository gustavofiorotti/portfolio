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
// and covered them for seconds. Px from the point Hearts.tsx anchors to (the head's centre line,
// a little below its top).
export const SIDE_PX = 42; // sideways from the centre line, to clear the head

// layout.headX/headY is the speech bubble's anchor: BOBBY_HOME.x (-0.45 units) left of the
// head's centre line, at the top of the head. Hearts move it onto the centre line and a little
// lower. Kept as a number (a test pins it to -BOBBY_HOME.x * PPU) so the page bundle does not
// pull three.js in through ViewRig.
export const TO_CENTRE_PX = 22;
export const BELOW_TOP_PX = 24;
const SIDE_JITTER_PX = 8;

/**
 * 2 or 3 small hearts, from a random source in [0, 1). They alternate left and right (and each
 * burst starts on the other side from the last one), so a petting session sprinkles both sides.
 */
export function makeBurst(id: number, random: () => number = Math.random): Burst {
  const n = random() < 0.5 ? 2 : 3;
  const hearts = Array.from({ length: n }, (_, i) => {
    const side = (id + i) % 2 === 0 ? 1 : -1;
    return {
      glyph: GLYPHS[Math.floor(random() * GLYPHS.length)],
      dx: side * Math.round(SIDE_PX + random() * SIDE_JITTER_PX), // px, right (+) or left (-)
      delay: i * 110 + Math.round(random() * 60), // ms
      size: 11 + Math.round(random() * 4), // px
    };
  });
  return { id, hearts };
}

/** Adds a burst, keeping only the newest MAX_BURSTS. */
export function addBurst(list: Burst[], burst: Burst): Burst[] {
  return [...list, burst].slice(-MAX_BURSTS);
}
