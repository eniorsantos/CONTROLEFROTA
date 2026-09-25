// Mapeamento puro entre o formato planilha (LinhaPrototipo) e o schema normalizado.
// Sem acesso a banco: testável em unidade. A rota /api/sync usa estas funções.
import type { LinhaPrototipo } from "./tipos";
import { fimVeiculacao } from "./vencimentos";

export type Pos = "traseira" | "backseat" | "painel" | "institucional";

export interface VeicPlana {
  numero: number;
  codigo: string;      // código da linha (antes do '-'), ou 'reserva'
  linhaNome: string;   // resto da linha
  pos: Pos;
  anunciante: string;  // '' quando a posição só tem detalhe (ex.: painel)
  detalhe: string;
  inicio: string;      // yyyy-mm-dd
  periodo: number;
}

export function dividirLinha(l: string): { codigo: string; nome: string } {
  const s = (l || "").trim();
  if (!s) return { codigo: "reserva", nome: "reserva" };
  const i = s.indexOf("-");
  if (i < 0) return { codigo: s, nome: s };
  return { codigo: s.slice(0, i).trim() || "reserva", nome: s.slice(i + 1).trim() || s };
}

/** Linhas únicas (codigo+nome) para upsert. */
export function extrairLinhas(rows: LinhaPrototipo[]): { codigo: string; nome: string }[] {
  const m = new Map<string, { codigo: string; nome: string }>();
  for (const r of rows) {
    const { codigo, nome } = dividirLinha(r.l);
    if (!m.has(codigo)) m.set(codigo, { codigo, nome });
  }
  return [...m.values()];
}

/** Anunciantes únicos (traseira/backseat/institucional). */
export function extrairAnunciantes(rows: LinhaPrototipo[]): string[] {
  return [...new Set(rows.flatMap((r) => [r.t, r.b, r.c]).map((s) => (s || "").trim()).filter(Boolean))];
}

/** Achata cada ônibus em veiculações por posição (t→traseira, b→backseat, c→institucional, p→painel com detalhe). */
export function extrairVeiculacoes(rows: LinhaPrototipo[]): VeicPlana[] {
  const out: VeicPlana[] = [];
  for (const r of rows) {
    const { codigo, nome } = dividirLinha(r.l);
    const push = (pos: Pos, anunciante: string, detalhe = "") => {
      if (!anunciante && !detalhe) return;
      if (anunciante && !r.d) return; // sem início não há veiculação
      out.push({ numero: r.n, codigo, linhaNome: nome, pos, anunciante, detalhe, inicio: r.d, periodo: r.e || 30 });
    };
    push("traseira", r.t);
    push("backseat", r.b);
    push("institucional", r.c);
    if (r.p) push("painel", "", r.p); // painel guarda detalhe (ex.: VIDRO GRANDE)
  }
  return out;
}

export interface ItemVeic { pos: Pos; anunciante: string; detalhe: string; inicio: string; periodo: number; }

/** Remonta um LinhaPrototipo a partir das veiculações do ônibus. Principal = vence primeiro (mesma regra do Painel). */
export function montarLinhaPrototipo(numero: number, linha: string, itens: ItemVeic[]): LinhaPrototipo {
  const base: LinhaPrototipo = { n: numero, l: linha, t: "", b: "", p: "", i: "", r: "", c: "", d: "", e: 30, f: "" };
  const comFim = itens
    .filter((i) => i.anunciante && i.inicio)
    .map((i) => ({ ...i, f: fimVeiculacao(i.inicio, i.periodo || 30) }))
    .sort((a, b) => (a.f > b.f ? 1 : -1));
  for (const i of itens) {
    if (i.pos === "traseira" && !base.t) base.t = i.anunciante;
    if (i.pos === "backseat" && !base.b) base.b = i.anunciante;
    if (i.pos === "institucional" && !base.c) base.c = i.anunciante;
    if (i.pos === "painel" && !base.p) base.p = i.detalhe || i.anunciante;
  }
  const pri = comFim[0];
  if (pri) { base.d = pri.inicio; base.e = pri.periodo; base.f = pri.f; }
  return base;
}
