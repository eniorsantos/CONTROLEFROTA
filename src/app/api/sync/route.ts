import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import {
  extrairLinhas, extrairAnunciantes, extrairVeiculacoes,
  montarLinhaPrototipo, type ItemVeic
} from "@/lib/sync-map";
import type { LinhaPrototipo } from "@/lib/tipos";

const TIPOS_PADRAO = ["traseira", "backseat", "painel", "institucional"];

async function resolverTenant(sb: ReturnType<typeof supabaseAdmin>, tenantId?: string): Promise<string> {
  if (tenantId) {
    if (!/^[0-9a-fA-F-]{36}$/.test(tenantId)) throw new Error("UUID: tenant_id inválido.");
    return tenantId;
  }
  const { data, error } = await sb.from("tenants").select("id").order("criado_em").limit(1).maybeSingle();
  if (error || !data) throw new Error("Nenhum tenant encontrado. Crie a empresa primeiro (guia §3.4).");
  return (data as { id: string }).id;
}

// GET /api/sync?tenant_id= — PULL: lê o banco e devolve linhas no formato planilha.
export async function GET(req: Request) {
  let sb: SupabaseClient;
  try { sb = supabaseAdmin(); } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
  try {
    const u = new URL(req.url);
    const tenant = await resolverTenant(sb, u.searchParams.get("tenant_id") || undefined);

    const linhas = (await sb.from("linhas").select("id,codigo,nome").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; codigo: string; nome: string }[];
    }));
    const onibus = (await sb.from("onibus").select("numero,linha_id,status").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { numero: string; linha_id: string | null; status: string }[];
    }));
    const tipos = (await sb.from("tipos_posicao").select("id,nome").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; nome: string }[];
    }));
    const tipoNome = new Map(tipos.map((t) => [t.id, t.nome]));
    const pos = (await sb.from("posicoes").select("id,onibus_id,tipo_id,detalhe").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; onibus_id: string; tipo_id: string; detalhe: string | null }[];
    }));
    const anun = (await sb.from("anunciantes").select("id,nome").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; nome: string }[];
    }));
    const anunNome = new Map(anun.map((a) => [a.id, a.nome]));
    const camps = (await sb.from("campanhas").select("id,anunciante_id").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; anunciante_id: string }[];
    }));
    const campAnun = new Map(camps.map((c) => [c.id, anunNome.get(c.anunciante_id) ?? ""]));
    const veic = (await sb.from("veiculacoes").select("posicao_id,campanha_id,inicio,periodo_dias").eq("tenant_id", tenant).in("situacao", ["agendada", "ativa"]).then((r) => {
      if (r.error) throw new Error(r.error.message);
      return r.data as { posicao_id: string; campanha_id: string; inicio: string; periodo_dias: number }[];
    }));

    // mapas auxiliares via buscas por id
    const busIds = (await sb.from("onibus").select("id,numero").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; numero: string }[];
    }));
    const busNum = new Map(busIds.map((b) => [b.id, Number(b.numero)]));
    const posBus = new Map(pos.map((p) => [p.id, p]));
    const linhaTxt = new Map(linhas.map((l) => [l.id, `${l.codigo}-${l.nome}`]));
    const busLinha = new Map(onibus.map((o) => [o.numero, o.linha_id ? linhaTxt.get(o.linha_id) ?? "" : "reserva"]));

    const porBus = new Map<number, { linha: string; itens: ItemVeic[] }>();
    for (const o of onibus) {
      porBus.set(Number(o.numero), { linha: busLinha.get(o.numero) ?? "", itens: [] });
    }
    for (const v of veic) {
      const p = posBus.get(v.posicao_id);
      if (!p) continue;
      const num = busNum.get(p.onibus_id);
      if (num === undefined) continue;
      const g = porBus.get(num);
      if (!g) continue;
      g.itens.push({
        pos: (tipoNome.get(p.tipo_id) ?? "traseira") as ItemVeic["pos"],
        anunciante: campAnun.get(v.campanha_id) ?? "",
        detalhe: p.detalhe ?? "",
        inicio: v.inicio,
        periodo: v.periodo_dias
      });
    }
    const saida: LinhaPrototipo[] = [...porBus.entries()].map(([n, g]) => montarLinhaPrototipo(n, g.linha, g.itens));
    return NextResponse.json({ tenant, total: saida.length, linhas: saida, origem: "supabase" });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg.startsWith("UUID:") ? 400 : 500 });
  }
}

// POST /api/sync — PUSH: recebe {tenant_id?, linhas[]} e grava no banco (upserts + recria veiculações ativas).
export async function POST(req: Request) {
  let sb: SupabaseClient;
  try { sb = supabaseAdmin(); } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const linhas = (body.linhas ?? []) as LinhaPrototipo[];
    if (!linhas.length) return NextResponse.json({ error: "Nada para enviar." }, { status: 400 });
    const tenant = await resolverTenant(sb, body.tenant_id || undefined);

    // tipos padrão
    for (const nome of TIPOS_PADRAO) {
      const r = await sb.from("tipos_posicao").upsert({ tenant_id: tenant, nome }, { onConflict: "tenant_id,nome" });
      if (r.error) throw new Error("tipos: " + r.error.message);
    }
    const tipos = (await sb.from("tipos_posicao").select("id,nome").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; nome: string }[];
    }));
    const tipoId = new Map(tipos.map((t) => [t.nome, t.id]));

    // linhas
    const upsLinhas = extrairLinhas(linhas).map((l) => ({ tenant_id: tenant, codigo: l.codigo, nome: l.nome }));
    {
      const r = await sb.from("linhas").upsert(upsLinhas, { onConflict: "tenant_id,codigo" });
      if (r.error) throw new Error("linhas: " + r.error.message);
    }
    const dbLinhas = (await sb.from("linhas").select("id,codigo").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; codigo: string }[];
    }));
    const linhaId = new Map(dbLinhas.map((l) => [l.codigo, l.id]));
    const codigoDe = (l: string) => {
      const s = (l || "").trim(); const i = s.indexOf("-");
      return (i < 0 ? s : s.slice(0, i).trim()) || "reserva";
    };

    // ônibus
    const upsBus = linhas.map((r) => ({
      tenant_id: tenant,
      numero: String(r.n),
      linha_id: linhaId.get(codigoDe(r.l)) ?? null,
      status: r.l === "reserva" ? "reserva" : "ativo"
    }));
    {
      const r = await sb.from("onibus").upsert(upsBus, { onConflict: "tenant_id,numero" });
      if (r.error) throw new Error("onibus: " + r.error.message);
    }

    // anunciantes + campanha Geral
    for (const nome of extrairAnunciantes(linhas)) {
      const r = await sb.from("anunciantes").upsert({ tenant_id: tenant, nome }, { onConflict: "tenant_id,nome" });
      if (r.error) throw new Error("anunciantes: " + r.error.message);
    }
    const dbAnun = (await sb.from("anunciantes").select("id,nome").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; nome: string }[];
    }));
    const anunId = new Map(dbAnun.map((a) => [a.nome, a.id]));
    for (const [, id] of anunId) {
      const ex = await sb.from("campanhas").select("id").eq("tenant_id", tenant).eq("anunciante_id", id).limit(1);
      if (!ex.error && !ex.data?.length) {
        await sb.from("campanhas").insert({ tenant_id: tenant, anunciante_id: id, nome: "Geral" });
      }
    }
    const dbCamp = (await sb.from("campanhas").select("id,anunciante_id").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; anunciante_id: string }[];
    }));
    const campId = new Map(dbCamp.map((c) => [c.anunciante_id, c.id]));

    // posições (localiza ou cria)
    const dbBus = (await sb.from("onibus").select("id,numero").eq("tenant_id", tenant).then((r) => {
      if (r.error) throw new Error(r.error.message); return r.data as { id: string; numero: string }[];
    }));
    const busId = new Map(dbBus.map((b) => [Number(b.numero), b.id]));
    async function posicaoId(busNum: number, tipo: string, detalhe: string): Promise<string> {
      const b = busId.get(busNum); const t = tipoId.get(tipo);
      if (!b || !t) throw new Error(`posição sem ônibus/tipo: ${busNum}/${tipo}`);
      const ex = await sb.from("posicoes").select("id").eq("tenant_id", tenant).eq("onibus_id", b).eq("tipo_id", t).limit(1);
      if (!ex.error && ex.data?.length) return (ex.data[0] as { id: string }).id;
      const ins = await sb.from("posicoes").insert({ tenant_id: tenant, onibus_id: b, tipo_id: t, detalhe: detalhe || "" }).select("id").single();
      if (ins.error) throw new Error("posicoes: " + ins.error.message);
      return (ins.data as { id: string }).id;
    }

    // recria veiculações ativas do tenant a partir do envio
    {
      const r = await sb.from("veiculacoes").delete().eq("tenant_id", tenant).in("situacao", ["agendada", "ativa"]);
      if (r.error) throw new Error("limpar veiculacoes: " + r.error.message);
    }
    const planas = extrairVeiculacoes(linhas);
    let gravadas = 0;
    for (const v of planas) {
      if (!v.anunciante) continue;
      const a = anunId.get(v.anunciante); const c = a ? campId.get(a) : undefined;
      if (!a || !c) continue;
      const p = await posicaoId(v.numero, v.pos, v.pos === "painel" ? v.detalhe : "");
      const r = await sb.from("veiculacoes").insert({
        tenant_id: tenant, posicao_id: p, campanha_id: c,
        inicio: v.inicio, periodo_dias: v.periodo, situacao: "ativa"
      });
      if (r.error) throw new Error(`veiculacao ${v.numero}/${v.pos}: ` + r.error.message);
      gravadas++;
    }
    return NextResponse.json({ ok: true, tenant, onibus: linhas.length, veiculacoes: gravadas });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg.startsWith("UUID:") ? 400 : 500 });
  }
}
