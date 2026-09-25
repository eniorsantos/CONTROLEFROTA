import { describe, it, expect } from "vitest";
import { previaImportacao, parecidos } from "@/lib/importacao";
import { contraste, sanitizarSVG, validarLogo, ehHex } from "@/lib/branding";
import { alertasVencimento } from "@/lib/alertas";
import { montarPainel } from "@/lib/painel";
import { FROTA } from "@/data/frota";

describe("importação (RF11/§6.4)", () => {
  it("ignora '.' e 'o', avisa sem data, reserva vira reserva", () => {
    const p = previaImportacao([
      { B: 1, C: "A1-x", D: ".", E: "o", J: "", K: 30, L: "" },
      { B: 2, C: "reserva", D: "", I: "Cli", J: "2026-06-18", K: 30, L: "2026-07-18" },
      { B: 3, C: "A2-y", D: "Cli2", J: "", K: 30, L: "" }
    ]);
    expect(p.validas[0].t).toBe("");
    expect(p.erros.some((e) => e.campo === "J")).toBe(true);
  });
  it("sugere junção Bahiaha/Bahia", () => {
    expect(parecidos("Faculdade Bahiaha", "Faculdade Bahia")).toBe(true);
  });
  it("lê datas em serial do Excel e Date", () => {
    const p = previaImportacao([
      { B: 1, C: "A1-x", D: "Cli", J: 45910, K: 30, L: 45940 },
      { B: 2, C: "A2-y", D: "Cli", J: new Date(2026, 8, 8), K: 30, L: "08/10/2026" }
    ]);
    expect(p.validas[0].d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.validas[0].f > p.validas[0].d).toBe(true);
    expect(p.validas[1].d).toBe("2026-09-08");
    expect(p.validas[1].f).toBe("2026-10-08");
  });
});

describe("branding (aceite #5)", () => {
  it("valida hex e calcula contraste", () => {
    expect(ehHex("#F5B800")).toBe(true);
    const c = contraste("#17212b");
    expect(c.texto).toBe("#ffffff");
  });
  it("rejeita logo >300KB e sanitiza svg", () => {
    expect(() => validarLogo("image/png", 400 * 1024)).toThrow();
    expect(sanitizarSVG('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')).not.toContain("<script");
  });
});

describe("alertas (aceite #3)", () => {
  it("gera alerta 7 dias antes", () => {
    const rows = montarPainel(
      [
        { n: 9001, l: "A000-x", t: "Cliente 7d", b: "", p: "", i: "", r: "", c: "", d: "2026-09-01", e: 30, f: "2026-10-01" },
        ...FROTA.slice(0, 5)
      ],
      new Date(2026, 8, 24)
    );
    const a = alertasVencimento(rows, ["a@e.com"]);
    expect(a.some((x) => x.dias === 7)).toBe(true);
  });
});

describe("isolamento (aceite #4 — simulação; prova real exige banco com RLS)", () => {
  it("RLS filtra por tenant — simulação", () => {
    const linhas = [
      { tenant_id: "A", n: 1 },
      { tenant_id: "B", n: 2 }
    ];
    const visivel = (tenant: string) => linhas.filter((l) => l.tenant_id === tenant);
    expect(visivel("A").map((l) => l.n)).toEqual([1]);
    expect(visivel("A").some((l) => l.tenant_id === "B")).toBe(false);
  });
});
