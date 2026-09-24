// RF9: alertas de vencimento 15/7/0 dias + atraso de retirada. Cron diário 06:00 (fuso empresa).
import type { OnibusPainel } from "./tipos";

export interface Alerta { para: string[]; assunto: string; corpo: string; onibus: number; dias: number | null; }

export function alertasVencimento(rows: OnibusPainel[], destinatarios: string[]): Alerta[] {
  const out: Alerta[] = [];
  // 1 alerta por ônibus: 15/7/0 dias aqui; vencidos (x<0) só no bloco de atraso abaixo.
  for (const r of rows) {
    if (r.x === null || r.x < 0 || ![15, 7, 0].includes(r.x)) continue;
    const rot = r.x === 0 ? "vence HOJE" : `vence em ${r.x} dias`;
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
      corpo: `Ônibus ${r.n} venceu há ${Math.abs(r.x ?? 0)} dias em ${r.f}. Gerar OS de retirada.`,
      onibus: r.n,
      dias: r.x
    });
  }
  return out;
}
