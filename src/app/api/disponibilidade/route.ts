import { NextResponse } from "next/server";
import { FROTA } from "@/data/frota";
import { montarPainel } from "@/lib/painel";
import { disponibilidade } from "@/lib/painel";

// GET /api/disponibilidade?linha=&posicao=&de=&ate=
export async function GET(req: Request) {
  const u = new URL(req.url);
  const rows = montarPainel(FROTA);
  const res = disponibilidade(rows, {
    linha: u.searchParams.get("linha") || undefined,
    posicao: (u.searchParams.get("posicao") as never) || undefined,
    de: u.searchParams.get("de") || undefined,
    ate: u.searchParams.get("ate") || undefined
  });
  return NextResponse.json({ total: res.length, itens: res.slice(0, 100) });
}
