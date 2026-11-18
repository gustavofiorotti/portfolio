"use client";
import { useEffect } from "react";
import { jumpToEdge, keyIsForPage, smoothScrollTo } from "@/lib/motion-utils";

/**
 * Long in-page jumps glide only their last stretch (motion-utils): Home/End, and links to an
 * anchor on this page that do not handle the click themselves. Renders nothing.
 */
export function ScrollJumps() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== "Home" && e.key !== "End") || !keyIsForPage(e)) return;
      e.preventDefault();
      jumpToEdge(e.key === "Home" ? "top" : "bottom");
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href^='#']");
      const id = a?.getAttribute("href")?.slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      history.pushState(null, "", `#${id}`);
      smoothScrollTo(id, 72);
    };
    addEventListener("keydown", onKey);
    addEventListener("click", onClick);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
