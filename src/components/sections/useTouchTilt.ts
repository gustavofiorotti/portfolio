"use client";
import { useEffect, useState, type RefObject } from "react";
import type { MotionValue } from "motion/react";
import { follow, touchTilt, viewportOffset } from "@/lib/touch-tilt";
import { armGyroOnTap, canListenToGyro, onGyroGranted } from "@/lib/gyro-permission";

type Springs = { rotateX: MotionValue<number>; rotateY: MotionValue<number>; scale: MotionValue<number> };

/**
 * Touch screens have no hover: the card tilts with the scroll as it crosses the middle of the
 * screen and, where the browser hands out the phone's orientation without asking (Android),
 * with the phone's tilt too. iOS asks for permission: the first tap on the page outside links
 * and buttons asks, and once granted every card follows the phone. Returns whether the card is in focus (for the sheen and
 * the shadow).
 */
export function useTouchTilt(ref: RefObject<HTMLElement | null>, springs: Springs, reduce: boolean | null): boolean {
  const [featured, setFeatured] = useState(false);
  const { rotateX, rotateY, scale } = springs;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let gyro: { x: number; y: number } | null = null;
    let baseBeta: number | null = null;
    let baseGamma: number | null = null;

    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const tilt = touchTilt(viewportOffset(r.top, r.height, window.innerHeight), gyro);
      rotateX.set(tilt.rotateX);
      rotateY.set(tilt.rotateY);
      scale.set(tilt.scale);
      setFeatured(tilt.featured);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onOrientation = (e: { beta: number | null; gamma: number | null }) => {
      if (e.beta === null || e.gamma === null) return;
      baseBeta = follow(baseBeta, e.beta);
      baseGamma = follow(baseGamma, e.gamma);
      gyro = { x: e.beta - baseBeta, y: e.gamma - baseGamma };
      schedule();
    };

    let visible = false;
    let listening = false;
    const listen = () => {
      if (listening || !visible || !canListenToGyro()) return;
      listening = true;
      window.addEventListener("deviceorientation", onOrientation);
    };
    const unlisten = () => {
      listening = false;
      window.removeEventListener("deviceorientation", onOrientation);
    };
    // iOS: the first tap on the page outside links and buttons asks (gyro-permission.ts)
    armGyroOnTap();
    const stopWaiting = onGyroGranted(listen);
    const rest = () => {
      rotateX.set(0);
      rotateY.set(0);
      scale.set(1);
      setFeatured(false);
    };
    // several entries can arrive in one batch: the last one is the current state
    const io = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
      if (!entry) return;
      visible = entry.isIntersecting;
      if (visible) {
        window.addEventListener("scroll", schedule, { passive: true });
        listen();
        schedule();
      } else {
        window.removeEventListener("scroll", schedule);
        unlisten();
        rest();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      stopWaiting();
      window.removeEventListener("scroll", schedule);
      unlisten();
      // unmount, or reduced motion switched on while mounted: never leave the card tilted
      rest();
    };
  }, [ref, reduce, rotateX, rotateY, scale]);

  return featured;
}
