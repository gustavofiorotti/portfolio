import type { Project } from "./projects";

export type ProjectLink = { key: string; name: string; kind: "online" | "code"; href: string };

/** One palette entry per link a project really has: "online" first, then "code". */
export function projectLinks(list: readonly Pick<Project, "id" | "name" | "online" | "code">[]): ProjectLink[] {
  return list.flatMap((p) => [
    ...(p.online ? [{ key: `${p.id}-online`, name: p.name, kind: "online" as const, href: p.online }] : []),
    ...(p.code ? [{ key: `${p.id}-code`, name: p.name, kind: "code" as const, href: p.code }] : []),
  ]);
}
