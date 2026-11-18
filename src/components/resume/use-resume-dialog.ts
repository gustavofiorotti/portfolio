"use client";
import { useCallback, useEffect, useState } from "react";

const STATE_KEY = "resumeDialog";

/**
 * Open state of the résumé preview, tied to the browser history: opening pushes an entry, so the
 * phone's back button (or the browser's) closes the preview instead of leaving the site. Closing
 * from the dialog (X, Esc) goes back through that entry, so it never piles up.
 */
export function useResumeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPop = () => setOpen(Boolean((history.state as Record<string, unknown> | null)?.[STATE_KEY]));
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  const show = useCallback(() => {
    history.pushState({ ...(history.state as object | null), [STATE_KEY]: true }, "");
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    if ((history.state as Record<string, unknown> | null)?.[STATE_KEY]) history.back();
    else setOpen(false);
  }, []);

  return { open, show, close };
}
