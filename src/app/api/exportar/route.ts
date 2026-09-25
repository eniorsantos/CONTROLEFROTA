import { NextResponse } from "next/server";
import { FROTA } from "@/data/frota";
import { montarPainel } from "@/lib/painel";
import { relVencidos, relPorFormato, relLivres } from "@/lib/relatorios";
import {
  paraCSV, paraCSVVencidos, paraCSVFormatos, paraCSVLivres,
  paraHTMLImpressao, paraHTMLRelatorio
} from "@/lib/exportacao";
import { fmtBR } from "@/lib/vencimentos";

// GET /api/exportar?tipo=csv|pdf&rel=todos|vencidos|formatos|livres
export async function GET(req: Request) {
  const u = new URL(req.url);
  const tipo = u.searchParams.get("tipo") || "csv";
  const rel = u.searchParams.get("rel") || "todos";
  const rows = montarPainel(FROTA);
  const pdf = { "content-type": "text/html; charset=utf-8" };
  const csv = (n: string) => ({ "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename=${n}.csv` });

  if (rel === "vencidos") {
    const v = relVencidos(rows);
    if (tipo === "pdf") return new NextResponse(paraHTMLRelatorio("Clientes vencidos", "Expresso Vitória",
      ["Nº", "Linha", "Anunciante", "Retirada", "Dias em atraso"],
      v.map((r) => [r.n, r.l, r.m, fmtBR(r.f), Math.abs(r.x ?? 0)])), { headers: pdf });
    return new NextResponse(paraCSVVencidos(v), { headers: csv("vencidos") });
  }
  if (rel === "formatos") {
    const itens = relPorFormato(rows).flatMap((g) => g.itens);
    if (tipo === "pdf") return new NextResponse(paraHTMLRelatorio("Veiculação por formato", "Expresso Vitória",
      ["Formato", "Nº", "Linha", "Anunciante", "Retirada"],
      itens.map((i) => [i.pos, i.n, i.linha, i.anunciante, fmtBR(i.retirada)])), { headers: pdf });
    return new NextResponse(paraCSVFormatos(itens), { headers: csv("por-formato") });
  }
  if (rel === "livres") {
    const v = relLivres(rows);
    if (tipo === "pdf") return new NextResponse(paraHTMLRelatorio("Carros livres", "Expresso Vitória",
      ["Nº", "Linha"], v.map((r) => [r.n, r.l])), { headers: pdf });
    return new NextResponse(paraCSVLivres(v), { headers: csv("livres") });
  }
  if (tipo === "pdf") {
    return new NextResponse(paraHTMLImpressao(rows, "Expresso Vitória"), { headers: pdf });
  }
  return new NextResponse(paraCSV(rows), { headers: csv("painel") });
}
