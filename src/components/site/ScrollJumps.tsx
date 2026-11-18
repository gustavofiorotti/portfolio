"use client";
import { useEffect } from "react";
import { jumpToEdge, keyIsForPage, smoothScrollTo } from "@/lib/motion-utils";
import { startSmoothWheel, stopSmoothWheel, wantsSmoothWheel } from "@/lib/smooth-wheel";

/**
 * Long in-page jumps glide like the header topics (motion-utils): Home/End, and links to an
 * anchor on this page that do not handle the click themselves. Also turns the wheel and
 * trackpad smoothing on and off with the visitor's motion setting. Renders nothing.
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
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncWheel = () => (wantsSmoothWheel() ? void startSmoothWheel() : stopSmoothWheel());
    syncWheel();
    motion.addEventListener("change", syncWheel);
    addEventListener("keydown", onKey);
    addEventListener("click", onClick);
    return () => {
      motion.removeEventListener("change", syncWheel);
      stopSmoothWheel();
      removeEventListener("keydown", onKey);
      removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
