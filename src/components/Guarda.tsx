"use client";
import { useState, useEffect } from "react";
import { pode, EVENTO_SESSAO } from "@/lib/usuarios";

// Guarda de página: só renderiza para quem pode acessar a aba.
export default function Guarda({ aba, children }: { aba: string; children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const f = () => setOk(pode(aba));
    f();
    window.addEventListener(EVENTO_SESSAO, f);
    return () => window.removeEventListener(EVENTO_SESSAO, f);
  }, [aba]);
  if (ok === null) return null;
  if (!ok) {
    return (
      <main style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
        <h1 className="font-cond" style={{ fontSize: 28 }}>Acesso negado</h1>
        <p style={{ color: "var(--mut)" }}>Seu usuário não tem acesso a esta aba. Fale com o administrador ou <a href="/login">troque de usuário</a>.</p>
      </main>
    );
  }
  return <>{children}</>;
}
