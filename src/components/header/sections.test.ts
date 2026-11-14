import { describe, expect, it } from "vitest";
import { activeSection } from "./sections";

describe("activeSection", () => {
  it("is the hero before any section reaches the header", () => {
    expect(activeSection({ projetos: 600, experiencia: 1400 }, false)).toBe("topo");
  });
  it("is the last section that passed the header line", () => {
    expect(activeSection({ projetos: -200, experiencia: 120, sobre: 900 }, false)).toBe("experiencia");
  });
  it("marks the last section at the bottom of the page", () => {
    expect(activeSection({ projetos: -900, sobre: 300 }, true)).toBe("contato");
  });
  it("ignores sections that are not on the page yet", () => {
    expect(activeSection({}, false)).toBe("topo");
  });
});
