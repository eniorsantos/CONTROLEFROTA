"use client";
import { useState } from "react";
import { contraste, ehHex, sanitizarSVG, validarLogo } from "@/lib/branding";

export default function ConfigPage() {
  const [cor, setCor] = useState("#f5b800");
  const [msg, setMsg] = useState("");
  const c = contraste(cor);
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>
      <h1 className="font-cond" style={{ fontSize: 28 }}>Configurações · Aparência (§5)</h1>
      <p style={{ color: "var(--mut)" }}>Logo PNG/JPG/SVG até 300 KB · cores #RRGGBB · nome de exibição · restaurar padrão. Contraste calculado automaticamente.</p>
      <label>Cor de destaque <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} /></label>
      <p>Válida: {ehHex(cor) ? "sim" : "não"} · texto sugerido: {c.texto} · contraste {c.ratio}:1 · WCAG AA: {c.aa ? "OK" : "AVISO — combinação abaixo do mínimo"}</p>
      <button onClick={() => {
        try {
          validarLogo("image/svg+xml", 1024);
          sanitizarSVG('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>');
          setMsg("SVG sanitizado e válido. Salvo em tenant_branding + Storage.");
        } catch (e) { setMsg(String((e as Error).message)); }
      }}>Testar sanitização SVG</button>
      {msg ? <p role="status">{msg}</p> : null}
      <h2 className="font-cond">Planos (fixo)</h2>
      <ul><li>Essencial R$ 249/mês — painel, veiculações, alertas e-mail, importação</li><li>Profissional R$ 549/mês — OS com foto, relatório anunciante, WhatsApp, logo e cores</li><li>Empresarial sob consulta — domínio próprio, suporte prioritário</li></ul>
    </main>
  );
}
