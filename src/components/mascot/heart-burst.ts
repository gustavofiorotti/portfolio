// Little hearts that float up from Bobby's head while he is being petted, kept out of the
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

/** 2 or 3 small hearts with a little spread, from a random source in [0, 1). */
export function makeBurst(id: number, random: () => number = Math.random): Burst {
  const n = random() < 0.5 ? 2 : 3;
  const hearts = Array.from({ length: n }, (_, i) => ({
    glyph: GLYPHS[Math.floor(random() * GLYPHS.length)],
    dx: Math.round((i - (n - 1) / 2) * 14 + (random() * 8 - 4)), // px around the head
    delay: i * 110 + Math.round(random() * 60), // ms
    size: 11 + Math.round(random() * 4), // px
  }));
  return { id, hearts };
}

/** Adds a burst, keeping only the newest MAX_BURSTS. */
export function addBurst(list: Burst[], burst: Burst): Burst[] {
  return [...list, burst].slice(-MAX_BURSTS);
}
