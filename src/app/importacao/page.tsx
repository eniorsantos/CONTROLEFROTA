"use client";
import { useState } from "react";
import { previaImportacao } from "@/lib/importacao";

export default function ImportPage() {
  const [prev, setPrev] = useState<ReturnType<typeof previaImportacao> | null>(null);
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
      <h1 className="font-cond" style={{ fontSize: 28 }}>Importação (RF11)</h1>
      <p style={{ color: "var(--mut)" }}>Envie a planilha, confira a prévia com erros e confirme. Mapeamento padrão B→nº, C→linha, D→traseira, E/F→backseat, G→painel, I→institucional, J→início, K→período, L→fim. Ignora &quot;.&quot; e &quot;o&quot;. &quot;reserva&quot; vira status reserva.</p>
      <button onClick={() => setPrev(previaImportacao([
        { B: 3900, C: "A0885-V. Abrantes x T. Aeroporto", D: "Galinha Pintadinha", J: "2026-09-08", K: 30, L: "2026-10-08" },
        { B: "", C: "", D: ".", J: "", K: 30, L: "" },
        { B: 3901, C: "reserva", D: "", I: "Faculdade Bahiaha", J: "2026-06-18", K: 30, L: "2026-07-18" }
      ]))}>Simular prévia</button>
      {prev ? (
        <div>
          <p>Válidas: {prev.validas.length} · Erros: {prev.erros.length}</p>
          <ul>{prev.erros.map((e, i) => <li key={i}>Linha {e.linha} [{e.campo}]: {e.msg}</li>)}</ul>
          <ul>{prev.sugestoesJuncao.map((s, i) => <li key={i}>{s.de} → {s.para} ({s.motivo})</li>)}</ul>
        </div>
      ) : null}
    </main>
  );
}
