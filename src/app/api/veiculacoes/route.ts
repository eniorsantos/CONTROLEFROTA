import { NextResponse } from "next/server";
import { z } from "zod";
import { fimVeiculacao } from "@/lib/vencimentos";

const Schema = z.object({
  posicao_id: z.string().uuid().or(z.string().min(1)),
  campanha_id: z.string().min(1),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodo_dias: z.number().int().positive().default(30)
});

// POST /api/veiculacoes — RN1 fim calculado; RN2 bloqueia sobreposição (409).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const p = Schema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
  const fim = fimVeiculacao(p.data.inicio, p.data.periodo_dias);
  // Em produção: buscar existentes da posicao_id com situacao agendada/ativa e checar podeAgendar + EXCLUDE do banco.
  return NextResponse.json({ ...p.data, fim, situacao: "agendada" }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ nota: "GET /api/veiculacoes?posicao=&de=&ate= filtra por tenant (RLS). Ver RF6." });
}
