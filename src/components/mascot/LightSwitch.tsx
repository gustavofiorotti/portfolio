"use client";
import { useMemo, type MutableRefObject } from "react";
import * as THREE from "three";

export const SW = new THREE.Vector3(1.15, 0.05, 0); // where the wall switch sits
export const SW_SCALE = 1.6; // the switch read too small next to him

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

/** Wall switch: a plate and a rocker that tips to show which half is up. */
export function LightSwitch({ dark, rocker, plate, onPress }: { dark: boolean; rocker: MutableRefObject<THREE.Group | null>; plate: MutableRefObject<THREE.Group | null>; onPress: () => void }) {
  const geo = useMemo(() => {
    const ex = (w: number, h: number, r: number, depth: number, bevel: boolean) =>
      new THREE.ExtrudeGeometry(roundedRect(w, h, r), { depth, bevelEnabled: bevel, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 10 });
    return { plate: ex(0.5, 0.78, 0.11, 0.05, true), well: ex(0.26, 0.46, 0.07, 0.02, false), key: ex(0.22, 0.2, 0.06, 0.07, true) };
  }, []);
  return (
    <group ref={plate} position={SW} scale={SW_SCALE} onClick={(e) => (e.stopPropagation(), onPress())}>
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
