import { NextResponse } from "next/server";
import { previaImportacao } from "@/lib/importacao";

// POST /api/importacoes — envio (prévia com erros); POST /api/importacoes/:id/confirmar confirma.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({ linhas: [] }));
  const prev = previaImportacao(body.linhas ?? []);
  return NextResponse.json({ id: "previa-demo", total: prev.validas.length, erros: prev.erros, sugestoes: prev.sugestoesJuncao, validasAmostra: prev.validas.slice(0, 5) });
}
