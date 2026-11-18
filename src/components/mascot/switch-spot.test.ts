import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SW } from "./switch-spot";
import { PPU } from "./ViewRig";

const css = readFileSync("src/components/mascot/switch.css", "utf8");
const globals = readFileSync("src/app/globals.css", "utf8");
const px = (re: RegExp, src: string) => Number(src.match(re)![1]);

describe("porcelain switch on the 3D desktop", () => {
  it("sits on the switch's spot in Bobby's scene, so his hand lands on it", () => {
    // stage box (globals.css, ≥ 1024 px) and the switch button (switch.css)
    const desk = globals.slice(globals.indexOf("@media (min-width: 1024px) {\n  .mascot-stage"));
    const stageRight = px(/right:\s*(\d+)px/, desk), stageW = px(/\n\s+width:\s*(\d+)px/, desk), stageH = px(/\n\s+height:\s*(\d+)px/, desk);
    const stageTopOffset = px(/top:\s*calc\(50% - (\d+)px\)/, desk);
    const btn = css.slice(css.indexOf(".mascot-switch:not(.is-plain) {"));
    const right = px(/right:\s*(\d+)px/, btn), width = px(/\n\s+width:\s*(\d+)px/, btn);
    expect(btn).toMatch(/top:\s*50%;/);
    expect(btn).toMatch(/translateY\(-50%\)/);

    // ViewRig: scene origin at the stage center, 0.35 units lower; the switch at SW from there
    const centerFromRight = stageRight + stageW / 2 - SW.x * PPU;
    const centerFromMiddle = -stageTopOffset + stageH / 2 + 0.35 * PPU - SW.y * PPU;
    expect(Math.abs(right + width / 2 - centerFromRight)).toBeLessThan(2);
    expect(Math.abs(centerFromMiddle)).toBeLessThan(2);
  });
});
