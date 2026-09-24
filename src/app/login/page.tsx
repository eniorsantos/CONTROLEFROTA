"use client";
export default function LoginPage() {
  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 className="font-cond" style={{ fontSize: 28 }}>Entrar</h1>
      <p style={{ color: "var(--mut)" }}>E-mail e senha, convite de usuário e recuperação de senha. RLS isola cada empresa.</p>
      <form onSubmit={(e) => e.preventDefault()} style={{ display: "grid", gap: 8 }}>
        <input placeholder="E-mail" type="email" required aria-label="E-mail" />
        <input placeholder="Senha" type="password" required aria-label="Senha" />
        <button type="submit">Entrar</button>
        <a href="#">Esqueci a senha</a>
      </form>
    </main>
  );
}
