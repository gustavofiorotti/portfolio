/** Section ids shared by the header nav and the page sections. */
export const SECTION_IDS = ["projetos", "experiencia", "sobre", "contato"] as const;
export type SectionId = (typeof SECTION_IDS)[number] | "topo";

/**
 * Which section the reader is in: the last one whose top passed the header line.
 * At the very bottom of the page the last section wins, even if it is short.
 */
export function activeSection(tops: Record<string, number>, atBottom: boolean, line = 180): SectionId {
  if (atBottom) return "contato";
  let active: SectionId = "topo";
  for (const id of SECTION_IDS) {
    if (tops[id] !== undefined && tops[id] < line) active = id;
  }
  return active;
}
