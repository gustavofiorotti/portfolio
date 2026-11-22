"use client";
/* eslint-disable react-hooks/immutability -- three.js frame loop: camera, groups and shared refs are mutated per frame by design */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Eye, MOODS, type EyeShape } from "./Eye";
import { Strands } from "./Strands";
import { useOverlay } from "./overlays";
import { adaptStrands, blinkOpen, frameUpperHalf, strandsFor, turnAt } from "./gufi-frame";

// the logo's Gufi (header): the red face with the darker rim, same seed as the logo render
const RED = "#C41E1A";
const RIM = "#7A0E0A";
const EYES = "#FAFAF9";
const DIST = 9;

/**
 * The footer's Gufi, live: the header logo's character drawn in Bobby's canvas over the footer
 * stage (.gufi-stage), peeking from the page's bottom edge cut a little under his eyes,
 * breathing and blinking, and turning to face you as the page reaches its end. While it runs,
 * <html data-gufi3d> hides the still picture that stands in for it on phones and without 3D.
 */
export function FooterGufi({ still }: { still: boolean }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.PerspectiveCamera(20, 1, 0.1, 40), []);
  const body = useRef<THREE.Group>(null);
  const expr = useRef<EyeShape>({ ...MOODS.normal });
  const stage = useRef<Element | null>(null);
  const visible = useRef(false);
  const turn = useRef(0);
  const blinkAt = useRef(3);
  const pace = useRef({ frames: 0, time: 0, good: 0 });
  const [base] = useState(() => {
    const info = gl.getContext().getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getContext().getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    return strandsFor(name, navigator.maxTouchPoints > 0);
  });
  const [count, setCount] = useState(base);

  useEffect(() => {
    const el = document.querySelector(".gufi-stage");
    stage.current = el;
    if (!el) return;
    document.documentElement.dataset.gufi3d = "on";
    // he moves (breath, blinks, eyes) only while the footer is on screen: the loop runs only then
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      invalidate();
    };
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(loop);
      else invalidate(); // one last frame clears his box
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      delete document.documentElement.dataset.gufi3d;
    };
  }, [invalidate]);

  useOverlay({
    scene,
    camera,
    rect: () => (visible.current && stage.current ? stage.current.getBoundingClientRect() : null),
    prepare: (r, delta, t) => {
      // the turn follows the scroll, eased so it never steps (the frames jumped 5° at a time)
      const max = document.documentElement.scrollHeight - innerHeight;
      const start = r.top + scrollY - innerHeight;
      const p = still ? 1 : (scrollY - start) / Math.max(1, max - start);
      turn.current = still ? turnAt(1) : THREE.MathUtils.damp(turn.current, turnAt(p), 8, delta);
      if (body.current) {
        body.current.rotation.y = turn.current;
        const breath = still ? 0 : Math.sin(t * 1.5) * 0.012;
        body.current.scale.set(1 - breath * 0.5, 1 + breath, 1 - breath * 0.5);
      }
      if (!still && t > blinkAt.current + 0.2) blinkAt.current = t + 2.4 + Math.random() * 3.2;
      expr.current.open = still ? 1 : blinkOpen(t, blinkAt.current);

      const f = frameUpperHalf(r.width, r.height, DIST);
      camera.fov = f.fov;
      camera.aspect = r.width / r.height;
      camera.position.set(0, f.y, DIST);
      camera.lookAt(0, f.y, 0);
      camera.updateProjectionMatrix();

      // quality follows the frame rate: fewer strands when slow, back up when smooth again
      // (a long gap is the footer coming back on screen, not a slow frame: left out)
      const s = pace.current;
      if (delta < 0.25) {
        s.frames += 1;
        s.time += delta;
      }
      if (s.frames === 90) {
        const next = adaptStrands({ count, good: s.good }, s.time / s.frames, base);
        s.good = next.good;
        if (next.count !== count) setCount(next.count);
        s.frames = 0;
        s.time = 0;
      }
    },
  });

  return createPortal(
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[-2, 3, 4]} intensity={1.4} />
      <group ref={body}>
        <Strands radius={0.92} count={count} length={0.2} width={0.011 * Math.sqrt(60000 / count)} color={RED} rimColor={RIM} faceTrim={0.3} seed={21} still={still} />
        {/* eyes higher on the face: he looks up at the dock */}
        <group rotation={[-0.5, 0, 0]}>
          <group position={[0, 0.08, 1.0]}>
            {[-1, 1].map((sd) => (
              <group key={sd} position={[sd * 0.215, 0, -0.025]} rotation={[0, sd * 0.13, 0]}>
                <Eye side={sd} color={EYES} expr={expr} />
              </group>
            ))}
          </group>
        </group>
      </group>
    </>,
    scene,
  );
}
