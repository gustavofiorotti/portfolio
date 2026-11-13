"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { prefersReducedMotion } from "@/lib/motion-utils";
import { toggleTheme, useTheme } from "@/lib/theme-client";
import type { Pointer, PressRequest } from "./MascotScene";

// three.js loads only after the page is up, in its own chunk
const MascotScene = dynamic(() => import("./MascotScene"), { ssr: false });

/**
 * The plush character next to the wall switch. On large screens it is 3D: pressing the
 * switch makes it reach out and flip the theme. On small screens, or until the 3D loads,
 * a plain switch does the job. The real control is always an HTML button.
 */
export function MascotStage() {
  const t = useTranslations("theme");
  const dark = useTheme() === "dark";
  const stage = useRef<HTMLDivElement>(null);
  const press = useRef<PressRequest>({ pending: false });
  const pointer = useRef<Pointer>({ x: 0, y: 0, lastMove: 0, speed: 0 });
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(true);
  // only read on the client after load, so it never affects the server HTML
  const [still] = useState(() => typeof window !== "undefined" && prefersReducedMotion());

  useEffect(() => {
    const big = window.matchMedia("(min-width: 1024px)");
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      if (!big.matches) return;
      const run = () => setReady(true);
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(run, { timeout: 2500 });
      else timer = setTimeout(run, 1200);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    const onMove = (e: PointerEvent) => {
      const r = stage.current?.getBoundingClientRect();
      if (!r) return;
      const x = Math.max(-1, Math.min(1, ((e.clientX - (r.left + r.width * 0.35)) / window.innerWidth) * 2.4));
      const y = Math.max(-1, Math.min(1, (-(e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 2.4));
      const p = pointer.current;
      p.speed = Math.hypot(x - p.x, y - p.y);
      p.x = x;
      p.y = y;
      p.lastMove = performance.now();
    };
    const onVisibility = () => setRunning(document.visibilityState === "visible");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("load", start);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);

  const flip = () => {
    // with the 3D on screen the character presses the switch (theme flips at the press);
    // otherwise, or with reduced motion, the theme flips right away
    if (ready && !still) press.current.pending = true;
    else toggleTheme();
  };
  const label = dark ? t("turnOn") : t("turnOff");

  return (
    <div ref={stage} className="mascot-stage">
      {ready && (
        <div className="absolute inset-0" aria-hidden="true">
          <MascotScene dark={dark} onToggle={toggleTheme} press={press} pointer={pointer} still={still} running={running} />
        </div>
      )}
      <button type="button" onClick={flip} aria-pressed={dark} aria-label={label} title={label} className={`mascot-switch ${ready ? "is-3d" : ""}`}>
        <span className="mascot-rocker" data-on={dark} />
      </button>
    </div>
  );
}
