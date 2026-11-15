"use client";
/* eslint-disable react-hooks/immutability -- three.js frame loop: refs and shared request objects are mutated per frame by design, outside React rendering */
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { PressRequest } from "./press";
import { Eye, MOODS, type EyeShape } from "./Eye";
import { LightSwitch, SW, SW_SCALE } from "./LightSwitch";
import { Strands } from "./Strands";
import { step, type Throw } from "./throw";
import { reachable, useGrab } from "./useGrab";
import { PPU, ViewRig, type Anchor, type Layout } from "./ViewRig";
import { walkOffsetPx } from "./walk";
import { angerAt, calm, createFeel, eggProgress, endStroke, levelOf, poke as addPoke, stroke } from "./feelings";
import { SLEEPY_AFTER, sleepLine, sleepPose, zzzNow, type SleepStage, type Zzz } from "./sleep";

export type { PressRequest } from "./press";
export type Pointer = { x: number; y: number; lastMove: number; speed: number };

const BODY = "#D97757"; // Claude Code orange, chosen by Gustavo
const GAIN = 1.75; // the fur lighting reads darker than the chosen orange; this brings it back
const EYES = "#1C1C20";
const damp = THREE.MathUtils.damp;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
type Mood = "normal" | "feliz" | "dor" | "irritado" | "bravo" | "furioso" | "susto" | "sono";
/** What Bobby says in a bubble; the stage picks the words (messages bobby.*). */
export type Say =
  | "hello" | "poke" | "angry" | "egg" | "eggStep" | "pet" | "soothed" | "thrown" | "landed" | "switchOn" | "switchOff" | "idle"
  | "yawn" | "doze" | "jolt" | "asleep" | "wake"
  | "hush"; // not a line: the happy face came, so an angry bubble goes away with the angry face
export type SayExtra = { filled: number; total: number; done: boolean };
const PRESS_S = 0.6; // the whole reach-press-return; the theme flips halfway
const CLICKS_KEY = "bobby-clicks";

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

type State = {
  squash: number; vel: number; hurtT: number; pet: number; surpriseT: number;
  glanceT: number; glance: [number, number]; mood: Mood; shake: number;
  pressT0: number; pressed: boolean; happyT: number; pokeAt: boolean; behind: boolean; shade: number;
  holdUntil: number; framed: boolean; walking: number; lastMode: string; nextIdle: number; petSaid: number;
  /** poked since the last time a stroke made him happy: that first happy stroke speaks at once */
  needsSoothe: boolean; petFace: boolean;
  sleep: SleepStage | null; idleSaid: number;
};

type SceneProps = {
  onContextLost?: () => void; dark: boolean; onToggle: () => void; onSwitchClick: () => void; press: MutableRefObject<PressRequest>;
  pointer: MutableRefObject<Pointer>; still: boolean; th: MutableRefObject<Throw>; anchor: MutableRefObject<Anchor>;
  layout: MutableRefObject<Layout>; onBehind: (behind: boolean) => void; onFirstFrame?: () => void;
  onSay?: (what: Say, extra?: SayExtra) => void;
  /** greeting wave: the left hand waves until this time (performance.now ms) */
  greet: MutableRefObject<number>;
};

function readClicks(): number {
  try {
    return Number(sessionStorage.getItem(CLICKS_KEY)) || 0;
  } catch {
    return 0;
  }
}
function writeClicks(n: number) {
  try {
    sessionStorage.setItem(CLICKS_KEY, String(n));
  } catch {
    // private mode: the count lives only in memory for this visit
  }
}

function Plush({ dark, onToggle, onSwitchClick, press, pointer, still, th, layout, onBehind, onFirstFrame, onSay, greet }: SceneProps) {
  const feel = useRef(createFeel());
  const zzz = useRef<Zzz>({ count: 0, nextAt: 0 });
  const carrier = useRef<THREE.Group>(null);
  const scene = useRef<THREE.Group>(null);
  const drool = useRef<THREE.Mesh>(null);
  const clicks = useRef<number | null>(null); // clicks this visit, towards the secret
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
    squash: 1, vel: 0, hurtT: 0, pet: 0, surpriseT: 0, glanceT: 0,
    glance: [0, 0], mood: "normal", shake: 0, pressT0: -10, pressed: false, happyT: 0, pokeAt: false, behind: false, shade: 1, holdUntil: 0, framed: false, walking: 0, lastMode: "home", nextIdle: 18, petSaid: -100, needsSoothe: false, petFace: false, sleep: null, idleSaid: 0,
  });

  useFrame((state, delta) => {
    const s = st.current;
    const p = pointer.current;
    const t = state.clock.elapsedTime;
    if (!float.current || !body.current || !eyesPivot.current || !shadow.current || !rocker.current || !carrier.current || !scene.current || !drool.current) return;

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
    const wantsSwitch = (press.current.pending > 0 && !away) || t < s.holdUntil;
    // while he is out (held, flying, dizzy, running home) the walk freezes, so scrolling the page
    // does not drag him along; once home he walks on to where the scroll wants him
    const walkTo = away ? L.walk : still || wantsSwitch ? 0 : -walkOffsetPx(L.progress, state.size.height) / PPU;
    const before = L.walk;
    L.walk = still ? 0 : damp(L.walk, walkTo, wantsSwitch && !away ? 9 : 4.5, delta);
    L.moving = Math.abs(walkTo - L.walk) > 0.004;
    s.walking = damp(s.walking, Math.min(1, Math.abs(L.walk - before) / Math.max(delta, 1e-3) / 2), 10, delta);
    carrier.current.position.set(f.x, f.y + L.walk, 0);
    L.headX = (L.rootX - 0.45 + f.x + float.current.position.x) * PPU;
    L.headY = -(L.rootY + 0.05 + f.y + L.walk + float.current.position.y + 1.3) * PPU;
    const behind = f.mode === "running";
    if (behind !== s.behind) {
      s.behind = behind;
      onBehind(behind);
    }

    // pokes resolve here so every timer shares the frame clock
    if (s.pokeAt) {
      s.pokeAt = false;
      s.hurtT = t + 0.8;
    }
    const lvl = levelOf(angerAt(feel.current, t));
    // bubbles for what just happened (the stage rate-limits and picks the words)
    if (f.mode !== s.lastMode) {
      if (f.mode === "flying" && s.lastMode === "held") onSay?.("thrown");
      if (f.mode === "dizzy") onSay?.("landed");
      s.lastMode = f.mode;
    }
    // he chats now and then by himself; the third line teases the secret (🥚?), never the first
    if (t > s.nextIdle) {
      s.nextIdle = t + 20 + Math.random() * 15;
      if (!away && lvl === 0 && !s.sleep && s.idleSaid < 6) {
        s.idleSaid += 1; // a few lines per visit, not forever
        onSay?.("idle");
      }
    }
    // light switch: 1 s timeline (look, reach, press, come back); the theme flips at the press
    // a request that comes during a press waits for it to end (it used to be dropped, and the
    // light never changed)
    if (press.current.pending > 0 && (away || (Math.abs(L.walk) < 0.04 && t - s.pressT0 > PRESS_S))) {
      press.current.pending -= 1;
      press.current.at = performance.now();
      s.holdUntil = t + PRESS_S + 0.6; // stays by the switch for the press and a moment after
      if (away) {
        // away from the switch: the theme flips at once, no reach
        onToggle();
        s.happyT = t + 2.4;
      } else {
        s.pressT0 = t;
        s.pressed = false;
      }
    }
    const pp = (t - s.pressT0) / PRESS_S;
    const pressing = pp >= 0 && pp < 1;
    if (pressing && pp >= 0.5 && !s.pressed) {
      s.pressed = true;
      s.happyT = t + 2.4; // pleased with himself after every press
      onSay?.(dark ? "switchOn" : "switchOff");
      onToggle();
      s.vel -= 0.9;
    }

    const idleFor = (performance.now() - p.lastMove) / 1000;
    if (s.sleep && idleFor < 0.2 && p.speed > 0.02) {
      s.surpriseT = t + 1.1; // woken up
      if (s.sleep === "asleep" || s.sleep === "drop") onSay?.("wake");
    }
    const petting = s.pet > 0.35;
    // the petting face just came: an angry bubble must not outlive the angry face
    if (petting && !s.petFace) onSay?.("hush");
    s.petFace = petting;
    const waving = performance.now() < greet.current; // hello when he first shows up
    let mood: Mood = "normal";
    if (pressing) mood = "normal";
    else if (f.mode === "held" || f.mode === "flying") mood = "susto";
    else if (f.mode === "dizzy") mood = "dor";
    else if (petting || waving) mood = "feliz"; // a stroke shows at once, even mid-tantrum (it also calms him)
    else if (lvl === 4) mood = "furioso";
    else if (lvl === 3) mood = "bravo";
    else if (lvl === 2) mood = "irritado";
    else if (t < s.hurtT) mood = "dor";
    else if (t < s.surpriseT) mood = "susto";
    else if (t < s.happyT) mood = "feliz";
    else if (idleFor > SLEEPY_AFTER && s.walking < 0.05 && !L.moving) mood = "sono"; // walking with the scroll wakes him up
    // falling asleep: yawn, nod off and jolt awake twice, then out for good (sleep.ts)
    const pose = mood === "sono" && !still ? sleepPose(idleFor - SLEEPY_AFTER) : null;
    const stage = pose?.stage ?? null;
    const said = sleepLine(s.sleep, stage);
    if (said && said !== "asleep") onSay?.(said);
    if (zzzNow(zzz.current, stage, said, idleFor < SLEEPY_AFTER, t)) onSay?.("asleep"); // at most 3 per nap (sleep.ts)
    s.sleep = stage;
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
    if ((mood === "normal" || mood === "irritado" || mood === "bravo") && t % 3.8 > 3.68) e.open = Math.min(e.open, 0.08);
    if (pose) {
      e.open = damp(e.open, pose.open, pose.stage === "jolt" ? 30 : 9, delta);
      if (pose.stage === "jolt") e.lidO = damp(e.lidO, 0.3, 30, delta); // eyes pop wide open
    }

    // body language (no idle motion when the visitor asked for less motion)
    const motion = still ? 0 : 1;
    const bob = Math.sin(t * 1.6 * (mood === "sono" ? 0.55 : 1)) * (mood === "sono" ? 0.03 : 0.06) * motion;
    const hop = f.mode === "running" ? Math.abs(Math.sin(t * 16)) * 0.1 : s.walking > 0.15 ? Math.abs(Math.sin(t * 13)) * 0.07 * s.walking * motion : mood === "feliz" ? Math.abs(Math.sin(t * 7)) * 0.07 * motion : 0;
    float.current.position.y = 0.05 + bob + hop;
    s.vel += (1 - s.squash) * 170 * delta;
    s.vel *= Math.exp(-8 * delta);
    s.squash += s.vel * delta;
    const sy = s.squash * (1 + Math.sin(t * 1.6 + 1.2) * 0.012 * motion) * (1 + (pose?.yawn ?? 0) * 0.09);
    body.current.scale.set(1 + (1 - sy) * 0.65, sy, 1 + (1 - sy) * 0.65);
    s.shake = Math.max(0, s.shake - delta * 2.5);
    const tremble = (mood === "furioso" ? Math.sin(t * 62) * 0.03 : mood === "bravo" ? Math.sin(t * 48) * 0.012 : 0) * motion;
    body.current.position.x = Math.sin(t * 55) * 0.04 * s.shake * motion + tremble;
    const rz = mood === "feliz" ? Math.sin(t * 7) * 0.12 * motion : mood === "sono" ? 0.16 : 0;
    const rx = mood === "furioso" ? 0.22 : mood === "bravo" ? 0.14 : mood === "irritado" ? 0.06 : pose ? pose.nod : mood === "sono" ? 0.12 : 0;
    const lean = pressing && pp < 0.8;
    const tilt = away ? THREE.MathUtils.clamp(-f.vx * 0.015, -0.5, 0.5) : rz;
    body.current.rotation.z = damp(body.current.rotation.z, lean ? -0.13 : tilt, 8, delta);
    float.current.position.x = damp(float.current.position.x, lean ? 0.22 : 0, 6, delta);
    body.current.rotation.x = damp(body.current.rotation.x, rx, pose?.stage === "jolt" ? 20 : 6, delta);
    // a drop of drool at the corner of the face while he sleeps
    const dr = pose?.drool ?? 0;
    drool.current.visible = dr > 0.02;
    drool.current.scale.set(0.05 + 0.03 * dr, 0.06 + 0.1 * dr, 0.05);
    shadow.current.scale.setScalar(1.3 - (bob + hop) * 1.4);
    s.shade = damp(s.shade, away ? 0 : 1, 10, delta);
    (shadow.current.material as THREE.MeshBasicMaterial).opacity = (0.9 - (bob + hop) * 2) * s.shade;

    // hands; the right one reaches for the raised half of the rocker during a press
    const sceneRoot = scene.current;
    hands.current.forEach((h, i) => {
      if (!h || !h.parent) return;
      const sd = i === 0 ? -1 : 1;
      let y = -0.36, x = sd * 1.02, z = 0.22;
      if (mood === "feliz") y = -0.2 + (sd > 0 ? Math.sin(t * 10) * 0.12 * motion : 0);
      if (mood === "susto") { y = 0.15; x = sd * 1.05; }
      if (mood === "irritado") { y = -0.3; x = sd * 0.86; z = 0.5; } // arms crossed, more or less
      if (mood === "bravo") { y = -0.42 + Math.sin(t * 40 + sd) * 0.015 * motion; x = sd * 0.98; z = 0.32; }
      if (mood === "furioso") { y = 0.12 + Math.sin(t * 30 + sd * 2) * 0.06 * motion; x = sd * 1.0; z = 0.38; } // fists up
      if (mood === "sono") { y = -0.5 + (pose?.yawn ?? 0) * 0.75; x = sd * (0.96 + (pose?.yawn ?? 0) * 0.12); }
      if (mood === "dor") { y = -0.05; x = sd * 0.9; z = 0.45; }
      let kk = 10;
      if (waving && sd < 0 && !pressing) {
        // hand up beside the head, waving side to side
        y = 0.46; x = sd * (1.06 + Math.sin(t * 13) * 0.12 * motion); z = 0.3;
        kk = 16;
      }
      if (sd > 0 && pressing && pp < 0.66) {
        const up = (s.pressed ? (dark ? 0.07 : -0.07) : dark ? -0.07 : 0.07) * SW_SCALE;
        tmp.set(SW.x + 0.07 * SW_SCALE, SW.y + up, SW.z + 0.2 * SW_SCALE);
        // SW lives in this scene's space, which the view rig moves around the screen: take it to
        // world space before going into the hand's (treating it as world sent the hand far left)
        sceneRoot.updateWorldMatrix(true, false);
        sceneRoot.localToWorld(tmp);
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
    const before = levelOf(angerAt(feel.current, clock.elapsedTime));
    const lvl = addPoke(feel.current, clock.elapsedTime);
    s.vel -= 3 + lvl * 0.6;
    s.shake = Math.min(1.6, 0.8 + lvl * 0.2);
    s.pokeAt = true;
    s.needsSoothe = true;
    if (clicks.current === null) clicks.current = readClicks();
    clicks.current += 1;
    writeClicks(clicks.current);
    const egg = eggProgress(clicks.current);
    if (egg) onSay?.("eggStep", egg); // the secret filling up beats any other line
    else if (lvl > before) onSay?.(lvl === 4 ? "egg" : lvl >= 2 ? "angry" : "poke");
    else if (lvl === 4) onSay?.("angry"); // still poking him while furious: the lines keep escalating
  };
  const petMove = (ev: ThreeEvent<PointerEvent>) => {
    const s = st.current;
    if (th.current.mode !== "home") return;
    if (stroke(feel.current, ev.nativeEvent.clientX, ev.nativeEvent.clientY)) {
      s.pet = Math.min(1.4, s.pet + 0.3);
      calm(feel.current, clock.elapsedTime);
      if (s.needsSoothe && s.pet > 0.35) {
        // the first stroke that cheers him up after the pokes answers at once (one urgent line)
        s.needsSoothe = false;
        s.petSaid = clock.elapsedTime;
        onSay?.("soothed");
      } else if (s.pet > 0.5 && clock.elapsedTime - s.petSaid > 8) {
        s.petSaid = clock.elapsedTime;
        onSay?.("pet");
      }
    }
  };
  const petEnd = () => endStroke(feel.current);

  return (
    <group ref={scene}>
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
              <Strands radius={0.92} count={20000} length={0.2} width={0.012} color={BODY} gain={GAIN} faceTrim={0.3} still={still} onClick={poke} onPointerMove={petMove} onPointerDown={grab} onPointerOver={hover(true)} onPointerOut={(e) => (hover(false)(e), petEnd())} />
              <mesh ref={drool} position={[0.36, -0.3, 0.9]} visible={false}>
                <sphereGeometry args={[1, 16, 12]} />
                <meshStandardMaterial color="#cfe3f2" roughness={0.1} metalness={0.1} transparent opacity={0.85} />
              </mesh>
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
function FrameDriver({ pointer, press, still, th, layout, greet }: { pointer: MutableRefObject<Pointer>; press: MutableRefObject<PressRequest>; still: boolean; th: MutableRefObject<Throw>; layout: MutableRefObject<Layout>; greet: MutableRefObject<number> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const busy = th.current.mode !== "home" || layout.current.moving || now - pointer.current.lastMove < 2500 || press.current.pending > 0 || now - press.current.at < 4000 || now < greet.current;
      const gap = busy ? 0 : still ? 1000 : 1000 / 24;
      if (now - last >= gap) {
        last = now;
        invalidate();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, pointer, press, still, th, layout, greet]);
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
      <FrameDriver pointer={scene.pointer} press={scene.press} still={scene.still} th={scene.th} layout={scene.layout} greet={scene.greet} />
      <ViewRig anchor={scene.anchor} root={root} th={scene.th} layout={scene.layout} />
      <group ref={root}>
        <Plush {...scene} />
      </group>
    </Canvas>
  );
}
