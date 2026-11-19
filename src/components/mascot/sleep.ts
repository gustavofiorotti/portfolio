// Bobby falling asleep when nobody moves the pointer, kept out of the scene so it can be tested.
//
// Timeline in seconds after he gets sleepy: a yawn, two rounds of nodding off (eyes droop, head
// dips) each ending in a jolt awake, then he drops off for good: eyes shut, slow breathing,
// a drop of drool and "Zzz" bubbles.

export const SLEEPY_AFTER = 25; // s without pointer movement before the yawn

const YAWN_END = 1.8;
const NODS: [number, number][] = [
  [YAWN_END, 5.4], // droop from .. jolt at
  [5.9, 9.6],
];
const JOLT = 0.45; // s the jolt lasts
const DROP_START = 10.1;
const ASLEEP_AT = 12.2;

export type SleepStage = "yawn" | "nod" | "jolt" | "drop" | "asleep";

export type SleepPose = {
  stage: SleepStage;
  /** eye openness cap, 0 shut .. 1 open */
  open: number;
  /** forward head dip in radians */
  nod: number;
  /** 0..1 yawn stretch */
  yawn: number;
  /** 0..1 drool drop size */
  drool: number;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeIn = (x: number) => clamp01(x) ** 2;

/** Pose for a given time since he got sleepy (s). Negative means awake. */
export function sleepPose(s: number): SleepPose | null {
  if (s < 0) return null;
  if (s < YAWN_END) {
    const u = s / YAWN_END;
    const yawn = Math.sin(Math.PI * u);
    // eyes squeeze shut at the height of the yawn
    return { stage: "yawn", open: 1 - 0.92 * yawn, nod: -0.08 * yawn, yawn, drool: 0 };
  }
  for (let i = 0; i < NODS.length; i++) {
    const [from, at] = NODS[i];
    if (s >= from && s < at) {
      const u = easeIn((s - from) / (at - from));
      return { stage: "nod", open: 0.6 - 0.52 * u, nod: 0.36 * u, yawn: 0, drool: 0 };
    }
    if (s >= at && s < at + JOLT) {
      const u = (s - at) / JOLT;
      // wide open for a moment, a little less each round
      return { stage: "jolt", open: (i === 0 ? 1.1 : 0.85) - 0.4 * u, nod: -0.06 * (1 - u), yawn: 0, drool: 0 };
    }
  }
  if (s < DROP_START) return { stage: "nod", open: 0.6, nod: 0, yawn: 0, drool: 0 };
  if (s < ASLEEP_AT) {
    const u = easeIn((s - DROP_START) / (ASLEEP_AT - DROP_START));
    return { stage: "drop", open: 0.55 * (1 - u), nod: 0.3 * u, yawn: 0, drool: 0 };
  }
  const breath = Math.sin((s - ASLEEP_AT) * 1.4);
  return { stage: "asleep", open: 0, nod: 0.3 + 0.03 * breath, yawn: 0, drool: clamp01((s - ASLEEP_AT) / 2) * (0.85 + 0.15 * breath) };
}

/** Which bubble, if any, a change of stage should show. */
export function sleepLine(prev: SleepStage | null, next: SleepStage | null): "yawn" | "doze" | "jolt" | "asleep" | null {
  if (next === prev || !next) return null;
  if (next === "yawn") return "yawn";
  if (next === "nod" && prev === "yawn") return "doze";
  if (next === "jolt") return "jolt";
  if (next === "asleep") return "asleep";
  return null;
}

export const ZZZ_MAX = 3; // "Zzz" bubbles per nap
const ZZZ_EVERY = 5; // s between them

export type Zzz = { count: number; nextAt: number };

/**
 * Whether to show a "Zzz" now (t in s). At most ZZZ_MAX per nap, the first one included. The
 * count only restarts when he is really woken (`awake`: the pointer moved); the stage also blinks
 * to null while the walk nudges him, and coming back from it used to say "Zzz" again.
 */
export function zzzNow(z: Zzz, stage: SleepStage | null, said: ReturnType<typeof sleepLine>, awake: boolean, t: number): boolean {
  if (awake) z.count = 0;
  if (stage !== "asleep" || (said !== "asleep" && t <= z.nextAt)) return false;
  z.nextAt = t + ZZZ_EVERY;
  if (z.count >= ZZZ_MAX) return false;
  z.count += 1;
  return true;
}
