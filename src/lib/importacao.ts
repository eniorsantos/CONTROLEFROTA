// RF11 + §6.4: importação da Frota.xlsx
// Mapeamento: B→numero, C→linha (código antes do 1º '-'), D→traseira, E/F→backseat,
// G→painel, I→cliente retirada (institucional), J→início, K→período, L→fim.
import type { LinhaPrototipo } from "./tipos";

export interface LinhaBruta { [col: string]: string | number | Date | undefined; }
export interface ErroImport { linha: number; campo: string; msg: string; }
export interface PreviaImport {
  validas: LinhaPrototipo[];
  erros: ErroImport[];
  sugestoesJuncao: { de: string; para: string; motivo: string }[];
}

const IGNORAR = new Set([".", "o", "-", ""]);

function limp(v: unknown): string {
  const s = String(v ?? "").trim();
  return IGNORAR.has(s.toLowerCase()) ? "" : s;
}

function dataISO(v: unknown): string {
  // Date (ex.: xlsx com cellDates:true) — usa getters locais p/ não deslocar o dia
  if (v instanceof Date && !Number.isNaN(+v)) {
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${v.getFullYear()}-${m}-${d}`;
  }
  // serial do Excel (dias desde 1899-12-30) — fórmula em UTC
  if (typeof v === "number" && Number.isFinite(v) && v > 0) {
    const dt = new Date(Math.round((v - 25569) * 86400000));
    const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dt.getUTCDate()).padStart(2, "0");
    return `${dt.getUTCFullYear()}-${m}-${d}`;
  }
  const s = String(v ?? "").trim();
  if (!s) return "";
  // aceita yyyy-mm-dd ou dd/mm/aaaa
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return "";
}

/** distância simples p/ sugerir junção de nomes parecidos (ex. Bahiaha/Bahia). */
export function parecidos(a: string, b: string): boolean {
  const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/gi, "").trim();
  const x = n(a), y = n(b);
  if (!x || !y || x === y) return false;
  if (x.includes(y) || y.includes(x)) return true;
  let eq = 0;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] === y[i]) eq++;
  return eq / len > 0.82;
}

export function previaImportacao(linhas: LinhaBruta[], mapa = { B: "B", C: "C", D: "D", E: "E", F: "F", G: "G", I: "I", J: "J", K: "K", L: "L" }): PreviaImport {
  const validas: LinhaPrototipo[] = [];
  const erros: ErroImport[] = [];
  linhas.forEach((lb, idx) => {
    const nro = Number(limp(lb[mapa.B]));
    const linha = limp(lb[mapa.C]);
    const t = limp(lb[mapa.D]);
    const back = limp(lb[mapa.E]) || limp(lb[mapa.F]);
    const painel = limp(lb[mapa.G]);
    const cli = limp(lb[mapa.I]);
    const d = dataISO(lb[mapa.J]);
    const e = Number(lb[mapa.K] ?? 30) || 30;
    const f = dataISO(lb[mapa.L]);
    const temCliente = Boolean(t || back || painel || cli);
    if (!nro) erros.push({ linha: idx + 1, campo: "B", msg: "Número do ônibus ausente." });
    if (temCliente && !d) erros.push({ linha: idx + 1, campo: "J", msg: "Linha com cliente mas sem data de colocação." });
    if (!Number.isFinite(nro) || nro <= 0) return;
    validas.push({
      n: nro, l: linha,
      t, b: back, p: painel, i: "", r: "",
      c: cli, d, e, f
    });
  });
  // trata "reserva" como status reserva (sinalizado na linha)
  // sugestões de junção
  const nomes = [...new Set(validas.flatMap((v) => [v.t, v.b, v.c]).filter(Boolean))];
  const sugestoesJuncao: PreviaImport["sugestoesJuncao"] = [];
  for (let i = 0; i < nomes.length; i++)
    for (let j = i + 1; j < nomes.length; j++)
      if (parecidos(nomes[i], nomes[j]))
        sugestoesJuncao.push({ de: nomes[i], para: nomes[j], motivo: "Nomes parecidos — confirmar junção." });
  return { validas, erros, sugestoesJuncao };
}
