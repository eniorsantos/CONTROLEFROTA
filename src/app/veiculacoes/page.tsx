"use client";
import { useState } from "react";
import { fimVeiculacao } from "@/lib/vencimentos";
import { podeAgendar } from "@/lib/sobreposicao";

export default function VeiculacoesPage() {
  const [inicio, setInicio] = useState("2026-10-01");
  const [periodo, setPeriodo] = useState(30);
  const [msg, setMsg] = useState("");
  const fim = fimVeiculacao(inicio, periodo);
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
      <h1 className="font-cond" style={{ fontSize: 28 }}>Veiculações (RF6)</h1>
      <p style={{ color: "var(--mut)" }}>Fim = início + período (calculado, não digitado). O banco bloqueia sobreposição na mesma posição.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <label>Início <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></label>
        <label>Período <select value={periodo} onChange={(e) => setPeriodo(Number(e.target.value))}><option value={30}>30</option><option value={60}>60</option><option value={90}>90</option><option value={45}>45 (personalizado)</option></select></label>
        <button onClick={() => {
          const r = podeAgendar([{ inicio: "2026-10-01", fim: "2026-10-31", situacao: "ativa" }], { inicio, fim, situacao: "agendada" });
          setMsg(r.ok ? `OK — veiculação ${inicio} → ${fim} sem conflito.` : `BLOQUEADO — sobrepõe ${r.conflitoCom?.inicio} → ${r.conflitoCom?.fim}.`);
        }}>Validar sobreposição</button>
      </div>
      <p>Fim calculado: <b>{fim}</b></p>
      {msg ? <p role="status">{msg}</p> : null}
      <h2 className="font-cond">Renovar (RN5)</h2>
      <p style={{ color: "var(--mut)" }}>Renovar cria nova veiculação encadeada (início = fim anterior), preservando histórico + auditoria.</p>
    </main>
  );
}
