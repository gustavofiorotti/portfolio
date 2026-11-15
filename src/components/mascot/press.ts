// Requests to press the light switch, kept out of the scene so the rule can be tested.
//
// One physical click reaches two handlers: the invisible HTML button over the switch and the 3D
// switch itself (its raycast listens on the whole page). Both ask for a press, so asks closer
// than DEDUPE_MS are the same click. A second deliberate click still queues (to undo a mistake),
// but never more than MAX_PENDING, and a held key (keydown repeat) asks only once.

export const DEDUPE_MS = 300;
export const MAX_PENDING = 2;

export type PressRequest = { pending: number; at: number; lastAsk: number };

export function createPressRequest(): PressRequest {
  return { pending: 0, at: 0, lastAsk: -Infinity };
}

/** Asks for a press at `now` (ms). Returns whether it was queued. */
export function askPress(r: PressRequest, now: number, repeat = false): boolean {
  if (repeat) return false; // holding Enter or Space on the button
  if (now - r.lastAsk < DEDUPE_MS) return false; // the same click, seen by the button and the 3D switch
  r.lastAsk = now;
  if (r.pending >= MAX_PENDING) return false;
  r.pending += 1;
  return true;
}
