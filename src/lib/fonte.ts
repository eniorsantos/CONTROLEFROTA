// Fonte de dados da interface: nuvem (localStorage 'frota-cloud', vinda do /api/sync)
// ou seed local FROTA. Edições manuais (/editar) aplicam-se por cima.
import type { LinhaPrototipo } from "./tipos";
import { FROTA } from "@/data/frota";

export const CHAVE_NUVEM = "frota-cloud";
const CHAVE_AUTO = "sync-auto";
export const EVENTO_NUVEM = "frota-cloud";

export function carregarBase(): LinhaPrototipo[] {
  try {
    const s = localStorage.getItem(CHAVE_NUVEM);
    if (s) {
      const j = JSON.parse(s);
      if (Array.isArray(j) && j.length) return j as LinhaPrototipo[];
    }
  } catch {}
  return FROTA;
}

export function salvarBase(rows: LinhaPrototipo[]): void {
  try {
    localStorage.setItem(CHAVE_NUVEM, JSON.stringify(rows));
    window.dispatchEvent(new Event(EVENTO_NUVEM));
  } catch {}
}

export function limparBase(): void {
  try {
    localStorage.removeItem(CHAVE_NUVEM);
    window.dispatchEvent(new Event(EVENTO_NUVEM));
  } catch {}
}

export function autoLigado(): boolean {
  try { return localStorage.getItem(CHAVE_AUTO) === "1"; } catch { return false; }
}

export function definirAuto(v: boolean): void {
  try { localStorage.setItem(CHAVE_AUTO, v ? "1" : "0"); } catch {}
}
