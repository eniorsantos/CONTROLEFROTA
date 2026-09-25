// Controle de usuários: perfil + abas permitidas por usuário + sessão demo.
// Produção: papel em `membros.papel` e abas em `membros.abas` (migration 0002);
// aqui, espelhado em localStorage.
import type { Papel } from "./tipos";

export interface Aba { id: string; rot: string; href: string; }

export const ABAS: Aba[] = [
  { id: "painel", rot: "Painel", href: "/" },
  { id: "editar", rot: "Editar", href: "/editar" },
  { id: "frota", rot: "Frota", href: "/frota" },
  { id: "os", rot: "Ordens de serviço", href: "/os" },
  { id: "importacao", rot: "Importação", href: "/importacao" },
  { id: "relatorios", rot: "Relatórios", href: "/relatorios" },
  { id: "configuracoes", rot: "Configurações", href: "/configuracoes" },
  { id: "usuarios", rot: "Usuários", href: "/usuarios" }
];

/** Abas padrão de cada perfil (admin pode mudar por usuário na tela /usuarios). */
export const ABAS_PADRAO: Record<Papel, string[]> = {
  admin: ABAS.map((a) => a.id),
  comercial: ["painel", "editar", "frota", "importacao", "relatorios"],
  operacao: ["painel", "frota", "os"],
  leitura: ["painel", "frota", "relatorios"]
};

export interface Usuario { id: string; nome: string; email: string; papel: Papel; abas: string[] | null; }

const LS_USU = "usuarios";
const LS_SESS = "sessao";
export const EVENTO_SESSAO = "sessao";

function seed(): Usuario[] {
  return [
    { id: "u-admin", nome: "Admin Vitória", email: "admin@expressovitoria.com.br", papel: "admin", abas: null },
    { id: "u-com", nome: "Comercial", email: "comercial@expressovitoria.com.br", papel: "comercial", abas: null },
    { id: "u-op", nome: "Equipe Campo", email: "campo@expressovitoria.com.br", papel: "operacao", abas: null },
    { id: "u-lei", nome: "Consulta", email: "consulta@expressovitoria.com.br", papel: "leitura", abas: null }
  ];
}

export function carregarUsuarios(): Usuario[] {
  try {
    const s = localStorage.getItem(LS_USU);
    if (s) {
      const j = JSON.parse(s);
      if (Array.isArray(j) && j.length) return j as Usuario[];
    }
  } catch {}
  const s = seed();
  try { localStorage.setItem(LS_USU, JSON.stringify(s)); } catch {}
  return s;
}

export function salvarUsuarios(u: Usuario[]): void {
  try {
    localStorage.setItem(LS_USU, JSON.stringify(u));
    window.dispatchEvent(new Event(EVENTO_SESSAO));
  } catch {}
}

/** Abas efetivas: personalizadas do usuário ou padrão do perfil. */
export function abasDe(u: Usuario): string[] {
  if (u.abas) return u.abas.filter((a) => ABAS.some((b) => b.id === a));
  return ABAS_PADRAO[u.papel] ?? [];
}

export function usuarioAtual(): Usuario | null {
  try {
    const id = localStorage.getItem(LS_SESS);
    if (!id) return null;
    return carregarUsuarios().find((u) => u.id === id) ?? null;
  } catch { return null; }
}

export function entrar(id: string): void {
  try {
    localStorage.setItem(LS_SESS, id);
    window.dispatchEvent(new Event(EVENTO_SESSAO));
  } catch {}
}

export function sair(): void {
  try {
    localStorage.removeItem(LS_SESS);
    window.dispatchEvent(new Event(EVENTO_SESSAO));
  } catch {}
}

/** Pode acessar a aba? Sem sessão, nega tudo (exceto /login, que não usa Guarda). */
export function pode(aba: string): boolean {
  const u = usuarioAtual();
  if (!u) return false;
  return abasDe(u).includes(aba);
}
