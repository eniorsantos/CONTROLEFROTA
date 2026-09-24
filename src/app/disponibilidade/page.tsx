"use client";
import { useState } from "react";
import { FROTA } from "@/data/frota";
import { montarPainel } from "@/lib/painel";
import { disponibilidade } from "@/lib/painel";

export default function DispPage() {
  const rows = montarPainel(FROTA);
  const [linha, setLinha] = useState("");
  const [pos, setPos] = useState<"t" | "b" | "p" | "c" | "">("");
  const res = disponibilidade(rows, { linha: linha || undefined, posicao: (pos || undefined) as never });
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
      <h1 className="font-cond" style={{ fontSize: 28 }}>Disponibilidade (RF8)</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="Código linha ex. A0885" value={linha} onChange={(e) => setLinha(e.target.value)} aria-label="Linha" />
        <select value={pos} onChange={(e) => setPos(e.target.value as never)} aria-label="Posição">
          <option value="">Qualquer posição</option><option value="t">Traseira</option><option value="b">Backseat</option><option value="p">Painel</option><option value="c">Institucional</option>
        </select>
      </div>
      <p style={{ color: "var(--mut)" }}>{res.length} posições livres no filtro.</p>
      <ul>{res.slice(0, 20).map((r) => <li key={r.n}>{r.n} · {r.l} · {r.m || "livre"}</li>)}</ul>
    </main>
  );
}
