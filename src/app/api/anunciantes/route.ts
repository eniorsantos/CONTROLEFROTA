import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ nota: "CRUD linhas/anunciantes/campanhas/tipos-posicao/os — mesmo padrão: auth + papel + tenant_id (RLS)." }); }
export async function POST(req: Request) { return NextResponse.json({ ok: true, ...(await req.json().catch(() => ({}))) }, { status: 201 }); }
