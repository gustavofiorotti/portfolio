import { describe, expect, it } from "vitest";
import { counterValues, filterProjects, projects, techs, toggleTech } from "./projects";

const names = (list: readonly { name: string }[]) => list.map((p) => p.name);

describe("filterProjects", () => {
  it("keeps every project when nothing is selected", () => {
    expect(filterProjects(projects, [])).toHaveLength(projects.length);
  });

  it("keeps the projects that have the selected tech", () => {
    expect(names(filterProjects(projects, ["Tailwind CSS"]))).toEqual(["Portfólio", "UVVendas"]);
  });

  it("requires ALL the selected techs (AND, not OR)", () => {
    expect(names(filterProjects(projects, ["React", "Vitest"]))).toEqual(["Mão na Obra"]);
    expect(names(filterProjects(projects, ["React", "TypeScript"]))).toEqual(["Mão na Obra", "UVVendas", "Banestes"]);
  });

  it("returns nothing for a combination no project has", () => {
    expect(filterProjects(projects, ["Python", "React"])).toEqual([]);
  });

  it("only offers techs used by some project", () => {
    for (const tech of techs) expect(filterProjects(projects, [tech]).length).toBeGreaterThan(0);
  });
});

describe("toggleTech", () => {
  it("adds and removes a tech keeping the order", () => {
    expect(toggleTech(["React"], "Vitest")).toEqual(["React", "Vitest"]);
    expect(toggleTech(["React", "Vitest"], "React")).toEqual(["Vitest"]);
  });
});

describe("counterValues", () => {
  it("pads numbers to two digits", () => {
    expect(counterValues(2, 5)).toEqual({ shown: "02", total: "05" });
    expect(counterValues(12, 12)).toEqual({ shown: "12", total: "12" });
  });
});
