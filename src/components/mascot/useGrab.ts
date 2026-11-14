"use client";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import type * as THREE from "three";
import { move, press, release, type Throw } from "./throw";
import { toOffset, type Layout } from "./ViewRig";

const INTERACTIVE = "a, button, input, select, textarea, summary, label, [role=button], [contenteditable]";

/**
 * The scene's pointer events come from document.body through a raycast, which does not know
 * what the DOM has on top. Bobby only counts as "under the pointer" when the page there is not
 * a control, and never while he runs behind the page.
 */
export function reachable(th: Throw, clientX: number, clientY: number): boolean {
  if (th.mode === "running") return false;
  const el = document.elementFromPoint(clientX, clientY);
  return !el?.closest(INTERACTIVE);
}

/** Drag-and-throw input: mouse or pen only (touch keeps scrolling), one pointer at a time. */
export function useGrab({ th, layout, clock, still }: {
  th: MutableRefObject<Throw>;
  layout: MutableRefObject<Layout>;
  clock: THREE.Clock;
  still: boolean;
}) {
  const end = useRef<() => void>(() => {});
  const dragged = useRef(false); // true once the press became a drag, so its click is not a poke
  const html = () => document.documentElement;

  useEffect(
    () => () => {
      end.current();
      delete html().dataset.bobbyHover;
    },
    [],
  );

  const grab = (ev: ThreeEvent<PointerEvent>) => {
    const e = ev.nativeEvent;
    if (still || e.button !== 0 || e.pointerType === "touch" || !reachable(th.current, e.clientX, e.clientY)) return;
    ev.stopPropagation();
    end.current();
    // R3F listens passively, so no preventDefault: user-select goes off from the press on (CSS)
    html().dataset.bobbyDrag = "";
    dragged.current = false;
    const id = e.pointerId;
    const at = (p: PointerEvent) => toOffset(layout.current, p.clientX, p.clientY);
    press(th.current, ...at(e), clock.elapsedTime);
    const onMove = (p: PointerEvent) => {
      if (p.pointerId !== id || !move(th.current, ...at(p), clock.elapsedTime)) return;
      dragged.current = true;
    };
    const onUp = (p: PointerEvent) => {
      if (p.pointerId !== id) return;
      release(th.current, clock.elapsedTime);
      end.current();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    end.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      delete html().dataset.bobbyDrag;
      end.current = () => {};
    };
  };

  const hover = (on: boolean) => (ev: ThreeEvent<PointerEvent>) => {
    if (still) return;
    const ok = on && reachable(th.current, ev.nativeEvent.clientX, ev.nativeEvent.clientY);
    if (ok) html().dataset.bobbyHover = "1";
    else delete html().dataset.bobbyHover;
  };

  return { grab, hover, dragged };
}
