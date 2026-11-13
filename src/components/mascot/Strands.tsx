"use client";
import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'

// Real strands: each hair is a thin ribbon (SEG segments) that always faces the
// camera, tapers to the tip, curves with gravity and its own random curl.
// All strands share one InstancedBufferGeometry, so the whole coat is one draw call.
// Lighting uses Kajiya-Kay (light along the strand tangent), which is what makes
// hair read as hair instead of noise.
const SEG = 5

const vertex = /* glsl */ `
  attribute float aT;      // 0 at the root, 1 at the tip
  attribute float aSide;   // -1 / 1, the two edges of the ribbon
  attribute vec3 aDir;     // root direction on the unit sphere
  attribute vec4 aRnd;     // length, curl phase, width, shade
  uniform float uRadius;
  uniform float uLength;
  uniform float uWidth;
  uniform float uTime;
  uniform vec3 uGravity;
  uniform float uSquash;
  uniform float uFaceTrim;
  varying float vT;
  varying vec3 vTangent;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vShade;
  varying float vFront;

  vec3 strandPos(float t) {
    // plush toys have the face trimmed short, so the felt eyes sit on top
    float len = uLength * aRnd.x * mix(1.0, uFaceTrim, smoothstep(0.3, 0.75, aDir.z));
    vec3 up = abs(aDir.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 b1 = normalize(cross(aDir, up));
    vec3 b2 = cross(aDir, b1);
    float curl = aRnd.y * 6.2831;
    vec3 sway = (b1 * cos(curl + t * 2.5) + b2 * sin(curl + t * 2.5)) * t * t * len * 0.3;
    vec3 wind = vec3(sin(uTime * 1.4 + aDir.y * 6.0), 0.0, cos(uTime * 1.1 + aDir.x * 6.0)) * t * t * len * 0.06;
    vec3 p = aDir * (uRadius + len * t) + uGravity * t * t * len + sway + wind;
    p.y *= uSquash;
    p.xz *= 1.0 + (1.0 - uSquash) * 0.65;
    return p;
  }

  void main() {
    float t = aT;
    vec3 p = strandPos(t);
    vec3 tangent = normalize(strandPos(min(t + 0.05, 1.0)) - strandPos(max(t - 0.05, 0.0)));
    vec4 worldP = modelMatrix * vec4(p, 1.0);
    vec3 T = normalize(mat3(modelMatrix) * tangent);
    vec3 V = normalize(cameraPosition - worldP.xyz);
    vec3 side = normalize(cross(T, V));
    float w = uWidth * aRnd.z * (1.0 - t * 0.92);
    worldP.xyz += side * aSide * w;
    vT = t;
    vTangent = T;
    vNormal = normalize(mat3(modelMatrix) * aDir);
    vView = V;
    vShade = aRnd.w;
    vFront = aDir.z;
    gl_Position = projectionMatrix * viewMatrix * worldP;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uTipColor;
  uniform vec3 uRimColor;
  uniform float uRim;
  varying float vFront;
  varying float vT;
  varying vec3 vTangent;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vShade;
  void main() {
    vec3 L = normalize(vec3(-0.45, 0.85, 0.6));
    vec3 T = normalize(vTangent);
    vec3 N = normalize(vNormal);
    // Kajiya-Kay diffuse and two shifted specular lobes
    float TdotL = dot(T, L);
    float diff = sqrt(max(0.0, 1.0 - TdotL * TdotL));
    float wrap = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
    vec3 H = normalize(L + vView);
    vec3 T1 = normalize(T + N * 0.12);
    vec3 T2 = normalize(T - N * 0.18);
    float d1 = dot(T1, H), d2 = dot(T2, H);
    float spec1 = pow(sqrt(max(0.0, 1.0 - d1 * d1)), 90.0);
    float spec2 = pow(sqrt(max(0.0, 1.0 - d2 * d2)), 18.0);
    // roots sit in the shadow of the coat, tips catch the light
    float ao = mix(0.38, 1.0, smoothstep(0.0, 0.85, vT));
    // optional two-tone coat: darker ring around a brighter face, like the 2D logo
    vec3 face = mix(uColor, uTipColor, vT * 0.5);
    vec3 ring = uRimColor * mix(1.0, 1.15, vT);
    vec3 base = mix(face, mix(ring, face, smoothstep(0.5, 0.64, vFront)), uRim) * mix(0.82, 1.12, vShade);
    vec3 col = base * (0.22 + 0.95 * diff * wrap) * ao;
    col += vec3(1.0, 0.94, 0.9) * spec1 * 0.1 * wrap + base * spec2 * 0.28 * wrap;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

function buildGeometry(count: number, seed: number) {
  const base = new THREE.InstancedBufferGeometry()
  const t: number[] = [], side: number[] = [], idx: number[] = []
  for (let i = 0; i <= SEG; i++) {
    t.push(i / SEG, i / SEG)
    side.push(-1, 1)
    if (i < SEG) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  base.setAttribute('position', new THREE.Float32BufferAttribute(new Array(t.length * 3).fill(0), 3))
  base.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1))
  base.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1))
  base.setIndex(idx)
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const dir = new Float32Array(count * 3), r = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    // even spread over the sphere (Fibonacci) with a little jitter
    const y = 1 - ((i + 0.5) / count) * 2
    const rad = Math.sqrt(1 - y * y)
    const th = i * 2.399963 + rnd() * 0.3
    const v = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad).normalize()
    dir.set([v.x, v.y, v.z], i * 3)
    r.set([0.7 + rnd() * 0.3, rnd(), 0.7 + rnd() * 0.6, rnd()], i * 4)
  }
  base.setAttribute('aDir', new THREE.InstancedBufferAttribute(dir, 3))
  base.setAttribute('aRnd', new THREE.InstancedBufferAttribute(r, 4))
  base.instanceCount = count
  base.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2)
  return base
}

type StrandsProps = ThreeElements['group'] & {
  radius?: number
  count?: number
  length?: number
  width?: number
  color?: string
  tipColor?: string
  rimColor?: string
  squash?: MutableRefObject<number>
  seed?: number
  faceTrim?: number
  /** reduced motion: the coat stops swaying */
  still?: boolean
}

export function Strands({ radius = 1, count = 26000, length = 0.22, width = 0.012, color = '#C41E1A', tipColor, rimColor, squash, seed = 7, faceTrim = 1, still = false, ...props }: StrandsProps) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const geo = useMemo(() => buildGeometry(count, seed), [count, seed])
  const uniforms = useMemo(
    () => ({
      uRadius: { value: radius },
      uLength: { value: length },
      uWidth: { value: width },
      uTime: { value: 0 },
      uGravity: { value: new THREE.Vector3(0, -0.45, 0) },
      uSquash: { value: 1 },
      uFaceTrim: { value: faceTrim },
      uColor: { value: new THREE.Color(color) },
      uTipColor: { value: new THREE.Color(tipColor || color) },
      uRimColor: { value: new THREE.Color(rimColor || color) },
      uRim: { value: rimColor ? 1 : 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; updated through the material below
    [],
  )
  // the uniforms prop is copied on mount, so live values go to the material's own uniforms
  // colors are computed once per prop change, not every frame
  const colors = useMemo(() => {
    const base = new THREE.Color(color)
    return { base, tip: tipColor ? new THREE.Color(tipColor) : base.clone().lerp(new THREE.Color('#fafaf9'), 0.06) }
  }, [color, tipColor])
  useFrame((state) => {
    const u = mat.current?.uniforms
    if (!u) return
    if (!still) u.uTime.value = state.clock.elapsedTime
    u.uLength.value = length
    u.uColor.value.copy(colors.base)
    u.uTipColor.value.copy(colors.tip)
    if (squash) u.uSquash.value = squash.current
  })
  return (
    <group {...props}>
      {/* the skin under the coat, so gaps between strands are never see-through */}
      <mesh>
        <sphereGeometry args={[radius * 1.005, 48, 32]} />
        <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(0.42)} />
      </mesh>
      <mesh geometry={geo} frustumCulled={false}>
        <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
