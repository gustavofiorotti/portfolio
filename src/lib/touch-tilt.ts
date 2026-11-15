/** Pure math for the card tilt on touch screens (no mouse to follow). */

export const FEATURE_ZONE = 0.32; // |offset| below this: the card is "in focus" (centered on screen)
export const TILT_ZONE = 0.75; // |offset| below this: the card tilts with the scroll

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Card center relative to the viewport center: -1 at the top edge, 0 centered, 1 at the bottom. */
export function viewportOffset(top: number, height: number, viewport: number): number {
  if (viewport <= 0) return 0;
  return (top + height / 2 - viewport / 2) / (viewport / 2);
}

export type Tilt = { rotateX: number; rotateY: number; scale: number; featured: boolean };

/**
 * Tilt for a card at `offset`, plus the phone's tilt when the browser gives it (`gyro`, in
 * degrees away from how the visitor holds it). Far from the center the card rests flat.
 */
export function touchTilt(offset: number, gyro: { x: number; y: number } | null = null): Tilt {
  const a = Math.abs(offset);
  if (a >= TILT_ZONE) return { rotateX: 0, rotateY: 0, scale: 1, featured: false };
  const fade = 1 - a / TILT_ZONE; // strongest at the center
  const featured = a < FEATURE_ZONE;
  const gx = gyro && featured ? clamp(gyro.x * 0.3, -5, 5) : 0;
  const gy = gyro && featured ? clamp(gyro.y * 0.5, -9, 9) : 0;
  return {
    rotateX: clamp(-offset * 7 * fade + gx, -8, 8),
    rotateY: gy,
    scale: featured ? 1.02 : 1,
    featured,
  };
}

/** Baseline that slowly follows how the phone is held, so only quick turns tilt the card. */
export function follow(base: number | null, value: number, k = 0.03): number {
  return base === null ? value : base + (value - base) * k;
}
