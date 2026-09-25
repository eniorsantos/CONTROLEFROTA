import { describe, it, expect } from "vitest";
import { relVencidos, relPorFormato, relLivres, posicoesLivres } from "@/lib/relatorios";
import { montarPainel } from "@/lib/painel";
import { FROTA } from "@/data/frota";

const HOJE = new Date(2026, 8, 24);
const rows = montarPainel(FROTA, HOJE);

describe("relatórios", () => {
  it("vencidos: só Vencido, do mais atrasado ao menos", () => {
    const v = relVencidos(rows);
    expect(v.length).toBeGreaterThan(0);
    expect(v.every((r) => r.s === "Vencido")).toBe(true);
    for (let i = 1; i < v.length; i++) expect((v[i].x ?? 0) >= (v[i - 1].x ?? 0)).toBe(true);
  });
  it("por formato: soma por posição confere com a base", () => {
    const g = relPorFormato(rows);
    const tras = g.find((x) => x.pos === "Traseira")!;
    expect(tras.total).toBe(rows.filter((r) => r.t).length);
    expect(g.find((x) => x.pos === "Backseat")!.total).toBe(rows.filter((r) => r.b).length);
    expect(g.find((x) => x.pos === "Institucional")!.total).toBe(rows.filter((r) => r.c).length);
  });
  it("livres: só Disponível; vagas = total − ocupadas", () => {
    const l = relLivres(rows);
    expect(l.every((r) => r.s === "Disponível")).toBe(true);
    const v = posicoesLivres(rows);
    expect(v.find((x) => x.pos === "Traseira")!.livres).toBe(rows.length - rows.filter((r) => r.t).length);
  });
});
