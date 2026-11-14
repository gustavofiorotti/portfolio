// Drag-and-throw physics for Bobby, in world units, as an offset from his home spot.
// Pure and frame-rate independent, so the scene just calls step() every frame.

export type ThrowMode = "home" | "pending" | "held" | "flying" | "dizzy" | "running";

export type Throw = {
  mode: ThrowMode;
  x: number; // offset from home
  y: number;
  vx: number;
  vy: number;
  tx: number; // where the pointer wants him while held
  ty: number;
  downX: number; // pointer offset at pointerdown, to tell a drag from a click
  downY: number;
  grabX: number; // pointer minus Bobby at grab, so he does not jump to the cursor
  grabY: number;
  modeT: number; // time the current mode started
  impact: number; // speed of the last hit (floor or wall); the scene reads and clears it
};

/** Limits around home, in the same offset coords. Bobby's center may not go past them. */
export type Bounds = { left: number; right: number; floor: number };

export const GRAVITY = 34;
export const RUN_SPEED = 11;
export const MAX_THROW = 38;
export const DRAG_START = 0.12; // ~6 px before a press becomes a drag
export const DIZZY_FOR = 0.9;

export function createThrow(): Throw {
  return { mode: "home", x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, downX: 0, downY: 0, grabX: 0, grabY: 0, modeT: 0, impact: 0 };
}

function setMode(s: Throw, mode: ThrowMode, t: number) {
  s.mode = mode;
  s.modeT = t;
}

/** Pointer pressed on him. It only becomes a drag once the pointer moves a little. */
export function press(s: Throw, px: number, py: number, t: number) {
  if (s.mode === "held") return;
  s.downX = px;
  s.downY = py;
  s.grabX = px - s.x;
  s.grabY = py - s.y;
  s.tx = s.x;
  s.ty = s.y;
  s.vx = 0;
  s.vy = 0;
  setMode(s, "pending", t);
}

/** Pointer moved while pressed. Returns true once it is a drag (so the click is not a poke). */
export function move(s: Throw, px: number, py: number, t: number): boolean {
  if (s.mode === "pending" && Math.hypot(px - s.downX, py - s.downY) > DRAG_START) setMode(s, "held", t);
  if (s.mode !== "held") return false;
  s.tx = px - s.grabX;
  s.ty = py - s.grabY;
  return true;
}

/** Pointer released: a drag turns into a throw with the hand's speed; a plain press does nothing. */
export function release(s: Throw, t: number) {
  if (s.mode === "pending") {
    setMode(s, s.x === 0 && s.y === 0 ? "home" : "flying", t);
    return;
  }
  if (s.mode !== "held") return;
  const speed = Math.hypot(s.vx, s.vy);
  if (speed > MAX_THROW) {
    s.vx *= MAX_THROW / speed;
    s.vy *= MAX_THROW / speed;
  }
  setMode(s, "flying", t);
}

export function step(s: Throw, dt: number, t: number, b: Bounds) {
  if (dt <= 0) return;
  dt = Math.min(dt, 1 / 20); // a stalled tab must not teleport him through the floor
  switch (s.mode) {
    case "held": {
      // follows the hand with a short lag; the speed it picks up becomes the throw
      const k = 1 - Math.exp(-28 * dt);
      const nx = s.x + (s.tx - s.x) * k;
      const ny = s.y + (s.ty - s.y) * k;
      const blend = 1 - Math.exp(-18 * dt);
      s.vx += ((nx - s.x) / dt - s.vx) * blend;
      s.vy += ((ny - s.y) / dt - s.vy) * blend;
      s.x = nx;
      s.y = ny;
      break;
    }
    case "flying": {
      s.vy -= GRAVITY * dt;
      s.vx *= Math.exp(-0.25 * dt);
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < b.left || s.x > b.right) {
        s.x = s.x < b.left ? b.left : b.right;
        s.impact = Math.max(s.impact, Math.abs(s.vx));
        s.vx = -s.vx * 0.45;
      }
      if (s.y < b.floor) {
        s.y = b.floor;
        if (Math.abs(s.vy) > 4) {
          s.impact = Math.max(s.impact, Math.abs(s.vy));
          s.vy = -s.vy * 0.38;
          s.vx *= 0.7;
        } else {
          s.vx = 0;
          s.vy = 0;
          setMode(s, "dizzy", t);
        }
      }
      break;
    }
    case "dizzy":
      if (t - s.modeT > DIZZY_FOR) setMode(s, "running", t);
      break;
    case "running": {
      const d = Math.hypot(s.x, s.y);
      const v = Math.min(RUN_SPEED, d * 7 + 0.5) * dt;
      if (d <= v || d < 0.01) {
        s.x = 0;
        s.y = 0;
        s.vx = 0;
        s.vy = 0;
        setMode(s, "home", t);
      } else {
        s.vx = (-s.x / d) * (v / dt);
        s.vy = (-s.y / d) * (v / dt);
        s.x -= (s.x / d) * v;
        s.y -= (s.y / d) * v;
      }
      break;
    }
  }
}
