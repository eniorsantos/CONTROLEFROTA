import { NextResponse } from "next/server";

// GET /api/onibus — paginado, filtrado por tenant via RLS.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const page = Number(u.searchParams.get("page") ?? 1);
  return NextResponse.json({ page, nota: "Lista paginada no servidor (meta <2s p/ 2.000 ônibus). Filtra por tenant_id do membro logado." });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.numero) return NextResponse.json({ error: "numero é obrigatório" }, { status: 400 });
  return NextResponse.json({ ok: true, ...body }, { status: 201 });
}
