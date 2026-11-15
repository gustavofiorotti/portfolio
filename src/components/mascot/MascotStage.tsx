"use client";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toggleTheme, useTheme } from "@/lib/theme-client";
import type { Pointer } from "./MascotScene";
import { clickSwitch, createPressRequest, type PressRequest } from "./press";
import { createThrow } from "./throw";
import { scrollProgress } from "./walk";
import { SpeechBubble, useSpeech } from "./SpeechBubble";
import type { Anchor, Layout } from "./ViewRig";

const HELLO_KEY = "bobby-hello";
const WAVE_MS = 1600;

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

/** The visitor asked the browser to save data: no 3D (the plain switch does the job). */
function savesData(): boolean {
  return Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
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
  const press = useRef<PressRequest>(createPressRequest());
  const pointer = useRef<Pointer>({ x: 0, y: 0, lastMove: 0, speed: 0 });
  const th = useRef(createThrow());
  const anchor = useRef<Anchor>({ x: 0, y: 0 });
  const layout = useRef<Layout>({ rootX: 0, rootY: 0, bounds: { left: 0, right: 0, floor: 0 }, progress: 0, walk: 0, moving: false, headX: 0, headY: 0 });
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(true);
  const [still, setStill] = useState(false);
  // plain: show the drawn HTML switch (small screens, no WebGL, or the 3D failed). On a desktop
  // that can run the 3D, the button stays an invisible hit area from the start, so the old
  // switch never flashes before Bobby arrives
  const [plain, setPlain] = useState(false);
  // shown: the canvas fades in after its first frame, so there is never a dark empty box
  const [shown, setShown] = useState(false);
  const disable3d = useCallback(() => {
    setReady(false);
    setShown(false);
    setPlain(true);
  }, []);
  const onFirstFrame = useCallback(() => setShown(true), []);
  const { line, say } = useSpeech();
  const greet = useRef(0); // the scene waves until this time (performance.now ms)

  // hello, once per visit, as soon as he shows up after the opening (sessionStorage)
  useEffect(() => {
    if (!shown) return;
    try {
      if (sessionStorage.getItem(HELLO_KEY)) return;
    } catch {
      // private mode: he may greet again on the next visit, that is fine
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      // only with the tab in view: a hello in a background tab would be wasted
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", schedule);
      timer = setTimeout(() => {
        // marked only once it really shows (a cancelled timer must not use up the hello)
        try {
          sessionStorage.setItem(HELLO_KEY, "1");
        } catch {
          // see above
        }
        greet.current = performance.now() + WAVE_MS;
        say("hello");
      }, 450); // a beat after he fades in
    };
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [shown, say]);

  // decide when (and whether) the 3D comes in: big screen, WebGL, after load and the opening
  useEffect(() => {
    const big = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopWaiting = () => {};
    const start = () => {
      const can3d = big.matches && hasWebGL() && !savesData();
      setPlain(!can3d);
      if (!can3d) return;
      stopWaiting = afterIntro(() => {
        const run = () => setReady(true);
        // the scene chunk is already downloading (preloaded below): mount it right after the
        // opening, just one idle moment later so it never janks the landing
        if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(run, { timeout: 300 });
        else timer = setTimeout(run, 200);
      });
    };
    const onSize = () => (big.matches ? start() : (setReady(false), setShown(false), setPlain(true)));
    const onReduce = () => setStill(reduce.matches);
    const onVisibility = () => setRunning(document.visibilityState === "visible");
    onReduce();
    // decide right away whether the drawn switch is needed (both checks are synchronous), so
    // without WebGL it shows immediately instead of after the load event. It cannot be the initial
    // state: the server render has no window, and hydration must match it
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one sync decision after mount
    setPlain(!(big.matches && hasWebGL() && !savesData()));
    // no need to wait for every image: start now and fetch the 3D chunk while the opening plays
    // fetch the 3D chunk in the first idle moment (it parses off the opening's busiest frames),
    // unless the visitor asked to save data; a failed download just leaves the plain switch
    let preload: number | ReturnType<typeof setTimeout> | undefined;
    if (big.matches && hasWebGL() && !savesData()) {
      const fetchScene = () => void import("./MascotScene").catch(() => {});
      preload = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fetchScene, { timeout: 1500 }) : setTimeout(fetchScene, 800);
    }
    start();
    big.addEventListener("change", onSize);
    reduce.addEventListener("change", onReduce);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopWaiting();
      big.removeEventListener("change", onSize);
      reduce.removeEventListener("change", onReduce);
      document.removeEventListener("visibilitychange", onVisibility);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
      if (preload !== undefined) {
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(preload as number);
        clearTimeout(preload as ReturnType<typeof setTimeout>);
      }
    };
  }, []);

  // the eyes follow the pointer, relative to the character (only while the 3D is on)
  useEffect(() => {
    if (!ready) return;
    let rect: DOMRect | undefined;
    // scroll progress drives where Bobby walks along the right edge (walk.ts)
    const onScroll = () => {
      const el = document.documentElement;
      layout.current.progress = scrollProgress(window.scrollY, el.scrollHeight, window.innerHeight);
    };
    // the stage box is Bobby's home: the full-viewport scene is framed on its center
    const onResize = () => {
      rect = stage.current?.getBoundingClientRect();
      if (rect) anchor.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      onScroll();
    };
    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    // the page grows without scrolling (fonts, images, the GitHub chart): keep the progress right
    const grow = new ResizeObserver(onScroll);
    grow.observe(document.documentElement);
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
    // scrolling, typing or touching also counts as someone being there (keeps him awake)
    const onActivity = () => {
      const p = pointer.current;
      p.speed = 0.05;
      p.lastMove = performance.now();
    };
    const activity = ["scroll", "keydown", "touchstart"] as const;
    activity.forEach((type) => window.addEventListener(type, onActivity, { passive: true }));
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      activity.forEach((type) => window.removeEventListener(type, onActivity));
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      grow.disconnect();
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

  // every click on the switch, from the HTML button or from the 3D switch, goes through this one
  // door (press.ts): one physical click = one flip, in any mode. With Bobby on (and motion allowed)
  // he presses it; otherwise (no 3D, reduced motion) the theme flips at once
  const direct = !ready || still;
  const clickSwitchNow = useCallback(() => {
    if (clickSwitch(press.current, performance.now(), direct, toggleTheme) !== "queued") return;
    // safety net: if the scene stops taking requests (stalled GPU), flip for whatever is left
    const asked = performance.now();
    setTimeout(() => {
      if (press.current.pending > 0 && press.current.at < asked) {
        for (; press.current.pending > 0; press.current.pending--) toggleTheme();
      }
    }, 3000); // he may first have to walk to the switch
  }, [direct]);

  const label = dark ? t("turnOn") : t("turnOff");

  return (
    <>
      {ready && (
        <div className={`mascot-canvas ${shown ? "is-shown" : ""}`} aria-hidden="true">
          <SceneBoundary onError={disable3d}>
            <MascotScene
              dark={dark}
              onToggle={toggleTheme}
              onSwitchClick={clickSwitchNow}
              onContextLost={disable3d}
              press={press}
              pointer={pointer}
              still={still}
              running={running}
              th={th}
              anchor={anchor}
              layout={layout}
              onBehind={onBehind}
              onFirstFrame={onFirstFrame}
              onSay={say}
              greet={greet}
            />
          </SceneBoundary>
        </div>
      )}
      {ready && shown && <SpeechBubble line={line} layout={layout} />}
      <div ref={stage} className="mascot-stage">
        {/* on desktop the button is an invisible hit area over the 3D switch: it joins the tab order
            only once the switch is visible (the theme is always reachable from the ⌘K menu) */}
        <button
          type="button"
          onClick={clickSwitchNow}
          // holding Enter/Space repeats the click: only the first press counts
          onKeyDown={(e) => e.repeat && (e.key === "Enter" || e.key === " ") && e.preventDefault()}
          aria-label={label}
          title={label}
          tabIndex={plain || shown ? 0 : -1}
          className={`mascot-switch ${plain ? "is-plain" : ""}`}
        >
          <span className="mascot-rocker" data-on={dark} />
        </button>
      </div>
    </>
  );
}
