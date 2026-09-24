import type { OnibusPainel } from "./tipos";
export { montarPainel } from "./vencimentos";

/** RF8: consulta por linha, posição e período. Baixado sai da disponibilidade (RN6). */
export interface FiltroDisp { linha?: string; posicao?: "t" | "b" | "p" | "c"; de?: string; ate?: string; }

export function disponibilidade(rows: OnibusPainel[], f: FiltroDisp): OnibusPainel[] {
  return rows.filter((r) => {
    if (f.linha && r.code !== f.linha) return false;
    if (f.posicao) {
      const campo = { t: r.t, b: r.b, p: r.p, c: r.c }[f.posicao];
      if (campo) return false; // posição ocupada → não disponível
    }
    if (f.de && f.ate && r.f) {
      // ocupada no período solicitado → indisponível
      if (r.d && r.d < f.ate && f.de < r.f) return false;
    }
    return true;
  });
}

export function resumoPainel(rows: OnibusPainel[]) {
  const c = (p: (r: OnibusPainel) => boolean) => rows.filter(p).length;
  return {
    frota: rows.length,
    emCampanha: c((r) => r.s === "Em campanha"),
    vence7: c((r) => r.s === "Vence em 7 dias"),
    vencidos: c((r) => r.s === "Vencido"),
    disponiveis: c((r) => r.s === "Disponível"),
    semData: c((r) => r.s === "Sem data")
  };
}

export function ocupacaoPorPosicao(rows: OnibusPainel[]) {
  const total = rows.length || 1;
  const mk = (label: string, n: number) => ({ label, n, pct: (n / total) * 100 });
  return [
    mk("Traseira", rows.filter((r) => r.t).length),
    mk("Backseat", rows.filter((r) => r.b).length),
    mk("Painel", rows.filter((r) => r.p).length),
    mk("Institucional", rows.filter((r) => r.c).length)
  ];
}

export function proximosAVencer(rows: OnibusPainel[], limite = 6): OnibusPainel[] {
  return rows
    .filter((r) => r.x !== null && r.x >= 0 && (r.t || r.b || r.c))
    .sort((a, b) => (a.x ?? 1e9) - (b.x ?? 1e9))
    .slice(0, limite);
}
