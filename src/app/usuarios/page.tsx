"use client";
import { useState, useEffect } from "react";
import Guarda from "@/components/Guarda";
import {
  ABAS, carregarUsuarios, salvarUsuarios, abasDe,
  type Usuario
} from "@/lib/usuarios";
import type { Papel } from "@/lib/tipos";

const PAPEIS: Papel[] = ["admin", "comercial", "operacao", "leitura"];

function Corpo() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("leitura");
  const [msg, setMsg] = useState("");

  useEffect(() => { setUsers(carregarUsuarios()); }, []);

  function persistir(n: Usuario[]) {
    setUsers(n); salvarUsuarios(n);
  }

  function mudarPapel(id: string, p: Papel) {
    persistir(users.map((u) => (u.id === id ? { ...u, papel: p, abas: null } : u)));
    setMsg("Perfil atualizado (abas voltaram ao padrão do perfil; ajuste abaixo se precisar).");
  }

  function toggleAba(id: string, aba: string) {
    persistir(users.map((u) => {
      if (u.id !== id) return u;
      const atual = new Set(abasDe(u));
      if (atual.has(aba)) atual.delete(aba); else atual.add(aba);
      return { ...u, abas: [...atual] };
    }));
  }

  function usarPadrao(id: string) {
    persistir(users.map((u) => (u.id === id ? { ...u, abas: null } : u)));
  }

  function adicionar() {
    if (!nome.trim() || !email.trim()) { setMsg("Informe nome e e-mail."); return; }
    persistir([...users, { id: `u-${Date.now()}`, nome: nome.trim(), email: email.trim(), papel, abas: null }]);
    setNome(""); setEmail(""); setMsg("Usuário criado com as abas padrão do perfil.");
  }

  function remover(id: string) {
    if (users.length <= 1) { setMsg("Não é possível remover o último usuário."); return; }
    persistir(users.filter((u) => u.id !== id));
  }

  const inp = { padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--card)", color: "var(--ink)", font: "inherit" as const };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px 48px" }}>
      <h1 className="font-cond" style={{ fontSize: 28, margin: "0 0 4px" }}>Usuários e acessos</h1>
      <p style={{ color: "var(--mut)", marginTop: 0 }}>
        Defina o perfil e, por usuário, quais abas ele pode acessar.
        Em produção, perfil em <code>membros.papel</code> e abas em <code>membros.abas</code> (migration 0002).
      </p>
      {msg ? <p role="status">{msg}</p> : null}
      {users.map((u) => (
        <div key={u.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6, padding: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <b>{u.nome}</b><span style={{ color: "var(--mut)", fontSize: 13 }}>{u.email}</span>
            <label>Perfil <select value={u.papel} onChange={(e) => mudarPapel(u.id, e.target.value as Papel)} aria-label={`Perfil de ${u.nome}`} style={inp}>
              {PAPEIS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select></label>
            <button onClick={() => usarPadrao(u.id)}>Abas padrão do perfil</button>
            <button onClick={() => remover(u.id)}>Remover</button>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            {ABAS.map((a) => (
              <label key={a.id} style={{ fontSize: 14 }}>
                <input type="checkbox" checked={abasDe(u).includes(a.id)} onChange={() => toggleAba(u.id, a.id)} /> {a.rot}
              </label>
            ))}
          </div>
        </div>
      ))}
      <h2 className="font-cond" style={{ fontSize: 20 }}>Novo usuário</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} aria-label="Nome" style={inp} />
        <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="E-mail" style={inp} />
        <select value={papel} onChange={(e) => setPapel(e.target.value as Papel)} aria-label="Perfil" style={inp}>
          {PAPEIS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={adicionar}>Adicionar</button>
      </div>
    </main>
  );
}

export default function Page() {
  return <Guarda aba="usuarios"><Corpo /></Guarda>;
}
