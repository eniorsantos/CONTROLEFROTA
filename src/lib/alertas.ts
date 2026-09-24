// RF9: alertas de vencimento 15/7/0 dias + atraso de retirada. Cron diário 06:00 (fuso empresa).
import type { OnibusPainel } from "./tipos";

export interface Alerta { para: string[]; assunto: string; corpo: string; onibus: number; dias: number | null; }

export function alertasVencimento(rows: OnibusPainel[], destinatarios: string[]): Alerta[] {
  const out: Alerta[] = [];
  for (const r of rows) {
    if (r.x === null) continue;
    if (![15, 7, 0].includes(r.x) && !(r.x < 0)) continue;
    const rot = r.x < 0 ? `VENCIDO há ${Math.abs(r.x)} dias — retirar` : r.x === 0 ? "vence HOJE" : `vence em ${r.x} dias`;
    out.push({
      para: destinatarios,
      assunto: `Mídia ${rot} — ônibus ${r.n} (${r.m || "sem anunciante"})`,
      corpo: `Ônibus ${r.n} · linha ${r.l} · anunciante ${r.m} · retirada ${r.f} (${rot}).`,
      onibus: r.n,
      dias: r.x
    });
  }
  // atraso de retirada: vencido sem baixa
  for (const r of rows.filter((x) => (x.x ?? 0) < 0)) {
    out.push({
      para: destinatarios,
      assunto: `Retirada em atraso — ônibus ${r.n}`,
      corpo: `Ônibus ${r.n} venceu em ${r.f}. Gerar OS de retirada.`,
      onibus: r.n,
      dias: r.x
    });
  }
  return out;
}
