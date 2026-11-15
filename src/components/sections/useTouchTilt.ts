"use client";
import { useEffect, useState, type RefObject } from "react";
import type { MotionValue } from "motion/react";
import { follow, touchTilt, viewportOffset } from "@/lib/touch-tilt";

type Springs = { rotateX: MotionValue<number>; rotateY: MotionValue<number>; scale: MotionValue<number> };

/**
 * Touch screens have no hover: the card tilts with the scroll as it crosses the middle of the
 * screen and, where the browser hands out the phone's orientation without asking (Android),
 * with the phone's tilt too. iOS asks for permission, so there it stays scroll only. Returns
 * whether the card is in focus (for the sheen and the shadow).
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

    // only listen to the gyroscope where it needs no permission prompt
    // (the constructor itself is missing in some browsers: check before touching it)
    const DOE = typeof DeviceOrientationEvent === "undefined" ? undefined : (DeviceOrientationEvent as unknown as { requestPermission?: unknown });
    const needsPermission = !DOE || typeof DOE.requestPermission === "function";
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", schedule, { passive: true });
        if (!needsPermission) window.addEventListener("deviceorientation", onOrientation);
        schedule();
      } else {
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("deviceorientation", onOrientation);
        rotateX.set(0);
        rotateY.set(0);
        scale.set(1);
        setFeatured(false);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [ref, reduce, rotateX, rotateY, scale]);

  return featured;
}
