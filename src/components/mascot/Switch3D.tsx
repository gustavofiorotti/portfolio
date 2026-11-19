"use client";
/* eslint-disable react-hooks/immutability -- three.js frame loop: camera and groups are mutated per frame by design */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useOverlay } from "./overlays";
import { COLORS, KEY, PAD, PLATE, WELL, tiltFor } from "./switch-model";

const DIST = 300; // camera distance in px: a little perspective on the rocker, the plate face 1:1

/** A rounded rectangle centred on the origin (optionally only the top or bottom corners rounded). */
function rounded(w: number, h: number, r: number, corners: "all" | "top" | "bottom" = "all", s = new THREE.Shape()) {
  const x = -w / 2, y = -h / 2;
  const rt = corners !== "bottom" ? r : 0, rb = corners !== "top" ? r : 0;
  s.moveTo(x + rb, y);
  s.lineTo(x + w - rb, y);
  if (rb) s.quadraticCurveTo(x + w, y, x + w, y + rb);
  s.lineTo(x + w, y + h - rt);
  if (rt) s.quadraticCurveTo(x + w, y + h, x + w - rt, y + h);
  s.lineTo(x + rt, y + h);
  if (rt) s.quadraticCurveTo(x, y + h, x, y + h - rt);
  s.lineTo(x, y + rb);
  if (rb) s.quadraticCurveTo(x, y, x + rb, y);
  return s;
}

function extrude(shape: THREE.Shape, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -depth - bevel); // front face (with its bevel) ends at z = 0
  return g;
}

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  grad.addColorStop(0, "rgba(0,0,0,1)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/**
 * The wall switch as a real 3D piece, drawn in Bobby's canvas exactly over the HTML button
 * (which stays for clicks, focus and screen readers, its paint hidden by <html data-switch3d>).
 * Its own fixed camera keeps it still on the screen; Bobby is drawn after it, so his hand
 * reaches over the key. Same design as the HTML one: the raised half glossy with the red band,
 * the sunken half matte.
 */
export function Switch3D({ dark, still }: { dark: boolean; still: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.PerspectiveCamera(20, 1, 1, 2000), []);
  const key = useRef<THREE.Group>(null);
  const button = useRef<HTMLElement | null>(null);
  const angle = useRef<number | null>(null);
  const drawn = useRef(false);

  const geo = useMemo(() => {
    const plate = rounded(PLATE.w, PLATE.h, PLATE.r);
    plate.holes.push(rounded(WELL.w, WELL.h, WELL.r) as unknown as THREE.Path);
    const kh = KEY.h / 2;
    const top = extrude(rounded(KEY.w, kh, KEY.r, "top"), KEY.depth, 0.8);
    top.translate(0, kh / 2, 0);
    const bottom = extrude(rounded(KEY.w, kh, KEY.r, "bottom"), KEY.depth, 0.8);
    bottom.translate(0, -kh / 2, 0);
    return {
      plate: extrude(plate, PLATE.depth, 1.6),
      floor: new THREE.ShapeGeometry(rounded(WELL.w, WELL.h, WELL.r)),
      top,
      bottom,
      band: new THREE.BoxGeometry(KEY.w * 0.6, 2, 0.6),
      shadow: new THREE.PlaneGeometry(PLATE.w * 1.5, PLATE.h * 1.35),
    };
  }, []);
  const shadowMap = useMemo(() => shadowTexture(), []);
  const mat = useMemo(
    () => ({
      plate: new THREE.MeshPhysicalMaterial({ roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
      floor: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
      up: new THREE.MeshPhysicalMaterial({ roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
      down: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
      band: new THREE.MeshBasicMaterial(),
      shadow: new THREE.MeshBasicMaterial({ color: "#000", map: shadowMap, transparent: true, depthWrite: false }),
    }),
    [shadowMap],
  );

  // the button: hover and press tilt the key (as in the CSS), and its paint hides once drawn here
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".mascot-switch");
    button.current = el;
    if (!el) return;
    const kick = () => invalidate();
    const events = ["pointerenter", "pointerleave", "pointerdown", "pointerup", "pointercancel"] as const;
    events.forEach((e) => el.addEventListener(e, kick));
    return () => {
      events.forEach((e) => el.removeEventListener(e, kick));
      delete document.documentElement.dataset.switch3d;
    };
  }, [invalidate]);

  useEffect(() => {
    const c = COLORS[dark ? "dark" : "light"];
    mat.plate.color.set(c.plate);
    mat.floor.color.set(c.well);
    mat.band.color.set(c.band);
    mat.shadow.opacity = c.shadow;
    invalidate();
  }, [dark, mat, invalidate]);

  // read once, not every frame: a mouse (hover) or a touch screen does not change mid-visit
  const [canHover] = useState(() => matchMedia("(hover: hover)").matches);

  useOverlay({
    scene,
    camera,
    rect: () => {
      const el = button.current;
      if (!el || el.classList.contains("is-plain")) return null;
      const r = el.getBoundingClientRect();
      return new DOMRect(r.x - PAD, r.y - PAD, r.width + 2 * PAD, r.height + 2 * PAD);
    },
    prepare: (r, delta) => {
      const el = button.current!;
      const hover = el.matches(":hover"), active = el.matches(":active");
      const target = THREE.MathUtils.degToRad(tiltFor(dark, hover && canHover, active));
      const a = angle.current === null || still ? target : THREE.MathUtils.damp(angle.current, target, 14, delta);
      angle.current = Math.abs(a - target) < 1e-4 ? target : a;
      if (angle.current !== target) invalidate();
      if (key.current) key.current.rotation.x = angle.current;
      // the raised half: glossy and banded; the other one matte (swaps as the key crosses flat)
      const topUp = angle.current > 0;
      const c = COLORS[dark ? "dark" : "light"];
      mat.up.color.set(c.up);
      mat.down.color.set(c.down);
      const [top, bottom] = key.current!.children as THREE.Mesh[];
      top.material = topUp ? mat.up : mat.down;
      bottom.material = topUp ? mat.down : mat.up;
      const band = key.current!.children[2];
      band.position.y = (topUp ? 1 : -1) * (KEY.h / 2 - KEY.h * 0.09);

      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(r.height / 2 / DIST));
      camera.aspect = r.width / r.height;
      camera.position.set(0, 0, DIST);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      if (!drawn.current) {
        drawn.current = true;
        document.documentElement.dataset.switch3d = "on";
      }
    },
  });

  return createPortal(
    <>
      <ambientLight intensity={dark ? 0.9 : 1.6} />
      <hemisphereLight args={["#ffffff", "#8a8070", dark ? 0.5 : 0.7]} />
      {/* light from above and a little to the left, like the page's shadows */}
      <directionalLight position={[-60, 160, 140]} intensity={dark ? 1.6 : 1.9} />
      <mesh geometry={geo.shadow} material={mat.shadow} position={[0, -6, -PLATE.depth - 4]} />
      <mesh geometry={geo.plate} material={mat.plate} />
      <mesh geometry={geo.floor} material={mat.floor} position={[0, 0, -WELL.depth]} />
      {/* the rocker pivots on its middle, inside the well */}
      <group ref={key} position={[0, 0, -WELL.depth / 2]}>
        <mesh geometry={geo.top} position={[0, 0, KEY.depth / 2]} />
        <mesh geometry={geo.bottom} position={[0, 0, KEY.depth / 2]} />
        <mesh geometry={geo.band} material={mat.band} position={[0, 0, KEY.depth / 2 + 0.4]} />
      </group>
    </>,
    scene,
  );
}
