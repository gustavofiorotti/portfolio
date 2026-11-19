import { describe, expect, it } from "vitest";
import { BOBBY_FUR, bobbyFur } from "./bobby-fur";

describe("bobbyFur", () => {
  it("production always keeps the current coat, whatever the URL says", () => {
    expect(bobbyFur("?pelo=grosso", false)).toBe(BOBBY_FUR.atual);
  });

  it("in development ?pelo= picks a variant, and an unknown name falls back to the current one", () => {
    expect(bobbyFur("?pelo=grosso", true)).toBe(BOBBY_FUR.grosso);
    expect(bobbyFur("?pelo=intermediario", true)).toBe(BOBBY_FUR.intermediario);
    expect(bobbyFur("?pelo=xyz", true)).toBe(BOBBY_FUR.atual);
    expect(bobbyFur("", true)).toBe(BOBBY_FUR.atual);
  });

  it("thicker variants trade strands for width and length", () => {
    const { atual, intermediario, grosso } = BOBBY_FUR;
    expect(grosso.count).toBeLessThan(intermediario.count);
    expect(intermediario.count).toBeLessThan(atual.count);
    expect(grosso.width).toBeGreaterThan(intermediario.width);
    expect(grosso.length).toBeGreaterThan(intermediario.length);
  });
});
