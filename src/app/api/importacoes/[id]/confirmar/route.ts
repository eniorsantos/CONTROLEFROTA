import { NextResponse } from "next/server";

// POST /api/importacoes/:id/confirmar — persiste as linhas válidas da prévia.
// Demo: confirma o recebimento e devolve a contagem; em produção grava
// onibus/linhas/veiculacoes com tenant_id (RLS) + auditoria (RF15).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const validas = Array.isArray(body.validas) ? body.validas : [];
  const total = validas.length || Number(body.total ?? 0);
  if (!total) return NextResponse.json({ error: "Nada para importar." }, { status: 400 });
  return NextResponse.json({
    ok: true,
    id: params.id,
    importadas: total,
    nota: "Demo: prévia confirmada."
  });
}
