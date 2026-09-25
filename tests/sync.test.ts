import { describe, it, expect } from "vitest";
import {
  dividirLinha, extrairLinhas, extrairAnunciantes,
  extrairVeiculacoes, montarLinhaPrototipo
} from "@/lib/sync-map";
import type { LinhaPrototipo } from "@/lib/tipos";

const R: LinhaPrototipo = {
  n: 3600, l: "A0885-V. Abrantes x T. Aeroporto", t: "Galinha Pintadinha",
  b: "Mercantil", p: "VIDRO GRANDE", i: "", r: "", c: "",
  d: "2026-09-08", e: 30, f: "2026-10-08"
};

describe("sync-map", () => {
  it("divide código/nome e trata reserva", () => {
    expect(dividirLinha("A0885-V. Abrantes")).toEqual({ codigo: "A0885", nome: "V. Abrantes" });
    expect(dividirLinha("")).toEqual({ codigo: "reserva", nome: "reserva" });
    expect(dividirLinha("reserva")).toEqual({ codigo: "reserva", nome: "reserva" });
  });
  it("extrai linhas e anunciantes únicos", () => {
    expect(extrairLinhas([R, R])).toHaveLength(1);
    expect(extrairAnunciantes([R])).toEqual(["Galinha Pintadinha", "Mercantil"]);
  });
  it("achata veiculações por posição (painel vira detalhe)", () => {
    const v = extrairVeiculacoes([R]);
    expect(v.map((x) => x.pos).sort()).toEqual(["backseat", "painel", "traseira"]);
    expect(v.find((x) => x.pos === "painel")?.detalhe).toBe("VIDRO GRANDE");
  });
  it("remonta a linha com principal = vence primeiro", () => {
    const m = montarLinhaPrototipo(3600, R.l, [
      { pos: "traseira", anunciante: "A", detalhe: "", inicio: "2026-09-08", periodo: 30 },
      { pos: "backseat", anunciante: "B", detalhe: "", inicio: "2026-09-01", periodo: 30 }
    ]);
    expect(m.t).toBe("A"); expect(m.b).toBe("B");
    expect(m.d).toBe("2026-09-01"); expect(m.f).toBe("2026-10-01");
  });
  it("roundtrip preserva t/b/c/d/e/f", () => {
    const v = extrairVeiculacoes([R]).filter((x) => x.anunciante).map((x) => ({ ...x }));
    const m = montarLinhaPrototipo(R.n, R.l, v);
    expect({ t: m.t, b: m.b, d: m.d, e: m.e, f: m.f }).toEqual({ t: R.t, b: R.b, d: R.d, e: R.e, f: R.f });
  });
});
