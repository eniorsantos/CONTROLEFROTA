import type { OnibusPainel } from "./tipos";

/** Clientes vencidos: veiculação passada do fim, do mais atrasado ao menos. */
export function relVencidos(rows: OnibusPainel[]): OnibusPainel[] {
  return rows.filter((r) => r.s === "Vencido").sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
}

export interface LinhaFormato { pos: string; n: number; linha: string; anunciante: string; retirada: string; }

/** Clientes em veiculação por formato (posição): quem ocupa cada espaço. */
export function relPorFormato(rows: OnibusPainel[]): { pos: string; total: number; itens: LinhaFormato[] }[] {
  const defs = [
    { pos: "Traseira", get: (r: OnibusPainel) => r.t },
    { pos: "Backseat", get: (r: OnibusPainel) => r.b },
    { pos: "Painel", get: (r: OnibusPainel) => (r.m ? `${r.m} (${r.p})` : r.p) },
    { pos: "Institucional", get: (r: OnibusPainel) => r.c }
  ];
  return defs.map((d) => {
    const itens = rows
      .filter((r) => d.get(r))
      .map((r) => ({ pos: d.pos, n: r.n, linha: r.l, anunciante: d.get(r), retirada: r.f }))
      .sort((a, b) => a.n - b.n);
    return { pos: d.pos, total: itens.length, itens };
  });
}

/** Carros livres: sem nenhum anunciante, ordenados por número. */
export function relLivres(rows: OnibusPainel[]): OnibusPainel[] {
  return rows.filter((r) => r.s === "Disponível").sort((a, b) => a.n - b.n);
}

/** Vagas livres por formato (posições vazias na frota). */
export function posicoesLivres(rows: OnibusPainel[]): { pos: string; livres: number }[] {
  return [
    { pos: "Traseira", livres: rows.filter((r) => !r.t).length },
    { pos: "Backseat", livres: rows.filter((r) => !r.b).length },
    { pos: "Painel", livres: rows.filter((r) => !r.p).length },
    { pos: "Institucional", livres: rows.filter((r) => !r.c).length }
  ];
}
