import { NextResponse } from "next/server";
import { FROTA } from "@/data/frota";
import { montarPainel } from "@/lib/painel";
import { paraCSV, paraHTMLImpressao } from "@/lib/exportacao";

// GET /api/exportar?tipo=csv|pdf — respeita filtros aplicados (query).
export async function GET(req: Request) {
  const u = new URL(req.url);
  const tipo = u.searchParams.get("tipo") || "csv";
  const rows = montarPainel(FROTA);
  if (tipo === "pdf") {
    return new NextResponse(paraHTMLImpressao(rows, "Expresso Vitória"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  return new NextResponse(paraCSV(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=painel.csv" } });
}
