import { NextResponse } from "next/server";
import { FROTA } from "@/data/frota";
import { montarPainel } from "@/lib/painel";
import { alertasVencimento } from "@/lib/alertas";

// GET /api/alertas/previa — usado pelo cron diário 06:00 (fuso empresa) + envio Resend.
export async function GET() {
  const rows = montarPainel(FROTA);
  const a = alertasVencimento(rows, ["comercial@expressovitoria.com.br"]);
  return NextResponse.json({ total: a.length, amostra: a.slice(0, 5) });
}
