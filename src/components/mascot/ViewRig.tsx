"use client";
/* eslint-disable react-hooks/immutability -- three.js frame loop: camera, groups and shared refs are mutated per frame by design */
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import type { Bounds, Throw } from "./throw";

/** Pixels per world unit: the same scale the 200×150 stage canvas had (150 px for 2.99 units). */
export const PPU = 150 / (2 * 4.6 * Math.tan(THREE.MathUtils.degToRad(18)));
const CAM_Z = 4.6;
const RADIUS = 1.3; // Bobby's body, hands and fur, for the screen edges
const STAGE = { w: 220, h: 190 }; // box around Bobby, with room for hops and his hands
const SWITCH_X = 1.05; // the wall switch, in scene units (MascotScene SW)
export const BOBBY_HOME = new THREE.Vector2(-0.45, 0.05); // his spot inside the scene group

/** Screen point (px) of the stage center, where the original scene was framed. */
export type Anchor = { x: number; y: number };

/**
 * World ↔ screen mapping that the pointer handlers need, refreshed every frame. progress: page
 * scroll 0..1 (set by the stage); walk: Bobby's walk offset in world units and moving: whether
 * he is still walking (both set by the scene).
 */
export type Layout = { rootX: number; rootY: number; bounds: Bounds; progress: number; walk: number; moving: boolean };

export function toOffset(layout: Layout, clientX: number, clientY: number): [number, number] {
  return [clientX / PPU - (layout.rootX + BOBBY_HOME.x), -clientY / PPU - (layout.rootY + BOBBY_HOME.y)];
}

/**
 * The canvas covers the whole viewport and the z = 0 plane maps 1:1 to screen pixels.
 * The camera always sits in front of Bobby with a shifted lens (view offset), so he is seen
 * head-on wherever he flies and looks exactly like he did in the small stage at home.
 */
export function ViewRig({ anchor, root, th, layout }: {
  anchor: MutableRefObject<Anchor>;
  root: RefObject<THREE.Group | null>;
  th: MutableRefObject<Throw>;
  layout: MutableRefObject<Layout>;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const wasHome = useRef(false);
  const lastBox = useRef<[number, number, number, number] | null>(null);

  useFrame(() => {
    const { width: W, height: H } = size;
    const a = anchor.current;
    const rootX = a.x / PPU;
    const rootY = -a.y / PPU - 0.35;
    root.current?.position.set(rootX, rootY, 0);

    const bx = rootX + BOBBY_HOME.x;
    const by = rootY + BOBBY_HOME.y + layout.current.walk;
    const L = layout.current;
    L.rootX = rootX;
    L.rootY = rootY;
    L.bounds.left = RADIUS - bx;
    L.bounds.right = W / PPU - RADIUS - bx;
    L.bounds.floor = -H / PPU + RADIUS - by;

    // camera in front of Bobby (same offset the stage camera had), lens shifted to his screen spot
    const cx = bx + th.current.x + 0.45;
    const cy = by + th.current.y + 0.3;
    const px = cx * PPU;
    const py = -cy * PPU;
    const fullW = 2 * Math.max(px, W - px, 1);
    const fullH = 2 * Math.max(py, H - py, 1);
    camera.position.set(cx, cy, CAM_Z);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(fullH / (2 * PPU * CAM_Z)));
    camera.aspect = fullW / fullH;
    camera.setViewOffset(fullW, fullH, fullW / 2 - px, fullH / 2 - py, W, H);
    camera.updateProjectionMatrix();

    // at home only the old stage box is drawn (scissor), so a resting Bobby costs what the
    // 200×150 canvas did; the full viewport is drawn only while he is out
    // the box covers Bobby (wherever he walked to) and the switch; when it moves, the whole
    // canvas is wiped first so he leaves no trail
    const f = th.current;
    const home = (f.mode === "home" || f.mode === "pending") && f.x === 0 && f.y === 0;
    if (home) {
      const bobbyX = bx * PPU, bobbyY = -by * PPU;
      const swX = (rootX + SWITCH_X) * PPU, swY = -(rootY + BOBBY_HOME.y) * PPU;
      const x0 = Math.min(bobbyX - STAGE.w / 2, swX - 40), x1 = Math.max(bobbyX + STAGE.w / 2, swX + 40);
      const y0 = Math.min(bobbyY - STAGE.h / 2, swY - 50), y1 = Math.max(bobbyY + STAGE.h / 2, swY + 50);
      const box = [x0, y0, x1, y1].map(Math.round) as [number, number, number, number];
      const prev = lastBox.current;
      if (!wasHome.current || !prev) {
        gl.setScissorTest(false);
        gl.clear(); // back from a throw: wipe the whole canvas once
      } else if (box.some((v, i) => v !== prev[i])) {
        // walking: wipe only where he was and where he is now
        const u0 = Math.min(prev[0], box[0]), v0 = Math.min(prev[1], box[1]);
        const u1 = Math.max(prev[2], box[2]), v1 = Math.max(prev[3], box[3]);
        gl.setScissorTest(true);
        gl.setScissor(u0, H - v1, u1 - u0, v1 - v0);
        gl.clear();
      }
      lastBox.current = box;
      gl.setScissorTest(true);
      gl.setScissor(x0, H - y1, x1 - x0, y1 - y0);
    } else {
      gl.setScissorTest(false);
    }
    wasHome.current = home;
  }, -1);

  return null;
}
