import { NextResponse } from "next/server";
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.foto_url) return NextResponse.json({ error: "OS de campo exige foto." }, { status: 400 });
  return NextResponse.json({ ok: true, concluida_em: new Date().toISOString() });
}
export async function GET() { return NextResponse.json({ nota: "GET /api/os — lista por tenant; PATCH /api/os/:id/concluir com foto (mobile-first)." }); }
