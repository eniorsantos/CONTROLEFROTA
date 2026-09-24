import { NextResponse } from "next/server";
import { FROTA } from "@/data/frota";
import { montarPainel, resumoPainel, ocupacaoPorPosicao, proximosAVencer } from "@/lib/painel";

// GET /api/painel/resumo — exige auth + tenant (RLS). Demo usa seed 171.
export async function GET(req: Request) {
  const tenant = req.headers.get("x-tenant-id") ?? "demo";
  const rows = montarPainel(FROTA);
  return NextResponse.json({ tenant, resumo: resumoPainel(rows), ocupacao: ocupacaoPorPosicao(rows), vencimentos: proximosAVencer(rows, 6), total: rows.length });
}
