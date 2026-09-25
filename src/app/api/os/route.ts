import { NextResponse } from "next/server";
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.onibus_numero) return NextResponse.json({ error: "Informe o carro (onibus_numero)." }, { status: 400 });
  if (!body.data || !/^\d{4}-\d{2}-\d{2}$/.test(body.data)) return NextResponse.json({ error: "Informe a data (aaaa-mm-dd)." }, { status: 400 });
  if (!body.cliente) return NextResponse.json({ error: "Informe o cliente." }, { status: 400 });
  if (!body.foto_url) return NextResponse.json({ error: "OS de campo exige foto." }, { status: 400 });
  return NextResponse.json({
    ok: true, onibus_numero: body.onibus_numero, data: body.data,
    cliente: body.cliente, tipo: body.tipo === "retirada" ? "retirada" : "instalacao",
    concluida_em: new Date().toISOString()
  });
}
export async function GET() { return NextResponse.json({ nota: "GET /api/os — lista por tenant; PATCH /api/os/:id/concluir com foto (mobile-first)." }); }
