/**
 * Access to the phone's orientation. Android hands it out freely; iOS (13+) only after
 * DeviceOrientationEvent.requestPermission() is called inside a user gesture. The request is
 * shared by every card: the first tap asks once and all of them start following the phone.
 */

export type GyroAccess = "free" | "ask" | "granted" | "denied" | "none";

type DOEWithPermission = { requestPermission?: () => Promise<"granted" | "denied" | "default"> };

let access: GyroAccess | null = null;
let pending: Promise<boolean> | null = null;
const waiting = new Set<() => void>();

function detect(): GyroAccess {
  if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") return "none";
  const DOE = DeviceOrientationEvent as unknown as DOEWithPermission;
  return typeof DOE.requestPermission === "function" ? "ask" : "free";
}

/** Current state, detected on first use. */
export function gyroAccess(): GyroAccess {
  if (access === null) access = detect();
  return access;
}

/** Whether `deviceorientation` events can be listened to right now. */
export function canListenToGyro(): boolean {
  const a = gyroAccess();
  return a === "free" || a === "granted";
}

/**
 * Ask for the permission (iOS). Must be called synchronously from a tap/click handler: the
 * browser only shows the prompt inside a user gesture. Asks at most once; later calls share the
 * answer. Resolves whether the gyroscope can be used.
 */
export function requestGyro(): Promise<boolean> {
  const a = gyroAccess();
  if (a !== "ask") return Promise.resolve(canListenToGyro());
  if (pending) return pending;
  const DOE = DeviceOrientationEvent as unknown as DOEWithPermission;
  pending = DOE.requestPermission!()
    .then((r) => r === "granted")
    .catch(() => false)
    .then((ok) => {
      access = ok ? "granted" : "denied";
      if (ok) for (const fn of waiting) fn();
      waiting.clear();
      return ok;
    });
  return pending;
}

/** Runs `fn` when the permission is granted (by a tap on any card). Returns an unsubscribe. */
export function onGyroGranted(fn: () => void): () => void {
  waiting.add(fn);
  return () => waiting.delete(fn);
}

/** Tests only: forget the detected state. */
export function resetGyroAccess(): void {
  access = null;
  pending = null;
  waiting.clear();
}
