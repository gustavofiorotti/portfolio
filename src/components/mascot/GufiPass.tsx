"use client";
// SPIKE (not for merge): the footer's Gufi as a live 3D object drawn in Bobby's canvas (same
// WebGL context), in a second pass with its own camera, scissored to the footer's stage and
// only while it is on screen. ?gufi3d=<strands> turns it on.
import { useEffect, useMemo, useRef } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Eye, MOODS, type EyeShape } from "./Eye";
import { Strands } from "./Strands";

const RED = "#C41E1A";
const EYES = "#FAFAF9";

export function GufiPass({ count }: { count: number }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const scene = useMemo(() => new THREE.Scene(), []);
  const cam = useMemo(() => new THREE.PerspectiveCamera(19, 1, 0.1, 60), []);
  const expr = useRef<EyeShape>({ ...MOODS.normal });
  const body = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const stage = useRef<Element | null>(null);
  const visible = useRef(false);
  const blinkAt = useRef(2);
  const progress = useRef(0);

  useEffect(() => {
    stage.current = document.querySelector(".gufi-stage");
    (document.querySelector(".gufi-canvas") as HTMLElement | null)?.style.setProperty("visibility", "hidden");
    if (!stage.current) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    io.observe(stage.current);
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (visible.current) invalidate(); // animate (blinks, eyes) only while the footer shows
    };
    raf = requestAnimationFrame(loop);
    return () => (io.disconnect(), cancelAnimationFrame(raf));
  }, [invalidate]);

  useFrame((state, delta) => {
    // a priority > 0 takes the render over. Gufi first (his pass clears the footer box), then
    // Bobby on top without clearing again, so Gufi never wipes him
    const main = () => {
      gl.autoClear = false;
      gl.clearDepth();
      gl.render(state.scene, state.camera);
      gl.autoClear = true;
    };
    const el = stage.current;
    if (!visible.current || !el) return gl.render(state.scene, state.camera);
    const r = el.getBoundingClientRect();
    const W = state.size.width, H = state.size.height;
    const x0 = Math.max(0, r.left), y0 = Math.max(0, r.top), x1 = Math.min(W, r.right), y1 = Math.min(H, r.bottom);
    if (x1 <= x0 || y1 <= y0) return gl.render(state.scene, state.camera);
    const t = state.clock.elapsedTime;

    // turn with the scroll (back → face over the footer), like the frame sequence
    const max = document.documentElement.scrollHeight - innerHeight;
    const start = r.top + scrollY - innerHeight;
    const p = Math.min(1, Math.max(0, (scrollY - start) / Math.max(1, max - start)));
    progress.current = THREE.MathUtils.damp(progress.current, p, 10, delta); // smooth, never steps
    if (body.current) {
      body.current.rotation.y = -Math.PI * (1 - progress.current);
      body.current.position.y = Math.sin(t * 1.6) * 0.02; // breathing
    }
    // eyes look up at the dock, wander a little, and blink
    if (eyes.current) eyes.current.rotation.set(-0.32 + Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.45) * 0.08, 0);
    if (t > blinkAt.current + 0.16) blinkAt.current = t + 2.5 + Math.random() * 3;
    const b = t > blinkAt.current ? Math.sin(((t - blinkAt.current) / 0.16) * Math.PI) : 0;
    expr.current.open = 1 - 0.93 * b;

    // camera: ball as wide as in the frames (0.781 of the stage), its centre 0.78 down
    const ballPx = 0.781 * r.width;
    const vh = 2.12 * (r.height / ballPx);
    cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(vh / 2 / 9));
    cam.aspect = r.width / r.height;
    cam.position.set(0, 0.28 * vh, 9);
    cam.lookAt(0, 0.28 * vh, 0);
    cam.updateProjectionMatrix();

    gl.setViewport(r.left, H - r.bottom, r.width, r.height);
    gl.setScissorTest(true);
    gl.setScissor(x0, H - y1, x1 - x0, y1 - y0);
    gl.render(scene, cam); // autoClear wipes only the scissored footer area
    gl.setViewport(0, 0, W, H);
    gl.setScissorTest(false);
    main();
  }, 1);

  return createPortal(
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[-2, 3, 4]} intensity={1.4} />
      <group ref={body}>
        <Strands radius={0.92} count={count} length={0.22} width={0.006} color={RED} faceTrim={0.3} seed={21} />
        <group ref={eyes}>
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
