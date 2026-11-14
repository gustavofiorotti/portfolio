"use client";
/* eslint-disable react-hooks/immutability -- three.js frame loop: refs and shared request objects are mutated per frame by design, outside React rendering */
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Eye, MOODS, type EyeShape } from "./Eye";
import { Strands } from "./Strands";
import { step, type Throw } from "./throw";
import { reachable, useGrab } from "./useGrab";
import { PPU, ViewRig, type Anchor, type Layout } from "./ViewRig";
import { walkOffsetPx } from "./walk";

export type PressRequest = { pending: boolean; at: number };
export type Pointer = { x: number; y: number; lastMove: number; speed: number };

const BODY = "#D97757"; // Claude Code orange, chosen by Gustavo
const GAIN = 1.32; // the fur lighting reads darker than the chosen orange; this brings it back
const EYES = "#1C1C20";
const SW = new THREE.Vector3(1.05, 0.05, 0); // where the wall switch sits
const damp = THREE.MathUtils.damp;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
type Mood = "normal" | "feliz" | "dor" | "bravo" | "susto" | "sono";

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

function useShadowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(10,10,12,0.3)");
    grd.addColorStop(1, "rgba(10,10,12,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
}

/** Wall switch: a plate and a rocker that tips to show which half is up. */
function LightSwitch({ dark, rocker, plate, onPress }: { dark: boolean; rocker: MutableRefObject<THREE.Group | null>; plate: MutableRefObject<THREE.Group | null>; onPress: () => void }) {
  const geo = useMemo(() => {
    const ex = (w: number, h: number, r: number, depth: number, bevel: boolean) =>
      new THREE.ExtrudeGeometry(roundedRect(w, h, r), { depth, bevelEnabled: bevel, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 10 });
    return { plate: ex(0.5, 0.78, 0.11, 0.05, true), well: ex(0.26, 0.46, 0.07, 0.02, false), key: ex(0.22, 0.2, 0.06, 0.07, true) };
  }, []);
  return (
    <group ref={plate} position={SW} onClick={(e) => (e.stopPropagation(), onPress())}>
      <mesh geometry={geo.plate}>
        <meshStandardMaterial color={dark ? "#26262B" : "#FAFAF9"} roughness={0.6} />
      </mesh>
      <mesh geometry={geo.well} position={[0, 0, 0.066]}>
        <meshStandardMaterial color={dark ? "#111113" : "#E4E4E7"} roughness={0.8} />
      </mesh>
      <group ref={rocker} position={[0, 0, 0.09]}>
        <mesh geometry={geo.key} position={[0, 0.06, -0.035]}>
          <meshStandardMaterial color={dark ? "#3B3B41" : "#FAFAF9"} roughness={0.45} />
        </mesh>
        <mesh geometry={geo.key} position={[0, -0.06, -0.035]} scale={[1, 1, 0.85]}>
          <meshStandardMaterial color={dark ? "#34343A" : "#F4F4F5"} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

type State = {
  squash: number; vel: number; hurtT: number; pet: number; pokes: number[]; angryT: number; surpriseT: number;
  lastX: number; dir: number; glanceT: number; glance: [number, number]; mood: Mood; shake: number;
  pressT0: number; pressed: boolean; happyT: number; pokeAt: boolean; behind: boolean; shade: number;
  holdUntil: number; framed: boolean; walking: number;
};

type SceneProps = {
  onContextLost?: () => void; dark: boolean; onToggle: () => void; onSwitchClick: () => void; press: MutableRefObject<PressRequest>;
  pointer: MutableRefObject<Pointer>; still: boolean; th: MutableRefObject<Throw>; anchor: MutableRefObject<Anchor>;
  layout: MutableRefObject<Layout>; onBehind: (behind: boolean) => void; onFirstFrame?: () => void;
};

function Plush({ dark, onToggle, onSwitchClick, press, pointer, still, th, layout, onBehind, onFirstFrame }: SceneProps) {
  const carrier = useRef<THREE.Group>(null);
  const clock = useThree((s) => s.clock);
  const { grab, hover, dragged } = useGrab({ th, layout, clock, still });
  const float = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const eyesPivot = useRef<THREE.Group>(null);
  const hands = useRef<(THREE.Group | null)[]>([]);
  const shadow = useRef<THREE.Mesh>(null);
  const rocker = useRef<THREE.Group | null>(null);
  const plate = useRef<THREE.Group | null>(null);
  const shadowTex = useShadowTexture();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const expr = useRef<EyeShape>({ ...MOODS.normal });
  const st = useRef<State>({
    squash: 1, vel: 0, hurtT: 0, pet: 0, pokes: [], angryT: 0, surpriseT: 0, lastX: 0, dir: 0, glanceT: 0,
    glance: [0, 0], mood: "normal", shake: 0, pressT0: -10, pressed: false, happyT: 0, pokeAt: false, behind: false, shade: 1, holdUntil: 0, framed: false, walking: 0,
  });

  useFrame((state, delta) => {
    const s = st.current;
    const p = pointer.current;
    const t = state.clock.elapsedTime;
    if (!float.current || !body.current || !eyesPivot.current || !shadow.current || !rocker.current || !carrier.current) return;

    // drag and throw: physics in throw.ts; hits squash him, and he runs home behind the cards
    const f = th.current;
    step(f, delta, t, layout.current.bounds);
    if (f.impact > 0) {
      s.vel -= Math.min(4, f.impact * 0.12);
      s.shake = Math.min(1, f.impact / 20);
      if (f.impact > 12) s.hurtT = t + 0.9;
      f.impact = 0;
    }
    const away = f.mode !== "home" && f.mode !== "pending";
    if (!s.framed) {
      s.framed = true;
      onFirstFrame?.();
    }

    // walk along the right edge with the scroll (walk.ts); stay at the switch while pressing it
    const L = layout.current;
    const wantsSwitch = (press.current.pending && !away) || t < s.holdUntil;
    const walkTo = still || wantsSwitch ? 0 : -walkOffsetPx(L.progress, state.size.height) / PPU;
    const before = L.walk;
    L.walk = still ? 0 : damp(L.walk, walkTo, 4.5, delta);
    L.moving = Math.abs(walkTo - L.walk) > 0.004;
    s.walking = damp(s.walking, Math.min(1, Math.abs(L.walk - before) / Math.max(delta, 1e-3) / 2), 10, delta);
    carrier.current.position.set(f.x, f.y + L.walk, 0);
    const behind = f.mode === "running";
    if (behind !== s.behind) {
      s.behind = behind;
      onBehind(behind);
    }

    // pokes resolve here so every timer shares the frame clock
    if (s.pokeAt) {
      s.pokeAt = false;
      s.hurtT = t + 0.8;
      if (s.pokes.length >= 4) {
        s.angryT = t + 2.6;
        s.pokes = [];
      }
    }
    // light switch: 1 s timeline (look, reach, press, come back); the theme flips at the press
    if (press.current.pending && (away || Math.abs(L.walk) < 0.04)) {
      press.current.pending = false;
      press.current.at = performance.now();
      s.holdUntil = t + 1.8; // stays by the switch for the press and a moment after
      if (away) {
        // away from the switch: the theme flips at once, no reach
        onToggle();
        s.happyT = t + 2.4;
      } else if (t - s.pressT0 > 1.05) {
        s.pressT0 = t;
        s.pressed = false;
      }
    }
    const pp = (t - s.pressT0) / 1.0;
    const pressing = pp >= 0 && pp < 1;
    if (pressing && pp >= 0.5 && !s.pressed) {
      s.pressed = true;
      s.happyT = t + 2.4; // pleased with himself after every press
      onToggle();
      s.vel -= 0.9;
    }

    const idleFor = (performance.now() - p.lastMove) / 1000;
    if (s.mood === "sono" && idleFor < 0.2 && p.speed > 0.02) s.surpriseT = t + 1.1;
    let mood: Mood = "normal";
    if (pressing) mood = "normal";
    else if (f.mode === "held" || f.mode === "flying") mood = "susto";
    else if (f.mode === "dizzy") mood = "dor";
    else if (t < s.angryT) mood = "bravo";
    else if (t < s.hurtT) mood = "dor";
    else if (t < s.surpriseT) mood = "susto";
    else if (s.pet > 0.35 || t < s.happyT) mood = "feliz";
    else if (idleFor > 7) mood = "sono";
    if (mood !== s.mood) {
      s.mood = mood;
      if (mood === "susto") s.vel += 2.2;
    }
    s.pet = Math.max(0, s.pet - delta * 0.5);

    // eyes ease towards the mood's shape; blink on top
    const target = MOODS[mood];
    const e = expr.current;
    const k = mood === "dor" || mood === "susto" ? 20 : 10;
    (Object.keys(target) as (keyof EyeShape)[]).forEach((key) => (e[key] = damp(e[key], target[key], k, delta)));
    if ((mood === "normal" || mood === "bravo") && t % 3.8 > 3.68) e.open = Math.min(e.open, 0.08);

    // body language (no idle motion when the visitor asked for less motion)
    const motion = still ? 0 : 1;
    const bob = Math.sin(t * 1.6 * (mood === "sono" ? 0.55 : 1)) * (mood === "sono" ? 0.03 : 0.06) * motion;
    const hop = f.mode === "running" ? Math.abs(Math.sin(t * 16)) * 0.1 : s.walking > 0.15 ? Math.abs(Math.sin(t * 13)) * 0.07 * s.walking * motion : mood === "feliz" ? Math.abs(Math.sin(t * 7)) * 0.07 * motion : 0;
    float.current.position.y = 0.05 + bob + hop;
    s.vel += (1 - s.squash) * 170 * delta;
    s.vel *= Math.exp(-8 * delta);
    s.squash += s.vel * delta;
    const sy = s.squash * (1 + Math.sin(t * 1.6 + 1.2) * 0.012 * motion);
    body.current.scale.set(1 + (1 - sy) * 0.65, sy, 1 + (1 - sy) * 0.65);
    s.shake = Math.max(0, s.shake - delta * 2.5);
    const tremble = mood === "bravo" ? Math.sin(t * 48) * 0.012 * motion : 0;
    body.current.position.x = Math.sin(t * 55) * 0.04 * s.shake * motion + tremble;
    const rz = mood === "feliz" ? Math.sin(t * 7) * 0.12 * motion : mood === "sono" ? 0.16 : 0;
    const rx = mood === "bravo" ? 0.14 : mood === "sono" ? 0.12 : 0;
    const lean = pressing && pp < 0.8;
    const tilt = away ? THREE.MathUtils.clamp(-f.vx * 0.015, -0.5, 0.5) : rz;
    body.current.rotation.z = damp(body.current.rotation.z, lean ? -0.13 : tilt, 8, delta);
    float.current.position.x = damp(float.current.position.x, lean ? 0.22 : 0, 6, delta);
    body.current.rotation.x = damp(body.current.rotation.x, rx, 6, delta);
    shadow.current.scale.setScalar(1.3 - (bob + hop) * 1.4);
    s.shade = damp(s.shade, away ? 0 : 1, 10, delta);
    (shadow.current.material as THREE.MeshBasicMaterial).opacity = (0.9 - (bob + hop) * 2) * s.shade;

    // hands; the right one reaches for the raised half of the rocker during a press
    hands.current.forEach((h, i) => {
      if (!h || !h.parent) return;
      const sd = i === 0 ? -1 : 1;
      let y = -0.36, x = sd * 1.02, z = 0.22;
      if (mood === "feliz") y = -0.2 + (sd > 0 ? Math.sin(t * 10) * 0.12 * motion : 0);
      if (mood === "susto") { y = 0.15; x = sd * 1.05; }
      if (mood === "bravo") { y = -0.42 + Math.sin(t * 40 + sd) * 0.015 * motion; x = sd * 0.98; z = 0.32; }
      if (mood === "sono") { y = -0.5; x = sd * 0.96; }
      if (mood === "dor") { y = -0.05; x = sd * 0.9; z = 0.45; }
      let kk = 10;
      if (sd > 0 && pressing && pp < 0.66) {
        const up = s.pressed ? (dark ? 0.07 : -0.07) : dark ? -0.07 : 0.07;
        tmp.set(SW.x + 0.07, SW.y + up, SW.z + 0.2);
        h.parent.updateWorldMatrix(true, false);
        h.parent.worldToLocal(tmp);
        if (pp < 0.28) { x = 0.95; y = -0.28; z = 0.05; }
        else if (pp < 0.5) {
          const f = ease((pp - 0.28) / 0.22);
          x = THREE.MathUtils.lerp(0.95, tmp.x, f); y = THREE.MathUtils.lerp(-0.28, tmp.y, f); z = THREE.MathUtils.lerp(0.05, tmp.z, f);
        } else { x = tmp.x; y = tmp.y; z = tmp.z - 0.07; }
        kk = 28;
      }
      h.position.set(damp(h.position.x, x, kk, delta), damp(h.position.y, y, kk, delta), damp(h.position.z, z, kk, delta));
      const squish = sd > 0 && pressing && pp >= 0.5 && pp < 0.62 ? 0.8 : 1;
      h.scale.set(damp(h.scale.x, 2 - squish, 20, delta), damp(h.scale.y, 2 - squish, 20, delta), damp(h.scale.z, squish, 20, delta));
    });

    // eyes follow the pointer (less when sleepy or hurt) and look at the switch while pressing
    if (t > s.glanceT) {
      s.glance = [(Math.random() * 2 - 1) * 0.25, (Math.random() * 2 - 1) * 0.12];
      s.glanceT = t + 1.5 + Math.random() * 2.5;
    }
    const follow = mood === "sono" || mood === "dor" ? 0.15 : 1;
    const tx = (p.x * 0.42 + s.glance[0] * 0.3 * motion) * follow;
    const ty = (p.y * 0.28 + s.glance[1] * 0.3 * motion) * follow;
    const look = pressing && pp < 0.75;
    eyesPivot.current.rotation.y = damp(eyesPivot.current.rotation.y, look ? 0.34 : tx, look ? 14 : 8, delta);
    eyesPivot.current.rotation.x = damp(eyesPivot.current.rotation.x, look ? 0.02 : -ty, 8, delta);
    // the camera follows Bobby, so with him far away the switch is seen at a steep angle and its
    // depth would smear: flatten it in z as the angle grows (it is a flat plate from the front)
    if (plate.current) {
      plate.current.getWorldPosition(tmp);
      const tan = Math.hypot(tmp.x - state.camera.position.x, tmp.y - state.camera.position.y) / state.camera.position.z;
      plate.current.scale.z = Math.min(1, 0.3 / Math.max(tan, 1e-3));
    }
    rocker.current.rotation.x = damp(rocker.current.rotation.x, dark ? -0.3 : 0.3, 18, delta);
  });

  const poke = (ev: ThreeEvent<MouseEvent>) => {
    ev.stopPropagation();
    if (dragged.current || !reachable(th.current, ev.nativeEvent.clientX, ev.nativeEvent.clientY)) return; // a drag, or a control on top
    const s = st.current;
    const t = ev.nativeEvent.timeStamp / 1000;
    s.vel -= 3;
    s.shake = 1;
    s.pokes = s.pokes.filter((p) => t - p < 3).concat(t);
    s.pokeAt = true;
  };
  const petMove = (ev: ThreeEvent<PointerEvent>) => {
    const s = st.current;
    if (th.current.mode !== "home") return;
    const x = ev.pointer.x;
    const d = Math.sign(x - s.lastX);
    if (d !== 0 && d !== s.dir && Math.abs(x - s.lastX) > 0.008) {
      s.dir = d;
      s.pet = Math.min(1.4, s.pet + 0.14);
    }
    s.lastX = x;
  };

  return (
    <group>
      <ambientLight intensity={1.7} />
      <directionalLight position={[-2, 3, 4]} intensity={1.4} />
      <LightSwitch dark={dark} rocker={rocker} plate={plate} onPress={onSwitchClick} />
      <group position={[-0.45, 0, 0]}>
        <group ref={carrier}>
          <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, -1.08, 0]}>
            <planeGeometry args={[1.25, 1.25]} />
            <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
          </mesh>
          <group ref={float}>
            <group ref={body}>
              <Strands radius={0.92} count={20000} length={0.2} width={0.012} color={BODY} gain={GAIN} faceTrim={0.3} still={still} onClick={poke} onPointerMove={petMove} onPointerDown={grab} onPointerOver={hover(true)} onPointerOut={hover(false)} />
              <group ref={eyesPivot}>
                <group position={[0, 0.08, 1.0]}>
                  {[-1, 1].map((sd) => (
                    <group key={sd} position={[sd * 0.215, 0, -0.025]} rotation={[0, sd * 0.13, 0]}>
                      <Eye side={sd} color={EYES} expr={expr} />
                    </group>
                  ))}
                </group>
              </group>
              {[-1, 1].map((sd, i) => (
                <group key={sd} ref={(g) => { hands.current[i] = g; }} position={[sd * 1.02, -0.36, 0.22]}>
                  <Strands radius={0.17} count={1800} length={0.09} width={0.008} color={BODY} gain={GAIN} seed={sd > 0 ? 11 : 13} still={still} />
                </group>
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Drives rendering on demand: 60 fps while something happens (pointer moving, a press, a
 * mood), about 24 fps when he just floats, nothing with reduced motion except reactions.
 */
function FrameDriver({ pointer, press, still, th, layout }: { pointer: MutableRefObject<Pointer>; press: MutableRefObject<PressRequest>; still: boolean; th: MutableRefObject<Throw>; layout: MutableRefObject<Layout> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const busy = th.current.mode !== "home" || layout.current.moving || now - pointer.current.lastMove < 2500 || press.current.pending || now - press.current.at < 4000;
      const gap = busy ? 0 : still ? 1000 : 1000 / 24;
      if (now - last >= gap) {
        last = now;
        invalidate();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, pointer, press, still, th, layout]);
  return null;
}

/**
 * The canvas: low-power GPU, capped resolution, renders on demand and stops with the tab
 * hidden. It covers the viewport so Bobby can be thrown anywhere; pointer events come from the
 * page, so the canvas never blocks the content under it.
 */
export default function MascotScene(props: SceneProps & { running: boolean }) {
  const { running, ...scene } = props;
  const root = useRef<THREE.Group>(null);
  return (
    <Canvas
      frameloop={running ? "demand" : "never"}
      dpr={[1, 1.25]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ manual: true, position: [0, 0.35, 4.6], fov: 36, near: 0.1, far: 60 }}
      eventSource={document.body}
      eventPrefix="client"
      flat
      onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", (e) => (e.preventDefault(), props.onContextLost?.()))}
    >
      <FrameDriver pointer={scene.pointer} press={scene.press} still={scene.still} th={scene.th} layout={scene.layout} />
      <ViewRig anchor={scene.anchor} root={root} th={scene.th} layout={scene.layout} />
      <group ref={root}>
        <Plush {...scene} />
      </group>
    </Canvas>
  );
}
