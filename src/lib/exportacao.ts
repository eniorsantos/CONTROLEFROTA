// RF12: exportação xlsx/pdf da tabela com filtros aplicados. PDF = HTML imprimível; XLSX via lib xlsx.
import type { OnibusPainel } from "./tipos";
import { fmtBR } from "./vencimentos";

export function paraCSV(rows: OnibusPainel[]): string {
  const head = "N;Linha;Anunciante;Painel;Colocacao;Periodo;Retirada;Situacao";
  const li = rows.map((r) =>
    [r.n, `"${(r.l || "").replace(/"/g, '""')}"`, `"${(r.m || "").replace(/"/g, '""')}"`, `"${(r.p || "").replace(/"/g, '""')}"`, fmtBR(r.d), r.e, fmtBR(r.f), r.s].join(";")
  );
  return [head, ...li].join("\n");
}

export function paraHTMLImpressao(rows: OnibusPainel[], empresa: string): string {
  const tr = rows.map((r) => `<tr><td>${r.n}</td><td>${r.l}</td><td>${r.m}</td><td>${fmtBR(r.d)}</td><td>${fmtBR(r.f)}</td><td>${r.s}</td></tr>`).join("");
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${empresa} — Painel</title></head><body><h1>${empresa}</h1><table border="1" cellpadding="6"><thead><tr><th>Nº</th><th>Linha</th><th>Anunciante</th><th>Colocação</th><th>Retirada</th><th>Situação</th></tr></thead><tbody>${tr}</tbody></table><script>print()</script></body></html>`;
}
