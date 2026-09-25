"use client";
import { useEffect } from "react";

// Aplica em todas as páginas as cores/logo salvas em Configurações (localStorage "cfg").
// Em produção, estes valores vêm de tenant_branding via /api/configuracoes/aparencia.
export default function AplicarTema() {
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("cfg") || "{}");
      const st = document.documentElement.style;
      const mapa: Record<string, string> = {
        y: "--y", th: "--th", bg: "--bg", card: "--card",
        ink: "--ink", mut: "--mut", line: "--line"
      };
      for (const [k, v] of Object.entries(mapa)) {
        if (typeof s[k] === "string" && s[k]) st.setProperty(v, s[k]);
      }
    } catch {}
  }, []);
  return null;
}
