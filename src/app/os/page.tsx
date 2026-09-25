"use client";
import { useState, useMemo } from "react";
import Guarda from "@/components/Guarda";
import { FROTA } from "@/data/frota";

export default function OSPage() {
  const hoje = new Date().toISOString().slice(0, 10);
  const [bus, setBus] = useState("");
  const [data, setData] = useState(hoje);
  const [cliente, setCliente] = useState("");
  const [tipo, setTipo] = useState<"instalacao" | "retirada">("instalacao");
  const [foto, setFoto] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const onibus = useMemo(() => [...FROTA].sort((a, b) => a.n - b.n), []);
  const clientes = useMemo(
    () => [...new Set(FROTA.flatMap((r) => [r.t, r.b, r.c]).filter(Boolean))].sort(),
    []
  );
  const linhaDoBus = onibus.find((o) => String(o.n) === bus)?.l ?? "";

  async function concluir() {
    setMsg(""); setOk(false);
    if (!bus) { setMsg("Escolha o carro."); return; }
    if (!data) { setMsg("Informe a data."); return; }
    if (!cliente.trim()) { setMsg("Informe o cliente."); return; }
    if (!foto) { setMsg("Anexe a foto."); return; }
    const r = await fetch("/api/os", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ onibus_numero: Number(bus), data, cliente: cliente.trim(), tipo, foto_url: "anexada" })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg("Servidor recusou: " + (j.error ?? r.status)); return; }
    setOk(true);
    setMsg(`OS de ${tipo} registrada: carro ${bus} (${linhaDoBus || "sem linha"}) · ${cliente.trim()} · ${data.split("-").reverse().join("/")} · concluída em ${new Date(j.concluida_em).toLocaleString("pt-BR")}.`);
  }

  const inp = { padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--card)", color: "var(--ink)", font: "inherit" as const };

  return (
    <Guarda aba="os">
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 48px" }}>
      <h1 className="font-cond" style={{ fontSize: 28, margin: "0 0 4px" }}>Ordens de serviço (RF10)</h1>
      <p style={{ color: "var(--mut)", marginTop: 0 }}>Geradas na instalação e na retirada. Versão de celular para campo: carro, data, cliente, foto e concluir.</p>
      <div style={{ display: "grid", gap: 10 }}>
        <label>Carro <select value={bus} onChange={(e) => setBus(e.target.value)} aria-label="Carro" style={{ ...inp, width: "100%" }}>
          <option value="">Escolha…</option>
          {onibus.map((o) => <option key={o.n} value={o.n}>{o.n} — {o.l || "reserva"}</option>)}
        </select></label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label>Data <input type="date" value={data} onChange={(e) => setData(e.target.value)} aria-label="Data" style={inp} /></label>
          <label>Tipo <select value={tipo} onChange={(e) => setTipo(e.target.value as never)} aria-label="Tipo" style={inp}>
            <option value="instalacao">Instalação</option><option value="retirada">Retirada</option>
          </select></label>
        </div>
        <label>Cliente <input value={cliente} onChange={(e) => setCliente(e.target.value)} aria-label="Cliente" list="clientes" placeholder="Nome do anunciante" style={{ ...inp, width: "100%" }} />
          <datalist id="clientes">{clientes.map((c) => <option key={c} value={c} />)}</datalist></label>
        <label>Foto da {tipo} <input type="file" accept="image/*" capture="environment" aria-label="Foto"
          onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => setFoto(String(fr.result)); fr.readAsDataURL(f); }} /></label>
        {foto ? <img src={foto} alt="Comprovante de campo" style={{ maxWidth: "100%", borderRadius: 6 }} /> : null}
        <div><button onClick={concluir} style={{ fontWeight: 700 }}>Concluir OS</button></div>
        {msg ? <p role="status" style={{ color: ok ? "var(--ok)" : undefined }}>{msg}</p> : null}
      </div>
    </main>
    </Guarda>
  );
}
