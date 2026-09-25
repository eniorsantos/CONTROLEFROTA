// RF12: exportação xlsx/pdf da tabela com filtros aplicados. PDF = HTML imprimível; XLSX via lib xlsx.
import type { OnibusPainel } from "./tipos";
import { fmtBR } from "./vencimentos";
import type { LinhaFormato } from "./relatorios";

const q = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;

export function paraCSV(rows: OnibusPainel[]): string {
  const head = "N;Linha;Anunciante;Painel;Colocacao;Periodo;Retirada;Situacao";
  const li = rows.map((r) =>
    [r.n, q(r.l), q(r.m), q(r.p), fmtBR(r.d), r.e, fmtBR(r.f), r.s].join(";")
  );
  return [head, ...li].join("\n");
}

/** Vencidos: inclui dias em atraso. */
export function paraCSVVencidos(rows: OnibusPainel[]): string {
  const head = "N;Linha;Anunciante;Retirada;Dias em atraso";
  const li = rows.map((r) => [r.n, q(r.l), q(r.m), fmtBR(r.f), Math.abs(r.x ?? 0)].join(";"));
  return [head, ...li].join("\n");
}

/** Por formato: uma linha por posição ocupada. */
export function paraCSVFormatos(itens: LinhaFormato[]): string {
  const head = "Formato;N;Linha;Anunciante;Retirada";
  const li = itens.map((i) => [i.pos, i.n, q(i.linha), q(i.anunciante), fmtBR(i.retirada)].join(";"));
  return [head, ...li].join("\n");
}

/** Livres: carros sem anunciante + vagas por formato. */
export function paraCSVLivres(rows: OnibusPainel[]): string {
  const head = "N;Linha";
  const li = rows.map((r) => [r.n, q(r.l)].join(";"));
  return [head, ...li].join("\n");
}

/** HTML imprimível genérico (PDF via impressão). cols = cabeçalhos, body = linhas de células. */
export function paraHTMLRelatorio(titulo: string, empresa: string, cols: string[], body: (string | number)[][]): string {
  const esc = (s: string | number) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const tr = body.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("");
  const th = cols.map((c) => `<th>${esc(c)}</th>`).join("");
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(empresa)} — ${esc(titulo)}</title></head><body><h1>${esc(empresa)} — ${esc(titulo)}</h1><table border="1" cellpadding="6"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table><script>print()</script></body></html>`;
}

export function paraHTMLImpressao(rows: OnibusPainel[], empresa: string): string {
  const tr = rows.map((r) => `<tr><td>${r.n}</td><td>${r.l}</td><td>${r.m}</td><td>${fmtBR(r.d)}</td><td>${fmtBR(r.f)}</td><td>${r.s}</td></tr>`).join("");
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${empresa} — Painel</title></head><body><h1>${empresa}</h1><table border="1" cellpadding="6"><thead><tr><th>Nº</th><th>Linha</th><th>Anunciante</th><th>Colocação</th><th>Retirada</th><th>Situação</th></tr></thead><tbody>${tr}</tbody></table><script>print()</script></body></html>`;
}
