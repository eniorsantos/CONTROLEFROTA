"use client";
import { useMemo, useState, useEffect } from "react";
import { FROTA } from "@/data/frota";
import { montarPainel } from "@/lib/painel";
import { fmtBR, fimVeiculacao } from "@/lib/vencimentos";
import type { LinhaPrototipo, Semaforo } from "@/lib/tipos";

const COR: Record<Semaforo, string> = {
  "Vencido": "var(--bad)",
  "Vence em 7 dias": "var(--warn)",
  "Em campanha": "var(--ok)",
  "Sem data": "var(--none)",
  "Disponível": "var(--none)"
};

type Overrides = Record<number, Partial<LinhaPrototipo>>;
const LS_KEY = "frota-edits";

interface Draft { l: string; t: string; b: string; p: string; c: string; d: string; e: number; }

function paraDraft(r: LinhaPrototipo): Draft {
  return { l: r.l, t: r.t, b: r.b, p: r.p, c: r.c, d: r.d, e: r.e };
}

export default function EdicaoClient() {
  const [over, setOver] = useState<Overrides>({});
  const [q, setQ] = useState("");
  const [editN, setEditN] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>({ l: "", t: "", b: "", p: "", c: "", d: "", e: 30 });
  const [erro, setErro] = useState("");

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      if (s && typeof s === "object") setOver(s);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(over)); } catch {}
  }, [over]);

  const base: LinhaPrototipo[] = useMemo(
    () => FROTA.map((r) => (over[r.n] ? { ...r, ...over[r.n] } : r)),
    [over]
  );
  const rows = useMemo(() => montarPainel(base), [base]);
  const filtradas = rows.filter((r) => !q || Object.values(r).join(" ").toLowerCase().includes(q.toLowerCase()));
  const editados = Object.keys(over).length;

  function abrir(r: (typeof rows)[number]) {
    setEditN(r.n); setDraft(paraDraft(r)); setErro("");
  }

  function salvar() {
    if (editN === null) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.d) && (draft.t || draft.b || draft.c)) {
      setErro("Colocação (início) deve estar no formato aaaa-mm-dd quando há anunciante.");
      return;
    }
    if (!Number.isFinite(draft.e) || draft.e <= 0) { setErro("Período deve ser maior que zero."); return; }
    setOver((p) => ({ ...p, [editN]: { ...draft } }));
    setEditN(null); setErro("");
  }

  function restaurar(n: number) {
    setOver((p) => { const s = { ...p }; delete s[n]; return s; });
    if (editN === n) setEditN(null);
  }

  const fimPrev = draft.d && /^\d{4}-\d{2}-\d{2}$/.test(draft.d) ? fimVeiculacao(draft.d, draft.e || 30) : "";

  const th = { textAlign: "left" as const, background: "var(--th)", color: "#fff", padding: 8, whiteSpace: "nowrap" as const };
  const td = { padding: "7px 8px", borderTop: "1px solid var(--line)" };
  const inp = { width: "100%", minWidth: 90, padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--card)", color: "var(--ink)", font: "inherit" as const };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px 48px" }}>
      <h1 className="font-cond" style={{ fontSize: 28, margin: "0 0 4px" }}>Editar frota</h1>
      <p style={{ color: "var(--mut)", marginTop: 0 }}>
        Mesma base do Painel, com edição direta por veículo. Retirada = colocação + período (calculada, RN1).
        {editados ? <> <b>{editados} editado(s)</b> <button onClick={() => { setOver({}); setEditN(null); }}>Descartar todas as edições</button></> : " Nenhuma edição ainda."}
      </p>
      <p style={{ color: "var(--mut)", fontSize: 13 }}>Rascunho salvo neste navegador; em produção, salvar grava via <code>PATCH /api/onibus/:id</code> e <code>PATCH /api/veiculacoes/:id</code> com auditoria (RF15).</p>
      <input type="search" placeholder="Buscar ônibus, linha ou cliente" aria-label="Buscar" value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--card)", color: "var(--ink)", minWidth: 260, marginBottom: 10 }} />
      {erro ? <p role="alert" style={{ color: "var(--bad)" }}>{erro}</p> : null}
      <div style={{ overflowX: "auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1150, fontSize: 14 }}>
          <thead><tr>
            {["Nº", "Linha", "Traseira", "Backseat", "Painel", "Institucional", "Colocação", "Período", "Retirada", "Situação", "Ações"].map((h) => <th key={h} style={th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtradas.map((r) => {
              const ed = editN === r.n;
              const d = ed ? draft : paraDraft(r);
              const fim = ed ? fimPrev : r.f;
              const set = (k: keyof Draft, v: string | number) => setDraft((p) => ({ ...p, [k]: v }));
              return (
                <tr key={r.n}>
                  <td className="font-cond" style={{ ...td, fontSize: 17 }}>{r.n}{over[r.n] ? <span title="Editado" style={{ color: "var(--warn)", fontSize: 12 }}> ●</span> : null}</td>
                  <td style={td}>{ed ? <input aria-label="Linha" value={d.l} onChange={(e) => set("l", e.target.value)} style={inp} /> : (r.l || "—")}</td>
                  <td style={td}>{ed ? <input aria-label="Traseira" value={d.t} onChange={(e) => set("t", e.target.value)} style={inp} /> : (r.t || "")}</td>
                  <td style={td}>{ed ? <input aria-label="Backseat" value={d.b} onChange={(e) => set("b", e.target.value)} style={inp} /> : (r.b || "")}</td>
                  <td style={td}>{ed ? <input aria-label="Painel" value={d.p} onChange={(e) => set("p", e.target.value)} style={inp} /> : (r.p || "")}</td>
                  <td style={td}>{ed ? <input aria-label="Institucional" value={d.c} onChange={(e) => set("c", e.target.value)} style={inp} /> : (r.c || "")}</td>
                  <td style={td}>{ed ? <input aria-label="Colocação" type="date" value={d.d} onChange={(e) => set("d", e.target.value)} style={inp} /> : fmtBR(r.d)}</td>
                  <td style={td}>{ed ? (
                    <select aria-label="Período" value={d.e} onChange={(e) => set("e", Number(e.target.value))} style={inp}>
                      <option value={30}>30</option><option value={60}>60</option><option value={90}>90</option>
                      {[15, 45, 120].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : ((r.t || r.b || r.c) ? `${r.e} d` : "")}</td>
                  <td style={td}>{fmtBR(fim)}</td>
                  <td style={td}><span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: "#fff", background: COR[r.s] }}>{r.s}</span></td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    {ed ? (
                      <><button onClick={salvar}>Salvar</button> <button onClick={() => setEditN(null)}>Cancelar</button></>
                    ) : (
                      <><button onClick={() => abrir(r)}>Editar</button>{over[r.n] ? <> <button onClick={() => restaurar(r.n)}>Restaurar</button></> : null}</>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--mut)" }}>{filtradas.length} de {rows.length} ônibus</p>
    </div>
  );
}
