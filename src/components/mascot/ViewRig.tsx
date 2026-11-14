"use client";
/* eslint-disable react-hooks/immutability -- three.js frame loop: camera, groups and shared refs are mutated per frame by design */
import { useFrame, useThree } from "@react-three/fiber";
import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";
import type { Bounds, Throw } from "./throw";

/** Pixels per world unit: the same scale the 200×150 stage canvas had (150 px for 2.99 units). */
export const PPU = 150 / (2 * 4.6 * Math.tan(THREE.MathUtils.degToRad(18)));
const CAM_Z = 4.6;
const RADIUS = 1.1; // Bobby's body plus fur, for the screen edges
export const BOBBY_HOME = new THREE.Vector2(-0.45, 0.05); // his spot inside the scene group

/** Screen point (px) of the stage center, where the original scene was framed. */
export type Anchor = { x: number; y: number };

/** World ↔ screen mapping that the pointer handlers need, refreshed every frame. */
export type Layout = { rootX: number; rootY: number; bounds: Bounds };

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

  useFrame(() => {
    const { width: W, height: H } = size;
    const a = anchor.current;
    const rootX = a.x / PPU;
    const rootY = -a.y / PPU - 0.35;
    root.current?.position.set(rootX, rootY, 0);

    const bx = rootX + BOBBY_HOME.x;
    const by = rootY + BOBBY_HOME.y;
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
  }, -1);

  return null;
}
