"use client";
import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// The eye is a flat felt shape drawn with a signed distance field. Every
// expression is a set of numbers (openness, lid angle, smile carve, chevron),
// so moving between expressions morphs the shape instead of swapping meshes.
const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpen;   // 1 open, ~0 closed (blink)
  uniform float uWidth;  // horizontal scale (surprise makes it rounder)
  uniform float uLidA;   // lid angle: + = angry (inner side down), - = sad (outer side down)
  uniform float uLidO;   // lid height; high = no lid
  uniform float uHappy;  // 0..1 carves the bottom into an arch (^)
  uniform float uHurt;   // 0..1 morphs into a chevron (> <)
  uniform float uSide;   // -1 left eye, 1 right eye
  varying vec2 vUv;

  float sdSeg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec2 p = (vUv - 0.5) * 0.6;
    float open = max(uOpen, 0.07);
    // oval like the logo's eyes (2.5 x 3.6), not the grok bot's straight-sided pill
    vec2 r = vec2(0.13 * uWidth, 0.188 * open);
    float d = (length(p / r) - 1.0) * min(r.x, r.y);
    // lid: cut everything above a tilted line
    float a = uLidA * uSide;
    vec2 n = vec2(-sin(a), cos(a));
    d = max(d, dot(p - vec2(0.0, uLidO), n));
    // smile: a growing circle eats the bottom, leaving an arch
    d = max(d, -(length(p - vec2(0.0, -0.19)) - 0.19 * uHappy));
    // hurt: blend towards a chevron pointing at the nose
    float s = uSide;
    float chev = min(sdSeg(p, vec2(0.075 * s, 0.09), vec2(-0.065 * s, 0.0)),
                     sdSeg(p, vec2(-0.065 * s, 0.0), vec2(0.075 * s, -0.09))) - 0.034;
    d = mix(d, chev, uHurt);
    float aa = fwidth(d) * 0.9 + 0.0008;
    float alpha = 1.0 - smoothstep(-aa, aa, d);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`

export type EyeShape = { open: number; width: number; lidA: number; lidO: number; happy: number; hurt: number }

export function Eye({ side, color, expr }: { side: number; color: string; expr: MutableRefObject<EyeShape> }) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uOpen: { value: 1 },
      uWidth: { value: 1 },
      uLidA: { value: 0 },
      uLidO: { value: 0.3 },
      uHappy: { value: 0 },
      uHurt: { value: 0 },
      uSide: { value: side },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; updated through the material below
    [],
  )
  const mat = useRef<THREE.ShaderMaterial>(null)
  // write into the material's own uniforms: the uniforms prop is copied on mount,
  // so changing the original object later would not reach the shader
  useFrame(() => {
    const e = expr.current
    const u = mat.current?.uniforms
    if (!u) return
    u.uOpen.value = e.open
    u.uWidth.value = e.width
    u.uLidA.value = e.lidA
    u.uLidO.value = e.lidO
    u.uHappy.value = e.happy
    u.uHurt.value = e.hurt
    u.uColor.value.set(color)
  })
  return (
    <mesh>
      <planeGeometry args={[0.6, 0.6]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  )
}

// target shape for each mood; the character eases towards these every frame
export const MOODS: Record<string, EyeShape> = {
  normal: { open: 1, width: 1, lidA: 0, lidO: 0.3, happy: 0, hurt: 0 },
  feliz: { open: 1, width: 1.05, lidA: 0, lidO: 0.3, happy: 1, hurt: 0 },
  dor: { open: 1, width: 1, lidA: 0, lidO: 0.3, happy: 0, hurt: 1 },
  bravo: { open: 1, width: 1.05, lidA: 0.6, lidO: 0.035, happy: 0, hurt: 0 },
  triste: { open: 0.9, width: 1, lidA: -0.45, lidO: 0.06, happy: 0, hurt: 0 },
  susto: { open: 1.28, width: 1.18, lidA: 0, lidO: 0.4, happy: 0, hurt: 0 },
  sono: { open: 1, width: 1.05, lidA: 0, lidO: -0.015, happy: 0, hurt: 0 },
}
