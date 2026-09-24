import { describe, it, expect } from "vitest";
import { situacao, fimVeiculacao, diasParaFim } from "@/lib/vencimentos";
import { montarPainel } from "@/lib/painel";
import { FROTA } from "@/data/frota";

const HOJE = new Date(2026, 8, 24); // 24/09/2026 — data do aceite

describe("vencimentos (RF7)", () => {
  it("fim antes de hoje = Vencido", () => {
    expect(situacao({ t: "X", b: "", p: "", i: "", c: "", f: "2026-09-10" }, HOJE).s).toBe("Vencido");
  });
  it("vence em 7 dias", () => {
    expect(situacao({ t: "X", b: "", p: "", i: "", c: "", f: "2026-09-25" }, HOJE).s).toBe("Vence em 7 dias");
  });
  it("em campanha", () => {
    expect(situacao({ t: "X", b: "", p: "", i: "", c: "", f: "2026-10-08" }, HOJE).s).toBe("Em campanha");
  });
  it("disponível sem anunciante", () => {
    expect(situacao({ t: "", b: "", p: "", i: "", c: "", f: "2026-10-08" }, HOJE).s).toBe("Disponível");
  });
  it("fim = inicio + periodo (RN1)", () => {
    expect(fimVeiculacao("2026-09-08", 30)).toBe("2026-10-08");
    expect(fimVeiculacao("2026-09-09", 60)).toBe("2026-11-08");
  });
  it("aceite #1: 171 ônibus no painel", () => {
    expect(FROTA.length).toBe(171);
    expect(montarPainel(FROTA, HOJE).length).toBe(171);
  });
  it("dias Para Fim", () => {
    expect(diasParaFim("2026-09-25", HOJE)).toBe(1);
  });
});
