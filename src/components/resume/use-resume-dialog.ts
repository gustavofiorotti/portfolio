"use client";
import { useCallback, useEffect, useState } from "react";

const STATE_KEY = "resumeDialog";
/** Event that opens the résumé preview from anywhere (the ⌘K menu, for one). */
export const OPEN_RESUME_EVENT = "resume:open";

/** Opens the résumé preview owned by the hero's button, from any other control. */
export function openResume() {
  dispatchEvent(new Event(OPEN_RESUME_EVENT));
}

const hasEntry = () => Boolean((history.state as Record<string, unknown> | null)?.[STATE_KEY]);

/**
 * Open state of the résumé preview, tied to the browser history: opening pushes an entry, so the
 * phone's back button (or the browser's) closes the preview instead of leaving the site, and
 * forward opens it again. Closing from the dialog (X, Esc) goes back through that entry, so it
 * never piles up.
 */
export function useResumeDialog() {
  const [open, setOpen] = useState(false);

  const show = useCallback(() => {
    if (hasEntry()) return setOpen(true);
    history.pushState({ ...(history.state as object | null), [STATE_KEY]: true }, "");
    setOpen(true);
  }, []);

  useEffect(() => {
    // a reload keeps the entry of an open preview: drop the mark, the page starts closed
    if (hasEntry()) {
      const rest = { ...(history.state as Record<string, unknown>) };
      delete rest[STATE_KEY];
      history.replaceState(rest, "");
    }
    const onPop = () => setOpen(hasEntry());
    addEventListener("popstate", onPop);
    addEventListener(OPEN_RESUME_EVENT, show);
    return () => {
      removeEventListener("popstate", onPop);
      removeEventListener(OPEN_RESUME_EVENT, show);
    };
  }, [show]);

  const close = useCallback(() => {
    if (hasEntry()) history.back();
    else setOpen(false);
  }, []);

  return { open, show, close };
}
