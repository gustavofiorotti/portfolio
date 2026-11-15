// Requests to press the light switch, kept out of the scene so the rule can be tested.
//
// One physical click reaches two handlers: the invisible HTML button over the switch and the 3D
// switch itself (its raycast listens on the whole page). Both ask for a press, so asks closer
// than DEDUPE_MS are the same click (the price: a real double click that fast also counts once).
// A second deliberate click still queues (to undo a mistake), but never more than MAX_PENDING.
// A held key never gets here twice: the button drops repeated keydowns (MascotStage).

export const DEDUPE_MS = 300;
export const MAX_PENDING = 2;

/** Presses asked for and not started yet (quick clicks queue up, none is lost), when the last one
 * started (at) and when the last ask came (lastAsk, for the dedupe). */
export type PressRequest = { pending: number; at: number; lastAsk: number };

export function createPressRequest(): PressRequest {
  return { pending: 0, at: 0, lastAsk: -Infinity };
}

/** Asks for a press at `now` (ms). Returns whether it was queued. */
export function askPress(r: PressRequest, now: number): boolean {
  if (now - r.lastAsk < DEDUPE_MS) return false; // the same click, seen by the button and the 3D switch
  r.lastAsk = now;
  if (r.pending >= MAX_PENDING) return false;
  r.pending += 1;
  return true;
}
