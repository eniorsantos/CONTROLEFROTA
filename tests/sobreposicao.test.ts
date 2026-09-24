import { describe, it, expect } from "vitest";
import { podeAgendar, encadearRenovacao } from "@/lib/sobreposicao";

describe("sobreposição (RN2 / aceite #2)", () => {
  const base = [{ inicio: "2026-10-01", fim: "2026-10-31", situacao: "ativa" as const }];
  it("recusa terceiro sobreposto", () => {
    const r = podeAgendar(base, { inicio: "2026-10-15", fim: "2026-11-14", situacao: "agendada" });
    expect(r.ok).toBe(false);
  });
  it("aceita encadeado sem sobrepor", () => {
    const r = podeAgendar(base, { inicio: "2026-10-31", fim: "2026-11-30", situacao: "agendada" });
    expect(r.ok).toBe(true);
  });
  it("ignora retirada/cancelada", () => {
    const r = podeAgendar(base, { inicio: "2026-10-15", fim: "2026-11-14", situacao: "retirada" });
    expect(r.ok).toBe(true);
  });
  it("renovar encadeia (RN5)", () => {
    expect(encadearRenovacao("2026-10-31", 30)).toEqual({ inicio: "2026-10-31", fim: "2026-11-30" });
  });
});
