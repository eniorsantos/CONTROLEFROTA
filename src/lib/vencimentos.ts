import type { LinhaPrototipo, OnibusPainel, Semaforo } from "./tipos";

export const ORDEM_POS: Record<string, number> = { Traseira: 0, Backseat: 1, Institucional: 2 };

export function startOfToday(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function fmtBR(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

export function diasParaFim(fimISO: string, hoje = startOfToday()): number | null {
  if (!fimISO) return null;
  const fim = new Date(fimISO + "T00:00:00");
  return Math.round((fim.getTime() - hoje.getTime()) / 86400000);
}

export function temAnuncio(r: Pick<LinhaPrototipo, "t" | "b" | "p" | "i" | "c">): boolean {
  return Boolean(r.t || r.b || r.p || r.i || r.c);
}

/** Regra §4.2 + RF7: semáforo calculado. Nunca depende só de cor (sempre tem texto). */
export function situacao(r: Pick<LinhaPrototipo, "t" | "b" | "p" | "i" | "c" | "f">, hoje = startOfToday()): { s: Semaforo; x: number | null } {
  const x = r.f ? diasParaFim(r.f, hoje) : null;
  if (!temAnuncio(r)) return { s: "Disponível", x };
  if (x === null) return { s: "Sem data", x };
  if (x < 0) return { s: "Vencido", x };
  if (x <= 7) return { s: "Vence em 7 dias", x };
  return { s: "Em campanha", x };
}

/** Monta ads ordenados por fim; principal = vence primeiro; empate: traseira > backseat > institucional. */
export function montarPainel(rows: LinhaPrototipo[], hoje = startOfToday()): OnibusPainel[] {
  return rows.map((r) => {
    const { s, x } = situacao(r, hoje);
    const code = (r.l || "").split("-")[0].trim();
    const ads = [
      { pos: "Traseira", nome: r.t, f: r.f },
      { pos: "Backseat", nome: r.b, f: r.f },
      { pos: "Institucional", nome: r.c, f: r.f }
    ]
      .filter((a) => a.nome)
      .sort((a, b) => {
        if (a.f !== b.f) return a.f > b.f ? 1 : -1;
        return (ORDEM_POS[a.pos] ?? 9) - (ORDEM_POS[b.pos] ?? 9);
      });
    return { ...r, s, x, code, ads, m: ads[0]?.nome ?? "", q: ads.map((a) => a.nome).join(" ") };
  });
}

export function fimVeiculacao(inicioISO: string, periodoDias: number): string {
  // RN1: fim = início + período (não digitado)
  const [y, m, d] = inicioISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + periodoDias);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}
