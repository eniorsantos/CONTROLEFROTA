"use client";
import { useState, useEffect } from "react";
import { salvarBase, limparBase, autoLigado, definirAuto } from "@/lib/fonte";
import type { LinhaPrototipo } from "@/lib/tipos";

// Barra de sincronização com o Supabase: manual (Baixar/Enviar) + automática (toggle).
export default function SyncBar({ dados }: { dados: LinhaPrototipo[] }) {
  const [msg, setMsg] = useState("");
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setAuto(autoLigado()); }, []);

  async function baixar() {
    setBusy(true); setMsg("Baixando do Supabase…");
    try {
      const r = await fetch("/api/sync");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      salvarBase(j.linhas);
      setMsg(`Baixados ${j.total} veículos do Supabase.`);
    } catch (e) { setMsg("Falha ao baixar: " + (e as Error).message); }
    setBusy(false);
  }

  async function enviar() {
    setBusy(true); setMsg("Enviando ao Supabase…");
    try {
      const r = await fetch("/api/sync", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ linhas: dados })
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setMsg(`Enviados ${j.onibus} ônibus e ${j.veiculacoes} veiculações.`);
    } catch (e) { setMsg("Falha ao enviar: " + (e as Error).message); }
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6, padding: "8px 12px", margin: "12px 0" }}>
      <b style={{ fontSize: 14 }}>Supabase</b>
      <button onClick={baixar} disabled={busy}>↓ Baixar (manual)</button>
      <button onClick={enviar} disabled={busy}>↑ Enviar (manual)</button>
      <label style={{ fontSize: 14 }}>
        <input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); definirAuto(e.target.checked); }} /> Automática (salva no Supabase ao editar)
      </label>
      <button onClick={() => { limparBase(); setMsg("Base local descartada; usando seed."); }} disabled={busy}>Usar seed local</button>
      {msg ? <span role="status" style={{ fontSize: 13, color: "var(--mut)" }}>{msg}</span> : null}
    </div>
  );
}
