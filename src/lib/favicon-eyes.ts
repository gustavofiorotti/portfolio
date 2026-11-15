// The favicon's eyes follow the same 7 s loop as the header logo (logo-glance / logo-blink in
// globals.css): look left, right, down-right, back, and one blink. Units are the logo's 32×32 box.

export const FAVICON_LOOP_MS = 7000;

type Key = [at: number, dx: number, dy: number];
const GLANCE: Key[] = [
  [0, 0, 0], [0.14, 0, 0], [0.18, -2.4, 0], [0.34, -2.4, 0], [0.38, 2.4, 0], [0.52, 2.4, 0],
  [0.56, 1, 1.2], [0.7, 1, 1.2], [0.74, 0, 0], [1, 0, 0],
];

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/** Where the eyes are and how open they are at time t (ms). */
export function eyesAt(t: number): { dx: number; dy: number; open: number } {
  const p = (((t % FAVICON_LOOP_MS) + FAVICON_LOOP_MS) % FAVICON_LOOP_MS) / FAVICON_LOOP_MS;
  let i = 0;
  while (i < GLANCE.length - 2 && p > GLANCE[i + 1][0]) i++;
  const [a0, ax, ay] = GLANCE[i];
  const [b0, bx, by] = GLANCE[i + 1];
  const f = b0 === a0 ? 0 : (p - a0) / (b0 - a0);
  const open = p > 0.84 && p < 0.9 ? 1 - (1 - Math.abs(p - 0.87) / 0.03) * 0.92 : 1;
  return { dx: lerp(ax, bx, f), dy: lerp(ay, by, f), open };
}

/** A short key for a frame, so the favicon is only re-encoded when the picture changes. */
export function frameKey(e: { dx: number; dy: number; open: number }): string {
  return `${e.dx.toFixed(1)},${e.dy.toFixed(1)},${e.open.toFixed(2)}`;
}
