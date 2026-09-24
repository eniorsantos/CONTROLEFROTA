import { FROTA } from "@/data/frota";
import { paraCSV } from "@/lib/exportacao";

export default function RelatoriosPage() {
  const csv = paraCSV(FROTA.map((r) => ({ ...r, s: "Em campanha" as const, x: 10, code: "", ads: [], m: r.t || r.b || r.c, q: "" })));
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
      <h1 className="font-cond" style={{ fontSize: 28 }}>Relatórios (RF12/RF13)</h1>
      <p style={{ color: "var(--mut)" }}>Exportação XLSX/PDF com filtros aplicados + relatório do anunciante com link compartilhável.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <a href="/api/exportar?tipo=csv" style={{ border: "1px solid var(--line)", padding: "8px 12px", borderRadius: 6 }}>Baixar CSV</a>
        <a href="/api/exportar?tipo=pdf" style={{ border: "1px solid var(--line)", padding: "8px 12px", borderRadius: 6 }}>Abrir PDF (impressão)</a>
      </div>
      <pre style={{ fontSize: 12, overflow: "auto", background: "var(--card)", padding: 12 }}>{csv.slice(0, 600)}…</pre>
    </main>
  );
}
