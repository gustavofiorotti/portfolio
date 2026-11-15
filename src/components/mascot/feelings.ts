// Bobby's temper and petting, kept out of the scene so they can be tested.
//
// Anger: every poke adds to a meter that cools down after a short pause. The level picks the
// face and body language: 1 hurt, 2 annoyed, 3 angry, 4 furious.
// Petting: moving the pointer from side to side over him. A stroke counts when the pointer
// turns around after travelling at least STROKE_PX in one direction (each pointer event alone
// moves only a few pixels, so comparing consecutive events never worked).

export type Feel = { anger: number; angerT: number; dir: number; travel: number; lastX: number | null };

export const STROKE_PX = 14;
const COOL_AFTER = 1.6; // s without pokes before the anger starts to cool
const COOL_RATE = 0.7; // anger points per second
const MAX_ANGER = 6;

export function createFeel(): Feel {
  return { anger: 0, angerT: -100, dir: 0, travel: 0, lastX: null };
}

/** Current anger at time t (s), after cooling down. */
export function angerAt(f: Feel, t: number): number {
  return Math.max(0, f.anger - Math.max(0, t - f.angerT - COOL_AFTER) * COOL_RATE);
}

export type AngerLevel = 0 | 1 | 2 | 3 | 4;

export function levelOf(anger: number): AngerLevel {
  if (anger < 0.5) return 0;
  if (anger < 2.2) return 1;
  if (anger < 3.6) return 2;
  if (anger < 5) return 3;
  return 4;
}

/** A poke: returns the new level. */
export function poke(f: Feel, t: number): AngerLevel {
  f.anger = Math.min(MAX_ANGER, angerAt(f, t) + 1);
  f.angerT = t;
  return levelOf(f.anger);
}

/** Pointer moved over him (clientX in px). Returns true when a full stroke was made. */
export function stroke(f: Feel, x: number): boolean {
  if (f.lastX === null) {
    f.lastX = x;
    return false;
  }
  const dx = x - f.lastX;
  f.lastX = x;
  if (dx === 0) return false;
  const d = Math.sign(dx);
  if (d === f.dir || f.dir === 0) {
    f.dir = d;
    f.travel += Math.abs(dx);
    return false;
  }
  const counted = f.travel >= STROKE_PX;
  f.dir = d;
  f.travel = Math.abs(dx);
  return counted;
}

/** The pointer left him: the next stroke starts fresh. */
export function endStroke(f: Feel) {
  f.lastX = null;
  f.dir = 0;
  f.travel = 0;
}

/** Petting soothes him: each stroke takes some anger away, and the cooling goes on at once. */
export function calm(f: Feel, t: number, amount = 1.2) {
  f.anger = Math.max(0, angerAt(f, t) - amount);
  f.angerT = t - COOL_AFTER;
}

// The secret: EGG_GOAL clicks (counted for the browser session) unlock it (the game comes later). Every EGG_STEP clicks
// a bubble shows how far along the visitor is, so it reads as something being unlocked.
export const EGG_GOAL = 20;
const EGG_STEP = 4;

/** For the n-th click of the visit: the progress bubble to show (steps filled of total), if any. */
export function eggProgress(n: number): { filled: number; total: number; done: boolean } | null {
  const total = EGG_GOAL / EGG_STEP;
  if (n >= EGG_GOAL) return n === EGG_GOAL ? { filled: total, total, done: true } : null; // the hatch shows once
  if (n % EGG_STEP !== 0) return null;
  return { filled: n / EGG_STEP, total, done: false };
}
