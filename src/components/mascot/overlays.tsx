"use client";
/* eslint-disable react-hooks/immutability -- three.js frame loop: renderer state is mutated per frame by design */
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A piece drawn in Bobby's canvas (one WebGL context) with its own scene and camera, inside the
 * screen box `rect()` returns (null when it is not on screen). Its camera never follows Bobby, so
 * it never slides with the scroll the way objects in his scene do (the old 3D switch did).
 */
export type Overlay = {
  scene: THREE.Scene;
  camera: THREE.Camera;
  /** screen box (CSS px) to draw in, or null to skip; `prepare` frames the camera for it */
  rect: () => DOMRect | null;
  prepare?: (rect: DOMRect, delta: number, t: number) => void;
};

type Slot = { overlay: Overlay; drawn: [number, number, number, number] | null };
const Ctx = createContext<Slot[] | null>(null);

/** Registers an overlay for as long as the calling component is mounted. */
export function useOverlay(overlay: Overlay) {
  const slots = useContext(Ctx);
  const ref = useRef(overlay);
  useEffect(() => {
    ref.current = overlay; // the latest callbacks, read by the frame loop through the slot
  });
  useEffect(() => {
    if (!slots) return;
    const slot: Slot = { overlay: { ...ref.current, rect: () => ref.current.rect(), prepare: (...a) => ref.current.prepare?.(...a) }, drawn: null };
    slots.push(slot);
    return () => {
      slots.splice(slots.indexOf(slot), 1);
    };
  }, [slots]);
}

/**
 * Takes the render over (a priority-1 frame callback): first wipes Bobby's box (the scissor
 * ViewRig set), then draws every overlay in its own box, then Bobby on top of them all without
 * clearing again, so an overlay never wipes him and his hand reaches over the switch.
 */
export function Overlays({ children }: { children: ReactNode }) {
  const gl = useThree((s) => s.gl);
  const [slots] = useState<Slot[]>(() => []);
  const saved = useMemo(() => new THREE.Vector4(), []);

  useEffect(() => {
    gl.autoClear = false;
    return () => {
      gl.autoClear = true;
    };
  }, [gl]);

  useFrame((state, delta) => {
    const { width: W, height: H } = state.size;
    const scissorOn = gl.getScissorTest();
    gl.getScissor(saved);
    gl.clear(); // Bobby's box (or the whole canvas while he is out), as R3F's autoClear did

    gl.setScissorTest(true);
    for (const slot of slots) {
      const r = slot.overlay.rect();
      const box = r && clip(r, W, H);
      if (!box) {
        if (slot.drawn) {
          // gone from the screen: wipe what it left
          gl.setScissor(...slot.drawn);
          gl.clear();
          slot.drawn = null;
        }
        continue;
      }
      if (slot.drawn && slot.drawn.some((v, i) => v !== box[i])) {
        gl.setScissor(...slot.drawn); // it moved: wipe the old spot
        gl.clear();
      }
      slot.overlay.prepare?.(r!, delta, state.clock.elapsedTime);
      gl.setScissor(...box);
      gl.clear();
      gl.setViewport(r!.left, H - r!.bottom, r!.width, r!.height);
      gl.render(slot.overlay.scene, slot.overlay.camera);
      slot.drawn = box;
    }

    gl.setViewport(0, 0, W, H);
    gl.setScissor(saved);
    gl.setScissorTest(scissorOn);
    gl.clearDepth();
    gl.render(state.scene, state.camera);
  }, 1);

  return <Ctx.Provider value={slots}>{children}</Ctx.Provider>;
}

/** The part of a screen box inside the canvas, as a scissor box (x, y from the bottom, w, h). */
export function clip(r: { left: number; top: number; right: number; bottom: number }, W: number, H: number): [number, number, number, number] | null {
  const x0 = Math.max(0, Math.floor(r.left)), x1 = Math.min(W, Math.ceil(r.right));
  const y0 = Math.max(0, Math.floor(r.top)), y1 = Math.min(H, Math.ceil(r.bottom));
  if (x1 <= x0 || y1 <= y0) return null;
  return [x0, H - y1, x1 - x0, y1 - y0];
}
