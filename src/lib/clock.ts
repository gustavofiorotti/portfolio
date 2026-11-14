/** Brasília time as "HH:MM", independent of the visitor's time zone. */
export function brtTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/** Angles of the clock icon hands, in degrees, for an "HH:MM" string. */
export function handAngles(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(":").map((n) => Number(n) || 0);
  return { hour: (h % 12) * 30 + m * 0.5, minute: m * 6 };
}
