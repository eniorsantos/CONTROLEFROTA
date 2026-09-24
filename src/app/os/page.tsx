"use client";
import { useState } from "react";

export default function OSPage() {
  const [foto, setFoto] = useState("");
  const [ok, setOk] = useState(false);
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>
      <h1 className="font-cond" style={{ fontSize: 28 }}>Ordens de serviço (RF10)</h1>
      <p style={{ color: "var(--mut)" }}>Geradas na instalação e na retirada. Versão de celular para campo: foto + concluir.</p>
      <label>Foto da instalação/retirada <input type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => setFoto(String(fr.result)); fr.readAsDataURL(f); }} /></label>
      {foto ? <img src={foto} alt="Comprovante de campo" style={{ maxWidth: "100%", marginTop: 12 }} /> : null}
      <div><button onClick={() => setOk(true)} disabled={!foto}>Concluir OS</button></div>
      {ok ? <p role="status">OS concluída com foto. (PATCH /api/os/:id/concluir)</p> : null}
    </main>
  );
}
