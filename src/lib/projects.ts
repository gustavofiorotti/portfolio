/** Project data that does not depend on the locale. Texts live in messages under `projects.items.<id>`. */
export type ProjectImage =
  | { kind: "self" }
  | { kind: "single"; src: string; fit: "cover" | "contain" }
  | { kind: "themed"; light: string; dark: string; fit: "cover" | "contain" };

export type Project = {
  id: "portfolio" | "juridique" | "maonaobra" | "uvvendas" | "banestes";
  name: string;
  tags: readonly string[];
  image: ProjectImage;
  online?: string;
  code?: string;
};

export const techs = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Three.js",
  "Python",
  "Flask",
  "SQL Server",
  "Gemini",
  "Vitest",
] as const;

export const projects: readonly Project[] = [
  {
    id: "portfolio",
    name: "Portfólio",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Three.js"],
    image: { kind: "self" },
    online: "https://gus.poke.site",
    code: "https://github.com/gustavofiorotti/portfolio",
  },
  {
    id: "juridique",
    name: "juridiQue",
    tags: ["Python", "Flask", "SQL Server", "Gemini"],
    image: { kind: "single", src: "/projects/juridique.png", fit: "cover" },
    code: "https://github.com/gustavofiorotti/juridiQue",
  },
  {
    id: "maonaobra",
    name: "Mão na Obra",
    tags: ["React", "TypeScript", "Vitest"],
    image: { kind: "single", src: "/projects/maonaobra.png", fit: "cover" },
    online: "https://maonaobra.vercel.app",
    code: "https://github.com/gustavofiorotti/MaonaObra",
  },
  {
    id: "uvvendas",
    name: "UVVendas",
    tags: ["React", "TypeScript", "Tailwind CSS"],
    image: { kind: "single", src: "/projects/uvvendas.png", fit: "contain" },
    online: "https://ecommerce-uvv.vercel.app",
    code: "https://github.com/MatheusBragaC/ecommerce-uvv",
  },
  {
    id: "banestes",
    name: "Banestes",
    tags: ["React", "TypeScript"],
    image: {
      kind: "themed",
      light: "/projects/banestes-light.png",
      dark: "/projects/banestes-dark.png",
      fit: "cover",
    },
    online: "https://gustavofiorotti.github.io/projetoBanestes",
    code: "https://github.com/gustavofiorotti/projetoBanestes",
  },
];

/** Keeps the projects that have ALL the selected techs; no selection keeps everything. */
export function filterProjects<T extends { tags: readonly string[] }>(list: readonly T[], selected: readonly string[]): T[] {
  return list.filter((p) => selected.every((tech) => p.tags.includes(tech)));
}

/** Adds the tech to the selection, or removes it when already selected. */
export function toggleTech(selected: readonly string[], tech: string): string[] {
  return selected.includes(tech) ? selected.filter((s) => s !== tech) : [...selected, tech];
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Values for the counter message: "05 projetos" or "02 de 05 projetos". */
export function counterValues(shown: number, total: number) {
  return { shown: pad2(shown), total: pad2(total) };
}
