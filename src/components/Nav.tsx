"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ABAS, abasDe, usuarioAtual, sair, EVENTO_SESSAO } from "@/lib/usuarios";

// Navegação filtrada pelas abas que o usuário logado pode acessar.
export default function Nav() {
  // Só lê a sessão após o mount: servidor e 1ª render cliente saem idênticos (evita erro de hidratação).
  const [montado, setMontado] = useState(false);
  const [ver, setVer] = useState(0);
  useEffect(() => {
    setMontado(true);
    const f = () => setVer((v) => v + 1);
    window.addEventListener(EVENTO_SESSAO, f);
    return () => window.removeEventListener(EVENTO_SESSAO, f);
  }, []);
  void ver;
  const shell = (
    <nav aria-label="Principal" style={{ borderBottom: "4px solid var(--y)", background: "var(--card)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 16px", display: "flex", gap: 12, flexWrap: "wrap", fontSize: 14, alignItems: "center" }}>
        {montado ? null : <span style={{ color: "var(--mut)" }}>Carregando…</span>}
      </div>
    </nav>
  );
  if (!montado) return shell;
  const u = usuarioAtual();
  const visiveis = u ? ABAS.filter((a) => abasDe(u).includes(a.id)) : [];
  return (
    <nav aria-label="Principal" style={{ borderBottom: "4px solid var(--y)", background: "var(--card)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 16px", display: "flex", gap: 12, flexWrap: "wrap", fontSize: 14, alignItems: "center" }}>
        {visiveis.map((a) => <Link key={a.id} href={a.href} style={{ color: "var(--ink)" }}>{a.rot}</Link>)}
        <span style={{ marginLeft: "auto", color: "var(--mut)" }}>
          {u ? <>{u.nome} ({u.papel}) <button onClick={() => { sair(); location.href = "/login"; }}>Sair</button></> : <Link href="/login" style={{ color: "var(--ink)" }}>Entrar</Link>}
        </span>
      </div>
    </nav>
  );
}
