// Dimensions and colours of the 3D wall switch, in CSS px (it is drawn 1:1 over the HTML button),
// taken from switch.css so both versions are the same piece.
export const PLATE = { w: 60, h: 92, r: 13, depth: 5 };
/** the well: inset 27.5% (top/bottom) and 27% (sides) of the plate */
export const WELL = { w: 60 * 0.46, h: 92 * 0.45, r: 7, depth: 4 };
/** the rocker: inset 6% of the well */
export const KEY = { w: WELL.w * 0.88, h: WELL.h * 0.88, r: 5.4, depth: 4 };
/** tilt of the rocker (deg): resting, hovered, pressed down */
const TILT = { rest: 20, hover: 16, active: 6 };
/** extra room around the button for the plate's shadow */
export const PAD = 18;

export type SwitchColors = { plate: string; well: string; up: string; down: string; band: string; shadow: number };
export const COLORS: Record<"light" | "dark", SwitchColors> = {
  light: { plate: "#f7f6f3", well: "#e3e1dc", up: "#ffffff", down: "#cdc9c1", band: "#c41e1a", shadow: 0.34 },
  dark: { plate: "#2b2b30", well: "#121214", up: "#55555c", down: "#1f1f23", band: "#e0302a", shadow: 0.7 },
};

/** Rocker angle (deg, positive = top half raised = light theme) for a state. */
export function tiltFor(dark: boolean, hover: boolean, active: boolean): number {
  const a = active ? TILT.active : hover ? TILT.hover : TILT.rest;
  return dark ? -a : a;
}
