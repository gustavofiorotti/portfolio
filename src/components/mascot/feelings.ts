// Bobby's temper and petting, kept out of the scene so they can be tested.
//
// Anger: every poke adds to a meter that cools down after a short pause. The level picks the
// face and body language: 1 hurt, 2 annoyed, 3 angry, 4 furious.
// Petting: moving the pointer back and forth over him, side to side or up and down. A stroke
// counts when the pointer turns around on either axis after travelling at least STROKE_PX in one
// direction (each pointer event alone moves only a few pixels, so comparing consecutive events
// never worked).

type Sweep = { dir: number; travel: number; last: number | null };
/** grudgeT: until then strokes are refused (he was hit while being petted) */
export type Feel = { anger: number; angerT: number; grudgeT: number; x: Sweep; y: Sweep };

export const STROKE_PX = 14;
const COOL_AFTER = 1.6; // s without pokes before the anger starts to cool
const COOL_RATE = 0.7; // anger points per second
const MAX_ANGER = 6;
const BETRAYED_ANGER = 3.6; // hit while being petted: straight to "angry" (level 3)
export const GRUDGE_S = 1.5; // and for this long more strokes do not cheer him up

const sweep = (): Sweep => ({ dir: 0, travel: 0, last: null });

export function createFeel(): Feel {
  return { anger: 0, angerT: -100, grudgeT: -100, x: sweep(), y: sweep() };
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

/**
 * A poke: returns the new level. A poke in the middle of petting is a betrayal: he goes angry at
 * once (the happy face used to stay) and refuses strokes for GRUDGE_S.
 */
export function poke(f: Feel, t: number, petting = false, now = t): AngerLevel {
  const anger = angerAt(f, t) + 1;
  f.anger = Math.min(MAX_ANGER, petting ? Math.max(anger, BETRAYED_ANGER) : anger);
  f.angerT = t;
  if (petting) f.grudgeT = now + GRUDGE_S; // wall clock (now): the scene clock slows when he is still
  return levelOf(f.anger);
}

/** Whether a stroke at wall time now (s) can cheer him up (not right after he was hit mid-petting). */
export function pettable(f: Feel, now: number): boolean {
  return now >= f.grudgeT;
}

/** One axis of the pointer: true when it turned around after a long enough sweep. */
function turned(w: Sweep, v: number): boolean {
  if (w.last === null) {
    w.last = v;
    return false;
  }
  const dv = v - w.last;
  w.last = v;
  if (dv === 0) return false;
  const d = Math.sign(dv);
  if (d === w.dir || w.dir === 0) {
    w.dir = d;
    w.travel += Math.abs(dv);
    return false;
  }
  const counted = w.travel >= STROKE_PX;
  w.dir = d;
  w.travel = Math.abs(dv);
  return counted;
}

/** Pointer moved over him (client px). Returns true when a full stroke was made, on either axis. */
export function stroke(f: Feel, x: number, y?: number): boolean {
  const horizontal = turned(f.x, x);
  const vertical = y === undefined ? false : turned(f.y, y);
  return horizontal || vertical;
}

/** The pointer left him: the next stroke starts fresh. */
export function endStroke(f: Feel) {
  f.x = sweep();
  f.y = sweep();
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
export const EGG_PAUSE_S = 1.5; // only clicks in a row count: a longer pause starts over
/** The bar shown empty, when a pause reset the count. */
export const EGG_EMPTY = { filled: 0, total: EGG_GOAL / EGG_STEP, done: false };

/**
 * The count after a click at time now (s), given the count so far and the last click's time.
 * After a pause longer than EGG_PAUSE_S the count starts over (dropped: a bar that had shown
 * comes back empty, so the visitor sees it reset). Once hatched it stays hatched.
 */
export function nextEggCount(n: number, lastAt: number, now: number): { n: number; dropped: boolean } {
  if (n >= EGG_GOAL) return { n: n + 1, dropped: false };
  // no click yet this page load (lastAt -Infinity): a count saved before a reload resets quietly,
  // the visitor never saw that bar on this page
  if (now - lastAt > EGG_PAUSE_S) return { n: 1, dropped: n >= EGG_STEP && Number.isFinite(lastAt) };
  return { n: n + 1, dropped: false };
}

/** For the n-th click of the visit: the progress bubble to show (steps filled of total), if any. */
export function eggProgress(n: number): { filled: number; total: number; done: boolean } | null {
  const total = EGG_GOAL / EGG_STEP;
  if (n >= EGG_GOAL) return n === EGG_GOAL ? { filled: total, total, done: true } : null; // the hatch shows once
  if (n % EGG_STEP !== 0) return null;
  return { filled: n / EGG_STEP, total, done: false };
}
