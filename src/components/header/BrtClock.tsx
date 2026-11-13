"use client";
import { useEffect, useState } from "react";
import { brtTime, handAngles } from "@/lib/clock";

/** "BRT 14:07": the digits that change flip in, and the icon's hands show the real time. */
export function BrtClock({ label }: { label: string }) {
  // flips[i] counts how many times digit i changed; a new count remounts it and replays the flip
  const [{ time, flips }, setClock] = useState<{ time: string | null; flips: number[] }>({ time: null, flips: [0, 0, 0, 0, 0] });

  useEffect(() => {
    const tick = () =>
      setClock((prev) => {
        const now = brtTime();
        if (now === prev.time) return prev;
        const next = prev.time ? [...now].map((ch, i) => prev.flips[i] + (ch !== prev.time![i] ? 1 : 0)) : prev.flips;
        return { time: now, flips: next };
      });
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const shown = time ?? "--:--";
  const { hour, minute } = handAngles(time ?? "00:00");
  return (
    <span title={label} className="flex h-9 items-center gap-1.5 px-1.5 font-mono text-[13px] font-medium whitespace-nowrap text-muted">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <line className="clock-hand" x1="12" y1="12" x2="12" y2="7.6" style={{ transform: `rotate(${hour}deg)` }} />
        <line className="clock-hand" x1="12" y1="12" x2="12" y2="5.4" strokeWidth="1.6" style={{ transform: `rotate(${minute}deg)` }} />
      </svg>
      <span>BRT</span>
      <span className="inline-flex [perspective:160px]" aria-label={time ?? undefined}>
        {[...shown].map((ch, i) => (
          <span key={`${i}-${flips[i]}`} className={flips[i] ? "clock-flip inline-block origin-top" : "inline-block"} aria-hidden="true">
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}
