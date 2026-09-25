"use client";
import { useMemo, useState, useEffect } from "react";
import { carregarBase, EVENTO_NUVEM } from "@/lib/fonte";
import { montarPainel, resumoPainel } from "@/lib/painel";
import { relVencidos, relPorFormato, relLivres, posicoesLivres } from "@/lib/relatorios";
import { fmtBR } from "@/lib/vencimentos";

type Aba = "vencidos" | "formatos" | "livres";

const th = { textAlign: "left" as const, background: "var(--th)", color: "#fff", padding: 8, whiteSpace: "nowrap" as const };
const td = { padding: "7px 8px", borderTop: "1px solid var(--line)" };

export default function RelatoriosPage() {
  const [aba, setAba] = useState<Aba>("vencidos");
  const [ver, setVer] = useState(0);
  useEffect(() => {
    const f = () => setVer((v) => v + 1);
    window.addEventListener(EVENTO_NUVEM, f);
    return () => window.removeEventListener(EVENTO_NUVEM, f);
  }, []);
  const rows = useMemo(() => montarPainel(carregarBase()), [ver]);
  const resumo = resumoPainel(rows);
  const venc = useMemo(() => relVencidos(rows), [rows]);
  const formatos = useMemo(() => relPorFormato(rows), [rows]);
  const livres = useMemo(() => relLivres(rows), [rows]);
  const vagas = useMemo(() => posicoesLivres(rows), [rows]);

  const exp = (t: "csv" | "pdf", rel: string) => `/api/exportar?tipo=${t}&rel=${rel}`;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 48px" }}>
      <h1 className="font-cond" style={{ fontSize: 28, margin: "0 0 4px" }}>Relatórios (RF12/RF13)</h1>
      <p style={{ color: "var(--mut)", marginTop: 0 }}>
        {resumo.frota} ônibus · {resumo.vencidos} vencidos · {resumo.disponiveis} livres.
        Cada relatório tem exportação CSV e PDF (impressão).
      </p>
      <div role="tablist" aria-label="Relatórios" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {([["vencidos", `Clientes vencidos (${venc.length})`], ["formatos", "Em veiculação por formato"], ["livres", `Carros livres (${livres.length})`]] as [Aba, string][]).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}
            style={{ fontWeight: aba === k ? 700 : 400, borderBottom: aba === k ? "3px solid var(--y)" : "3px solid transparent" }}>{l}</button>
        ))}
      </div>

      {aba === "vencidos" ? (
        <section>
          <h2 className="font-cond" style={{ fontSize: 22 }}>Clientes vencidos — retirar ({venc.length})</h2>
          <p><a href={exp("csv", "vencidos")}>Baixar CSV</a> · <a href={exp("pdf", "vencidos")}>Abrir PDF</a></p>
          <div style={{ overflowX: "auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6 }}>
            <table style={{ width: "100%", minWidth: 700, fontSize: 14, borderCollapse: "collapse" }}>
              <thead><tr>{["Nº", "Linha", "Anunciante", "Retirada", "Dias em atraso"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {venc.map((r) => (
                  <tr key={r.n}><td className="font-cond" style={{ ...td, fontSize: 17 }}>{r.n}</td><td style={td}>{r.l}</td><td style={td}>{r.m}</td><td style={td}>{fmtBR(r.f)}</td><td style={td}><b>{Math.abs(r.x ?? 0)} d</b></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {!venc.length ? <p style={{ color: "var(--mut)" }}>Nenhum vencido. Bom sinal.</p> : null}
        </section>
      ) : null}

      {aba === "formatos" ? (
        <section>
          <h2 className="font-cond" style={{ fontSize: 22 }}>Clientes em veiculação por formato</h2>
          <p><a href={exp("csv", "formatos")}>Baixar CSV</a> · <a href={exp("pdf", "formatos")}>Abrir PDF</a></p>
          {formatos.map((g) => (
            <div key={g.pos} style={{ marginBottom: 16 }}>
              <h3 className="font-cond" style={{ fontSize: 18 }}>{g.pos} ({g.total})</h3>
              <div style={{ overflowX: "auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6 }}>
                <table style={{ width: "100%", minWidth: 600, fontSize: 14, borderCollapse: "collapse" }}>
                  <thead><tr>{["Nº", "Linha", "Anunciante", "Retirada"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {g.itens.map((i) => (
                      <tr key={g.pos + i.n}><td className="font-cond" style={{ ...td, fontSize: 17 }}>{i.n}</td><td style={td}>{i.linha}</td><td style={td}>{i.anunciante}</td><td style={td}>{fmtBR(i.retirada)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {aba === "livres" ? (
        <section>
          <h2 className="font-cond" style={{ fontSize: 22 }}>Carros livres ({livres.length})</h2>
          <p style={{ color: "var(--mut)" }}>Vagas por formato: {vagas.map((v) => `${v.pos} ${v.livres}`).join(" · ")}</p>
          <p><a href={exp("csv", "livres")}>Baixar CSV</a> · <a href={exp("pdf", "livres")}>Abrir PDF</a></p>
          <div style={{ overflowX: "auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6 }}>
            <table style={{ width: "100%", minWidth: 500, fontSize: 14, borderCollapse: "collapse" }}>
              <thead><tr>{["Nº", "Linha"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {livres.map((r) => (
                  <tr key={r.n}><td className="font-cond" style={{ ...td, fontSize: 17 }}>{r.n}</td><td style={td}>{r.l || "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {!livres.length ? <p style={{ color: "var(--mut)" }}>Nenhum carro totalmente livre.</p> : null}
        </section>
      ) : null}
    </main>
  );
}
