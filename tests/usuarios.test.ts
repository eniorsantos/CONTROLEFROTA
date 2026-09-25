import { describe, it, expect } from "vitest";
import { ABAS_PADRAO, abasDe, type Usuario } from "@/lib/usuarios";

const admin: Usuario = { id: "a", nome: "A", email: "a@x", papel: "admin", abas: null };
const lei: Usuario = { id: "l", nome: "L", email: "l@x", papel: "leitura", abas: null };

describe("usuários e abas", () => {
  it("admin vê tudo; leitura vê painel/frota/relatórios", () => {
    expect(abasDe(admin)).toHaveLength(8);
    expect(ABAS_PADRAO.leitura).toEqual(["painel", "frota", "relatorios"]);
    expect(abasDe(lei)).toEqual(["painel", "frota", "relatorios"]);
  });
  it("abas personalizadas vencem o padrão do perfil", () => {
    const u: Usuario = { ...lei, abas: ["painel", "os"] };
    expect(abasDe(u)).toEqual(["painel", "os"]);
  });
  it("ignora abas inexistentes", () => {
    const u: Usuario = { ...admin, abas: ["painel", "xx"] };
    expect(abasDe(u)).toEqual(["painel"]);
  });
});
