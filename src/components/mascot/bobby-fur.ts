/**
 * Bobby's coat, with variants to compare (Gustavo, 18/11): he is small on screen, so many fine
 * strands blur into a smooth surface; fewer, thicker and longer ones may read more like a plush.
 * Production always uses "atual". In development, ?pelo=intermediario or ?pelo=grosso swaps it.
 */
export type Fur = { count: number; length: number; width: number };

export const BOBBY_FUR = {
  atual: { count: 20000, length: 0.2, width: 0.022 },
  intermediario: { count: 9000, length: 0.25, width: 0.033 },
  grosso: { count: 4500, length: 0.3, width: 0.047 },
} satisfies Record<string, Fur>;

export type FurName = keyof typeof BOBBY_FUR;

/** The variant named in the URL (?pelo=…), development only; anything else is the current coat. */
export function bobbyFur(search: string, dev: boolean): Fur {
  if (!dev) return BOBBY_FUR.atual;
  const name = new URLSearchParams(search).get("pelo");
  return name && name in BOBBY_FUR ? BOBBY_FUR[name as FurName] : BOBBY_FUR.atual;
}
