"use client";
import { useState } from "react";
import Guarda from "@/components/Guarda";
import { previaImportacao, type PreviaImport, type LinhaBruta } from "@/lib/importacao";
import { fmtBR } from "@/lib/vencimentos";

// Colunas 0-based da Frota.xlsx: B=1 C=2 D=3 E=4 F=5 G=6 I=8 J=9 K=10 L=11
const COL = { B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, I: 8, J: 9, K: 10, L: 11 };

export default function ImportPage() {
  const [prev, setPrev] = useState<PreviaImport | null>(null);
  const [arquivo, setArquivo] = useState("");
  const [linCab, setLinCab] = useState(1);
  const [previaId, setPreviaId] = useState("");
  const [msg, setMsg] = useState("");
  const [fase, setFase] = useState<"arquivo" | "previa" | "confirmada">("arquivo");

  async function lerArquivo(f: File) {
    setMsg(""); setPrev(null); setPreviaId(""); setFase("arquivo");
    try {
      const XLSX = await import("xlsx");
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("Planilha vazia.");
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: "" });
      const dados = aoa.slice(Math.max(linCab, 1)).filter((r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== ""));
      if (!dados.length) throw new Error("Nenhuma linha de dados após o cabeçalho. Ajuste a linha do cabeçalho.");
      const cel = (r: unknown[], i: number): string | number | Date | undefined => {
        const v = r[i] as string | number | Date | undefined;
        return v === "" ? undefined : v;
      };
      const linhas: LinhaBruta[] = dados.map((r) => ({
        B: cel(r, COL.B), C: cel(r, COL.C), D: cel(r, COL.D), E: cel(r, COL.E), F: cel(r, COL.F),
        G: cel(r, COL.G), I: cel(r, COL.I), J: cel(r, COL.J), K: cel(r, COL.K), L: cel(r, COL.L)
      }));
      const p = previaImportacao(linhas);
      setPrev(p); setArquivo(f.name); setFase("previa");
      (window as unknown as { __linhas?: LinhaBruta[] }).__linhas = linhas;
    } catch (e) {
      setMsg("Falha ao ler: " + (e as Error).message);
    }
  }

  async function enviar() {
    const linhas = (window as unknown as { __linhas?: LinhaBruta[] }).__linhas ?? [];
    const r = await fetch("/api/importacoes", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ linhas })
    });
    const j = await r.json();
    if (!r.ok) { setMsg("Erro no servidor: " + JSON.stringify(j)); return; }
    setPreviaId(j.id); setMsg(`Prévia no servidor: ${j.total} válidas, ${j.erros.length} erros.`);
  }

  async function confirmar() {
    if (!prev) return;
    const r = await fetch(`/api/importacoes/${previaId || "previa-demo"}/confirmar`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ validas: prev.validas })
    });
    const j = await r.json();
    if (!r.ok || !j.ok) { setMsg("Falha ao confirmar."); return; }
    setFase("confirmada"); setMsg(`${j.importadas} ônibus importados. ${j.nota ?? ""}`);
  }

  return (
    <Guarda aba="importacao">
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
      <h1 className="font-cond" style={{ fontSize: 28 }}>Importação (RF11)</h1>
      <p style={{ color: "var(--mut)" }}>
        Envie a planilha (.xlsx, .xls ou .csv), confira a prévia com erros e confirme.
        Mapeamento padrão: B→nº, C→linha, D→traseira, E/F→backseat, G→painel,
        I→institucional, J→início, K→período, L→fim. Ignora &quot;.&quot; e &quot;o&quot;.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <label>Planilha <input type="file" accept=".xlsx,.xls,.csv" aria-label="Planilha"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) lerArquivo(f); }} /></label>
        <label>Linha do cabeçalho <input type="number" min={1} value={linCab} aria-label="Linha do cabeçalho"
          onChange={(e) => setLinCab(Number(e.target.value) || 1)} style={{ width: 70 }} /></label>
      </div>
      {msg ? <p role="status">{msg}</p> : null}
      {prev ? (
        <div style={{ marginTop: 12 }}>
          <p><b>{arquivo}</b> — Válidas: <b>{prev.validas.length}</b> · Erros: <b>{prev.erros.length}</b></p>
          {prev.erros.length ? (
            <><h2 className="font-cond">Erros</h2>
            <ul>{prev.erros.slice(0, 30).map((e, i) => <li key={i}>Linha {e.linha} [{e.campo}]: {e.msg}</li>)}
            {prev.erros.length > 30 ? <li>…e mais {prev.erros.length - 30}</li> : null}</ul></>
          ) : null}
          {prev.sugestoesJuncao.length ? (
            <><h2 className="font-cond">Sugestões de junção (confirmar)</h2>
            <ul>{prev.sugestoesJuncao.slice(0, 20).map((s, i) => <li key={i}>{s.de} → {s.para} ({s.motivo})</li>)}</ul></>
          ) : null}
          <h2 className="font-cond">Amostra das válidas</h2>
          <div style={{ overflowX: "auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6 }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead><tr>{["Nº", "Linha", "Traseira", "Backseat", "Institucional", "Início", "Retirada"].map((h) => <th key={h} style={{ textAlign: "left", background: "var(--th)", color: "#fff", padding: 6 }}>{h}</th>)}</tr></thead>
              <tbody>
                {prev.validas.slice(0, 10).map((v) => (
                  <tr key={v.n}><td style={{ padding: 6, borderTop: "1px solid var(--line)" }}>{v.n}</td><td style={{ padding: 6, borderTop: "1px solid var(--line)" }}>{v.l}</td><td style={{ padding: 6, borderTop: "1px solid var(--line)" }}>{v.t}</td><td style={{ padding: 6, borderTop: "1px solid var(--line)" }}>{v.b}</td><td style={{ padding: 6, borderTop: "1px solid var(--line)" }}>{v.c}</td><td style={{ padding: 6, borderTop: "1px solid var(--line)" }}>{fmtBR(v.d)}</td><td style={{ padding: 6, borderTop: "1px solid var(--line)" }}>{fmtBR(v.f)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {fase === "previa" ? (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={enviar}>1. Enviar ao servidor</button>
              <button onClick={confirmar} disabled={!prev.validas.length}>2. Confirmar importação</button>
            </div>
          ) : null}
          {fase === "confirmada" ? <p role="status"><b>Importação concluída.</b> Veja o resultado no <a href="/">Painel</a>.</p> : null}
        </div>
      ) : null}
    </main>
    </Guarda>
  );
}
