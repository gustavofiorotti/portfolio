/** When the mobile section strip may scroll to the active topic. */

export type StripState = {
  /** a tapped topic is smooth scrolling the page (WebKit cancels it if the strip scrolls) */
  smoothScrolling: boolean;
  /** the visitor's finger is on the strip */
  dragging: boolean;
  /** ms left of the pause after the visitor moved the strip themselves */
  userPauseMs: number;
  /** the page itself is moving (finger or momentum) */
  pageMoving: boolean;
};

export type StripAlign = { wait: number } | { behavior: "auto" | "smooth" };

/**
 * Wait only for what the strip must not interrupt: a tapped topic's smooth scroll and the
 * visitor's own hand on the strip. A finger scrolling the page does not wait: the strip follows
 * at once, without animation, so a fast scroll never leaves the active topic out of view.
 */
export function stripAlign(s: StripState): StripAlign {
  if (s.smoothScrolling) return { wait: 120 };
  if (s.dragging) return { wait: 300 };
  if (s.userPauseMs > 0) return { wait: s.userPauseMs };
  return { behavior: s.pageMoving ? "auto" : "smooth" };
}
