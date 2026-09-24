import { NextResponse } from "next/server";
import { z } from "zod";
import { ehHex, sanitizarSVG, validarLogo } from "@/lib/branding";

export async function GET() {
  return NextResponse.json({ cor_primaria: "#F5B800", cor_secundaria: "#17212B", nome_exibicao: "Expresso Vitória", logo_url: null });
}

const Schema = z.object({ cor_primaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/), cor_secundaria: z.string().regex(/^#[0-9A-Fa-f]{6}$/), nome_exibicao: z.string().max(80).nullable().optional() });

// PUT /api/configuracoes/aparencia — admin; valida + calcula contraste; salva tenant_branding.
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const p = Schema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "Cores devem ser #RRGGBB." }, { status: 400 });
  if (!ehHex(p.data.cor_primaria) || !ehHex(p.data.cor_secundaria)) return NextResponse.json({ error: "Cor inválida." }, { status: 400 });
  return NextResponse.json({ ok: true, ...p.data, nota: "Prévia ao vivo; ao salvar vale p/ toda empresa. Logo via POST /api/configuracoes/logo (valida 300KB + sanitiza SVG)." });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    validarLogo(body.mime ?? "image/png", body.bytes ?? 0);
    if ((body.mime ?? "").includes("svg")) sanitizarSVG(body.svg ?? "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
