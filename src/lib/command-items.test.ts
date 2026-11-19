import { describe, expect, it } from "vitest";
import { projectLinks } from "./command-items";
import { projects } from "./projects";

describe("projectLinks", () => {
  it("lists only the links each project has, online before code", () => {
    const links = projectLinks([
      { id: "portfolio", name: "A", online: "https://a.dev", code: "https://github.com/a" },
      { id: "juridique", name: "B", code: "https://github.com/b" },
      { id: "banestes", name: "C" },
    ]);
    expect(links).toEqual([
      { key: "portfolio-online", name: "A", kind: "online", href: "https://a.dev" },
      { key: "portfolio-code", name: "A", kind: "code", href: "https://github.com/a" },
      { key: "juridique-code", name: "B", kind: "code", href: "https://github.com/b" },
    ]);
  });

  it("gives unique keys for the real project list", () => {
    const keys = projectLinks(projects).map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
