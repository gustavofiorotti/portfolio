"use client";
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { useTranslations } from "next-intl";
import type { Say } from "./MascotScene";
import type { Layout } from "./ViewRig";

const SHOW_MS = 2400;
const CALM_GAP_MS = 6000; // between chatty lines (idle, pet, switch)
const REACT_GAP_MS = 900; // reactions to a poke or a throw can come quicker
const REACTIONS: Say[] = ["poke", "angry", "egg", "thrown", "landed"];

/**
 * Small, quiet speech bubble above Bobby. It follows his head (the scene writes the screen
 * point into layout every frame) and fades out by itself. Decorative: screen readers skip it.
 */
export function useSpeech() {
  const t = useTranslations("bobby");
  const [line, setLine] = useState<{ text: string; id: number } | null>(null);
  const last = useRef(-Infinity);
  const turn = useRef<Record<string, number>>({});

  const say = useCallback(
    (what: Say) => {
      const now = performance.now();
      // escalating anger always replaces what he was saying; the rest waits its turn
      const urgent = what === "angry" || what === "egg";
      if (!urgent && now - last.current < (REACTIONS.includes(what) ? REACT_GAP_MS : CALM_GAP_MS)) return;
      last.current = now;
      const options = t.raw(what) as string[];
      // angry lines escalate in order (starting over once he has calmed down); the rest rotate
      if (what === "angry" && now - (turn.current.angryAt ?? 0) > 8000) turn.current.angry = 0;
      if (what === "angry") turn.current.angryAt = now;
      const i = turn.current[what] ?? 0;
      turn.current[what] = i + 1;
      const text = what === "angry" ? options[Math.min(i, options.length - 1)] : options[i % options.length];
      setLine({ text, id: now });
    },
    [t],
  );

  useEffect(() => {
    if (!line) return;
    const timer = setTimeout(() => setLine(null), SHOW_MS);
    return () => clearTimeout(timer);
  }, [line]);

  return { line, say };
}

export function SpeechBubble({ line, layout }: { line: { text: string; id: number } | null; layout: MutableRefObject<Layout> }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!line) return;
    let raf = 0;
    const follow = () => {
      const { headX, headY } = layout.current;
      if (el.current) el.current.style.transform = `translate(${headX}px, ${headY}px) translate(-50%, -100%)`;
      raf = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(raf);
  }, [line, layout]);
  if (!line) return null;
  return (
    <div ref={el} className="bobby-bubble" aria-hidden="true" key={line.id}>
      {line.text}
    </div>
  );
}
