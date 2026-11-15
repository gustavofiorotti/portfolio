"use client";
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { useTranslations } from "next-intl";
import type { Say, SayExtra } from "./MascotScene";
import type { Layout } from "./ViewRig";

const SHOW_MS = 2400;
const CALM_GAP_MS = 6000; // between chatty lines (idle, switch)
const REACT_GAP_MS = 900; // reactions (a poke, a stroke, a throw, his naps) can come quicker
// petting is a reaction too: "hehe" right after a poke must still show
const REACTIONS: Say[] = ["poke", "angry", "pet", "thrown", "landed", "yawn", "doze", "jolt", "asleep", "wake"];
const URGENT: Say[] = ["angry", "egg", "eggStep", "wake"]; // always replace what he was saying
const SPIN = "✻ "; // lines starting with it get Claude Code's spinner in front

/**
 * Small, quiet speech bubble above Bobby. It follows his head (the scene writes the screen
 * point into layout every frame) and fades out by itself. Decorative: screen readers skip it.
 */
type Line = { text: string; id: number; egg?: SayExtra };

export function useSpeech() {
  const t = useTranslations("bobby");
  const [line, setLine] = useState<Line | null>(null);
  const last = useRef(-Infinity);
  const turn = useRef<Record<string, number>>({});

  const say = useCallback(
    (what: Say, extra?: SayExtra) => {
      const now = performance.now();
      if (!URGENT.includes(what) && now - last.current < (REACTIONS.includes(what) ? REACT_GAP_MS : CALM_GAP_MS)) return;
      last.current = now;
      if (what === "eggStep" && extra) {
        // the secret filling up: 🥚 ▰▰▱▱▱, then the hatch
        setLine(extra.done ? { text: (t.raw("eggDone") as string[])[0], id: now } : { text: "🥚", id: now, egg: extra });
        return;
      }
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
    const timer = setTimeout(() => setLine(null), line.text.startsWith(SPIN) ? SHOW_MS + 1200 : SHOW_MS);
    return () => clearTimeout(timer);
  }, [line]);

  return { line, say };
}

// Claude Code's "thinking" glyphs, back and forth
const FRAMES = ["✻", "✽", "✻", "✶", "✳", "✢", "·", "✢", "✳", "✶"]; // starts on ✻: with less motion it stays there

function Spinner() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % FRAMES.length), 120);
    return () => clearInterval(id);
  }, []);
  return <span className="bobby-spin">{FRAMES[i]}</span>;
}

export function SpeechBubble({ line, layout }: { line: Line | null; layout: MutableRefObject<Layout> }) {
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
  const spin = line.text.startsWith(SPIN);
  return (
    <div ref={el} className={`bobby-bubble ${spin ? "is-long" : ""}`} aria-hidden="true" key={line.id}>
      {line.egg ? (
        <>
          {line.text}
          <span className="egg-bar">
            {Array.from({ length: line.egg.total }, (_, i) => (
              <i key={i} className={i < line.egg!.filled ? "is-on" : ""} />
            ))}
          </span>
        </>
      ) : spin ? (
        <>
          <Spinner /> {line.text.slice(SPIN.length)}
        </>
      ) : (
        line.text
      )}
    </div>
  );
}
