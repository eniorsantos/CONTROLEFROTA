"use client";
import { useMemo, useState, useEffect, Fragment } from "react";
import { FROTA } from "@/data/frota";
import { montarPainel, resumoPainel, ocupacaoPorPosicao, proximosAVencer } from "@/lib/painel";
import { fmtBR } from "@/lib/vencimentos";
import type { Semaforo } from "@/lib/tipos";

const COR: Record<Semaforo, string> = {
  "Vencido": "var(--bad)",
  "Vence em 7 dias": "var(--warn)",
  "Em campanha": "var(--ok)",
  "Sem data": "var(--none)",
  "Disponível": "var(--none)"
};

type SortK = "n" | "l" | "m" | "p" | "d" | "e" | "f" | "x";

export default function PainelClient() {
  const rows = useMemo(() => montarPainel(FROTA), []);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [ln, setLn] = useState("");
  const [sk, setSk] = useState<SortK>("n");
  const [sd, setSd] = useState(1);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [brand, setBrand] = useState({ nm: "Expresso Vitória", y: "#f5b800", th: "#17212b", lg: "" });

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("cfg") || "{}");
      if (s.nm || s.y || s.th || s.lg) setBrand({ nm: s.nm || "Expresso Vitória", y: s.y || "#f5b800", th: s.th || "#17212b", lg: s.lg || "" });
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--y", brand.y);
    document.documentElement.style.setProperty("--th", brand.th);
  }, [brand]);

  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const resumo = resumoPainel(rows);
  const occ = ocupacaoPorPosicao(rows);
  const soon = proximosAVencer(rows, 6);
  const linhas = useMemo(() => [...new Set(rows.map((r) => r.code))].sort(), [rows]);

  const v = rows
    .filter((r) => (!st || r.s === st) && (!ln || r.code === ln) && (!q || Object.values(r).join(" ").toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => {
      const x = sk === "x" ? (a.x ?? 1e9) : (a as unknown as Record<string, unknown>)[sk] as number | string;
      const y = sk === "x" ? (b.x ?? 1e9) : (b as unknown as Record<string, unknown>)[sk] as number | string;
      return (x > y ? 1 : x < y ? -1 : 0) * sd;
    });

  const kpis: [string, number, Semaforo | "Total"][] = [
    ["Ônibus na frota", resumo.frota, "Total"],
    ["Em campanha", resumo.emCampanha, "Em campanha"],
    ["Vencem em 7 dias", resumo.vence7, "Vence em 7 dias"],
    ["Vencidos (retirar)", resumo.vencidos, "Vencido"],
    ["Disponíveis", resumo.disponiveis, "Disponível"]
  ];

  function toggle(n: number) {
    setOpen((p) => { const s = new Set(p); if (s.has(n)) s.delete(n); else s.add(n); return s; });
  }

  return (
    <div className="w" style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px 48px" }}>
      <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 8, borderBottom: "4px solid var(--y)", paddingBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {brand.lg ? <img alt="Logo da empresa" src={brand.lg} style={{ maxHeight: 48, maxWidth: 160 }} /> : null}
          <div><div style={{ color: "var(--mut)" }}>Controle de mídia em ônibus</div>
          <h1 className="font-cond" style={{ fontSize: 34, margin: 0 }}>{brand.nm}</h1></div>
        </div>
        <div><span style={{ color: "var(--mut)" }}>{hoje}</span>{" "}
          <button onClick={() => { const r = document.documentElement; const dark = getComputedStyle(r).getPropertyValue("--bg").trim() === "#12181e"; r.dataset.theme = dark ? "light" : "dark"; }} aria-label="Alternar tema" style={{ border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)", borderRadius: 6, padding: "8px 12px" }}>Tema</button>
        </div>
      </header>

      <details style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6, padding: 14, marginTop: 12 }}>
        <summary>Personalizar aparência</summary>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, alignItems: "center" }}>
          <label>Cor de destaque <input type="color" value={brand.y} onChange={(e) => setBrand({ ...brand, y: e.target.value })} style={{ width: 48 }} /></label>
          <label>Cor da tabela <input type="color" value={brand.th} onChange={(e) => setBrand({ ...brand, th: e.target.value })} style={{ width: 48 }} /></label>
          <input placeholder="Nome da empresa" aria-label="Nome da empresa" value={brand.nm} onChange={(e) => setBrand({ ...brand, nm: e.target.value })} style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--card)", color: "var(--ink)" }} />
          <button onClick={() => { setBrand({ nm: "Expresso Vitória", y: "#f5b800", th: "#17212b", lg: "" }); localStorage.removeItem("cfg"); }} style={{ border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)", borderRadius: 6, padding: "8px 12px" }}>Restaurar padrão</button>
        </div>
        <p style={{ color: "var(--mut)" }}>Prévia ao vivo. Ao salvar vale para toda a empresa (tabela tenant_branding).</p>
      </details>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, margin: "18px 0" }}>
        {kpis.map((k) => (
          <button key={k[0]} onClick={() => setSt(k[2] === "Total" ? "" : k[2])} style={{ textAlign: "left", background: "var(--card)", border: "1px solid var(--line)", borderLeft: `6px solid ${k[2] === "Total" ? "var(--ink)" : COR[k[2] as Semaforo]}`, borderRadius: 6, padding: "12px 14px", cursor: "pointer", color: "var(--ink)" }}>
            <span style={{ color: "var(--mut)" }}>{k[0]}</span>
            <b className="font-cond" style={{ display: "block", fontSize: 40, lineHeight: 1 }}>{k[1]}</b>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6, padding: 14 }}>
          <h2 className="font-cond" style={{ fontSize: 20, margin: "0 0 10px" }}>Ocupação por posição</h2>
          {occ.map((o) => (
            <div key={o.label} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0", fontSize: 13 }}>
              <span style={{ width: 118 }}>{o.label}</span>
              <div style={{ flex: 1, height: 14, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${o.pct}%`, background: "var(--ink)" }} />
              </div><b>{o.n}</b>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6, padding: 14 }}>
          <h2 className="font-cond" style={{ fontSize: 20, margin: "0 0 10px" }}>Próximos a vencer</h2>
          {soon.map((r) => (
            <div key={r.n} onClick={() => setQ(String(r.n))} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid var(--line)", cursor: "pointer", fontSize: 14 }}>
              <span><b>{r.n}</b> {r.t || r.b || r.c}</span>
              <span style={{ color: "var(--mut)" }}>{r.x === 0 ? "hoje" : `${r.x} d`}</span>
            </div>
          )) || <span style={{ color: "var(--mut)" }}>Nada vencendo.</span>}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 10px" }}>
        <input type="search" placeholder="Buscar ônibus, linha ou cliente" aria-label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 200, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--card)", color: "var(--ink)" }} />
        <select aria-label="Situação" value={st} onChange={(e) => setSt(e.target.value)} style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--card)", color: "var(--ink)" }}>
          <option value="">Todas as situações</option><option>Vencido</option><option>Vence em 7 dias</option><option>Em campanha</option><option>Sem data</option><option>Disponível</option>
        </select>
        <select aria-label="Linha" value={ln} onChange={(e) => setLn(e.target.value)} style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--card)", color: "var(--ink)" }}>
          <option value="">Todas as linhas</option>
          {linhas.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ overflowX: "auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900, fontSize: 14 }}>
          <thead><tr>
            {[["Nº", "n"], ["Linha", "l"], ["Anunciante", "m"], ["Painel", "p"], ["Colocação", "d"], ["Período", "e"], ["Retirada", "f"], ["Situação", "x"]].map((c) => (
              <th key={c[1]} onClick={() => { if (sk === c[1]) setSd(-sd); else { setSk(c[1] as SortK); setSd(1); } }} style={{ textAlign: "left", background: "var(--th)", color: "#fff", padding: 8, cursor: "pointer", whiteSpace: "nowrap" }}>{c[0]}</th>
            ))}
          </tr></thead>
          <tbody>
            {v.map((r) => (
              <Fragment key={r.n}>
                <tr>
                  <td className="font-cond" style={{ fontSize: 17, padding: "7px 8px", borderTop: "1px solid var(--line)" }}>{r.n}</td>
                  <td style={{ padding: "7px 8px", borderTop: "1px solid var(--line)" }}>{r.l || "—"}</td>
                  <td style={{ padding: "7px 8px", borderTop: "1px solid var(--line)" }}>
                    {r.ads[0] ? <><span style={{ background: "var(--line)", borderRadius: 4, padding: "1px 6px", fontSize: 12, marginRight: 4 }}>{r.ads[0].pos}</span>{r.m}</> : ""}
                    {r.ads.length > 1 ? <button onClick={() => toggle(r.n)} aria-expanded={open.has(r.n)} aria-label={`Mostrar outros anunciantes do ônibus ${r.n}`} style={{ padding: "0 9px", fontWeight: 600, borderRadius: 99, marginLeft: 6, background: "var(--y)", color: "#17212b", border: "1px solid transparent", cursor: "pointer" }}>+{r.ads.length - 1}</button> : null}
                  </td>
                  <td style={{ padding: "7px 8px", borderTop: "1px solid var(--line)" }}>{r.p ? <span style={{ background: "var(--line)", borderRadius: 4, padding: "1px 6px", fontSize: 12 }}>{r.p}</span> : ""}</td>
                  <td style={{ padding: "7px 8px", borderTop: "1px solid var(--line)" }}>{fmtBR(r.d)}</td>
                  <td style={{ padding: "7px 8px", borderTop: "1px solid var(--line)" }}>{(r.t || r.b || r.c) ? `${r.e} d` : ""}</td>
                  <td style={{ padding: "7px 8px", borderTop: "1px solid var(--line)" }}>{fmtBR(r.f)}</td>
                  <td style={{ padding: "7px 8px", borderTop: "1px solid var(--line)" }}>
                    <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: "#fff", background: COR[r.s] }}>{r.s}{r.x !== null && (r.t || r.b || r.c) ? ` · ${r.x < 0 ? Math.abs(r.x) + " d atrás" : r.x + " d"}` : ""}</span>
                  </td>
                </tr>
                {r.ads.length > 1 && open.has(r.n) ? (
                  <tr><td></td><td colSpan={7} style={{ background: "var(--bg)", fontSize: 13, lineHeight: 1.9 }}>{r.ads.slice(1).map((a) => <div key={a.pos + a.nome}><span style={{ background: "var(--line)", borderRadius: 4, padding: "1px 6px", fontSize: 12, marginRight: 4 }}>{a.pos}</span>{a.nome} · retira {fmtBR(a.f)}</div>)}</td></tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--mut)" }}>{v.length} de {rows.length} ônibus</p>
    </div>
  );
}
