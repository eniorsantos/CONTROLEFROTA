"use client";
import { useState, useEffect } from "react";
import { carregarUsuarios, entrar, type Usuario } from "@/lib/usuarios";

export default function LoginPage() {
  // Lista começa vazia (igual no servidor) e carrega após o mount.
  const [users, setUsers] = useState<Usuario[]>([]);
  useEffect(() => { setUsers(carregarUsuarios()); }, []);
  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h1 className="font-cond" style={{ fontSize: 28, margin: "0 0 4px" }}>Entrar</h1>
      <p style={{ color: "var(--mut)", marginTop: 0 }}>
        Escolha o usuário (demonstração; em produção, e-mail + senha via Supabase Auth,
        com vínculo em <code>membros</code>). Cada perfil vê só suas abas.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {users.map((u) => (
          <div key={u.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ flex: 1 }}>
              <b>{u.nome}</b><br />
              <span style={{ color: "var(--mut)", fontSize: 13 }}>{u.email} · {u.papel}</span>
            </div>
            <button onClick={() => { entrar(u.id); location.href = "/"; }}>Entrar</button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13 }}><a href="#">Esqueci a senha</a> · <a href="/usuarios">Gerenciar usuários (admin)</a></p>
    </main>
  );
}
