import { describe, expect, it } from "vitest";
import { MORPHS } from "./MorphIcon";

const shape = (d: string) => d.replace(/-?\d*\.?\d+/g, "n");

describe("morph pairs", () => {
  it("share the same commands, so every number has a partner", () => {
    for (const { from, to } of Object.values(MORPHS)) expect(shape(to)).toBe(shape(from));
  });
});
