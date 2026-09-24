// RN2: duas veiculações ativas/agendadas não podem se sobrepor na mesma posição.
// Espelha o EXCLUDE USING gist em veiculacoes.

export interface Intervalo { inicio: string; fim: string; situacao: "agendada" | "ativa" | "retirada" | "cancelada"; }

export function sobrepoe(aIni: string, aFim: string, bIni: string, bFim: string): boolean {
  // daterange(inicio, inicio+periodo) with &&  → fim exclusivo
  return aIni < bFim && bIni < aFim;
}

export function podeAgendar(existentes: Intervalo[], novo: Intervalo): { ok: boolean; conflitoCom?: Intervalo } {
  if (novo.situacao !== "agendada" && novo.situacao !== "ativa") return { ok: true };
  for (const e of existentes) {
    if (e.situacao !== "agendada" && e.situacao !== "ativa") continue;
    if (sobrepoe(e.inicio, e.fim, novo.inicio, novo.fim)) return { ok: false, conflitoCom: e };
  }
  return { ok: true };
}

/** Renovar (RN5): cria nova veiculação encadeada — início = fim anterior. */
export function encadearRenovacao(fimAnteriorISO: string, periodoDias: number): { inicio: string; fim: string } {
  const [y, m, d] = fimAnteriorISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const inicio = fimAnteriorISO;
  dt.setDate(dt.getDate() + periodoDias);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return { inicio, fim: `${dt.getFullYear()}-${mm}-${dd}` };
}
