import Guarda from "@/components/Guarda";
import { FROTA } from "@/data/frota";
import { montarPainel } from "@/lib/painel";

export default function FrotaPage() {
  const rows = montarPainel(FROTA);
  return (
    <Guarda aba="frota">
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px" }}>
      <h1 className="font-cond" style={{ fontSize: 28 }}>Frota (RF1)</h1>
      <p style={{ color: "var(--mut)" }}>Número, linha, situação (ativo, reserva, manutenção, baixado). {rows.length} ônibus.</p>
      <div style={{ overflowX: "auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 6 }}>
        <table style={{ width: "100%", minWidth: 640, fontSize: 14, borderCollapse: "collapse" }}>
          <thead><tr>{["Nº", "Linha", "Status", "Situação mídia"].map((h) => <th key={h} style={{ textAlign: "left", background: "var(--th)", color: "#fff", padding: 8 }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.n}><td style={{ padding: 8, borderTop: "1px solid var(--line)" }}>{r.n}</td><td style={{ padding: 8, borderTop: "1px solid var(--line)" }}>{r.l}</td><td style={{ padding: 8, borderTop: "1px solid var(--line)" }}>{r.l === "reserva" ? "reserva" : "ativo"}</td><td style={{ padding: 8, borderTop: "1px solid var(--line)" }}>{r.s}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
    </Guarda>
  );
}
