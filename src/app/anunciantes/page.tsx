import { FROTA } from "@/data/frota";

export default function AnunciantesPage() {
  const nomes = [...new Set(FROTA.flatMap((r) => [r.t, r.b, r.c]).filter(Boolean))].sort();
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
      <h1 className="font-cond" style={{ fontSize: 28 }}>Anunciantes e campanhas (RF4/RF5)</h1>
      <p style={{ color: "var(--mut)" }}>{nomes.length} anunciantes identificados na planilha.</p>
      <ul>{nomes.map((n) => <li key={n}>{n} — <a href="/relatorios?anunciante=">relatório do anunciante (RF13)</a></li>)}</ul>
    </main>
  );
}
