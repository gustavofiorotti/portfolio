import * as THREE from "three";

// Where the wall switch sits in Bobby's scene (scene units). The switch itself is the HTML button
// (switch.css), placed on the same screen spot; his hand reaches here.
//
// Desktop numbers (globals.css and switch.css, checked by switch-spot.test.ts): the stage box is
// 200 px wide at right 32 px, so its centre (the scene's x origin) is 132 px from the right edge;
// the 60 x 92 switch sits at right 16 px, its centre 46 px from the edge: 86 px right of the
// origin, 1.714 units at 50.18 px each. Bobby (at -0.45 units, hands out to ~1.3) then keeps a
// gap of about 14 px to the plate instead of touching it.
export const SW = new THREE.Vector3(1.714, 0.05, 0);

// The raised half of the rocker, where the hand presses: a quarter of the key's height above or
// below the centre. The key is 45 % (well) x 88 % (rocker) of the 92 px plate: 36.4 px, so 9.1 px.
export const PRESS_UP = 0.18; // units
