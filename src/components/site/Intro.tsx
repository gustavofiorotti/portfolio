"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { INTRO_KEY } from "@/lib/theme";

const DURATION = 2900; // ms: logo stares 1 s, floats to the header, the page focuses as it lands

/**
 * Opening: the plush logo stares at the visitor in the middle of the screen, blinks twice,
 * looks at the header and floats there while the page comes into focus behind it.
 * The inline script decides before paint whether it plays (once per session, never with
 * reduced motion) and sets html[data-intro=wait], which only hides the page. After hydration
 * this measures the header logo (nothing is transformed yet) and switches to "play"; if
 * hydration never comes, the script drops the flag after 4 s so the page still shows.
 */
export function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useLayoutEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro !== "wait") return;
    const target = document.querySelector(".brand-logo")?.getBoundingClientRect();
    const el = ref.current;
    if (el && target) {
      const dx = target.left + target.width / 2 - window.innerWidth / 2;
      const dy = target.top + target.height / 2 - window.innerHeight / 2;
      const len = Math.max(1, Math.hypot(dx, dy));
      el.style.setProperty("--lx", `${dx}px`);
      el.style.setProperty("--ly", `${dy}px`);
      el.style.setProperty("--ls", String(target.width / 120));
      el.style.setProperty("--ex", `${(dx / len) * 2.6}px`);
      el.style.setProperty("--ey", `${(dy / len) * 2}px`);
    }
    html.dataset.intro = "play";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start once, after measuring
    setPlaying(true);
    // ?introHold keeps the opening on screen, for reviewing it frame by frame
    if (new URLSearchParams(location.search).has("introHold")) return;
    const done = setTimeout(() => {
      delete html.dataset.intro;
      setPlaying(false);
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {}
    }, DURATION);
    return () => clearTimeout(done);
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className={`intro-fly ${playing ? "is-playing" : ""}`}>
      <div className="intro-hop">
        <svg width="120" height="120" viewBox="0 0 32 32" className="block overflow-visible">
          <image href="/brand/logo-3d.webp" x="-2.2" y="-2.2" width="36.4" height="36.4" />
          <g className="intro-look">
            <g className="intro-eyes">
              <ellipse cx="12.6" cy="15" rx="2.5" ry="3.6" fill="var(--logo-eye)" />
              <ellipse cx="19.4" cy="15" rx="2.5" ry="3.6" fill="var(--logo-eye)" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
