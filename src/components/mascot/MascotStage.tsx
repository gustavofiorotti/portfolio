"use client";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toggleTheme, useTheme } from "@/lib/theme-client";
import type { Pointer, PressRequest } from "./MascotScene";
import { createThrow } from "./throw";
import type { Anchor, Layout } from "./ViewRig";

// three.js loads only after the page is up, in its own chunk
const MascotScene = dynamic(() => import("./MascotScene"), { ssr: false });

/** If the 3D scene throws (no WebGL, lost context), fall back to the plain switch. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Waits until the opening is over (html[data-intro] gone), so the 3D never janks it. */
function afterIntro(run: () => void): () => void {
  const html = document.documentElement;
  if (!html.dataset.intro) {
    run();
    return () => {};
  }
  const mo = new MutationObserver(() => {
    if (!html.dataset.intro) {
      mo.disconnect();
      run();
    }
  });
  mo.observe(html, { attributes: true, attributeFilter: ["data-intro"] });
  return () => mo.disconnect();
}

/**
 * The plush character next to the wall switch. On large screens with WebGL it is 3D:
 * pressing the switch makes it reach out and flip the theme. Otherwise a plain switch
 * does the job. The real control is always an HTML button.
 */
export function MascotStage() {
  const t = useTranslations("theme");
  const dark = useTheme() === "dark";
  const stage = useRef<HTMLDivElement>(null);
  const press = useRef<PressRequest>({ pending: false, at: 0 });
  const pointer = useRef<Pointer>({ x: 0, y: 0, lastMove: 0, speed: 0 });
  const th = useRef(createThrow());
  const anchor = useRef<Anchor>({ x: 0, y: 0 });
  const layout = useRef<Layout>({ rootX: 0, rootY: 0, bounds: { left: 0, right: 0, floor: 0 } });
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(true);
  const [still, setStill] = useState(false);
  const disable3d = useCallback(() => setReady(false), []);

  // decide when (and whether) the 3D comes in: big screen, WebGL, after load and the opening
  useEffect(() => {
    const big = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopWaiting = () => {};
    const start = () => {
      if (!big.matches || !hasWebGL()) return;
      stopWaiting = afterIntro(() => {
        const run = () => setReady(true);
        if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(run, { timeout: 2500 });
        else timer = setTimeout(run, 1200);
      });
    };
    const onSize = () => (big.matches ? start() : setReady(false));
    const onReduce = () => setStill(reduce.matches);
    const onVisibility = () => setRunning(document.visibilityState === "visible");
    onReduce();
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    big.addEventListener("change", onSize);
    reduce.addEventListener("change", onReduce);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopWaiting();
      window.removeEventListener("load", start);
      big.removeEventListener("change", onSize);
      reduce.removeEventListener("change", onReduce);
      document.removeEventListener("visibilitychange", onVisibility);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);

  // the eyes follow the pointer, relative to the character (only while the 3D is on)
  useEffect(() => {
    if (!ready) return;
    let rect: DOMRect | undefined;
    // the stage box is Bobby's home: the full-viewport scene is framed on its center
    const onResize = () => {
      rect = stage.current?.getBoundingClientRect();
      if (rect) anchor.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    onResize();
    const onMove = (e: PointerEvent) => {
      if (!rect) return;
      const x = Math.max(-1, Math.min(1, ((e.clientX - (rect.left + rect.width * 0.35)) / window.innerWidth) * 2.4));
      const y = Math.max(-1, Math.min(1, (-(e.clientY - (rect.top + rect.height / 2)) / window.innerHeight) * 2.4));
      const p = pointer.current;
      p.speed = Math.hypot(x - p.x, y - p.y);
      p.x = x;
      p.y = y;
      p.lastMove = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      const html = document.documentElement;
      delete html.dataset.bobby;
      delete html.dataset.bobbyHover;
      delete html.dataset.bobbyDrag;
      th.current = createThrow(); // the scene went away mid-throw: next time he starts at home
    };
  }, [ready]);

  // while he runs home he goes behind the page, and the cards turn to frosted glass
  const onBehind = useCallback((behind: boolean) => {
    if (behind) document.documentElement.dataset.bobby = "behind";
    else delete document.documentElement.dataset.bobby;
  }, []);

  const requestPress = useCallback(() => {
    press.current.pending = true;
    // safety net: if the scene never takes the request (stalled GPU), flip anyway
    const asked = performance.now();
    setTimeout(() => {
      if (press.current.pending && press.current.at < asked) {
        press.current.pending = false;
        toggleTheme();
      }
    }, 1500);
  }, []);

  const flip = () => (ready && !still ? requestPress() : toggleTheme());
  const label = dark ? t("turnOn") : t("turnOff");

  return (
    <>
      {ready && (
        <div className="mascot-canvas" aria-hidden="true">
          <SceneBoundary onError={disable3d}>
            <MascotScene
              dark={dark}
              onToggle={toggleTheme}
              onSwitchClick={requestPress}
              onContextLost={disable3d}
              press={press}
              pointer={pointer}
              still={still}
              running={running}
              th={th}
              anchor={anchor}
              layout={layout}
              onBehind={onBehind}
            />
          </SceneBoundary>
        </div>
      )}
      <div ref={stage} className="mascot-stage">
        <button type="button" onClick={flip} aria-label={label} title={label} className={`mascot-switch ${ready ? "is-3d" : ""}`}>
          <span className="mascot-rocker" data-on={dark} />
        </button>
      </div>
    </>
  );
}
