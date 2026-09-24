// Tipos centrais do SaaS (espelha schema_saas_midia_onibus.sql)
export type Papel = "admin" | "comercial" | "operacao" | "leitura";
export type StatusOnibus = "ativo" | "reserva" | "manutencao" | "baixado";
export type SituacaoVeiculacao = "agendada" | "ativa" | "retirada" | "cancelada";
export type TipoOS = "instalacao" | "retirada";

// Linha do protótipo / planilha (formato Frota.xlsx normalizado)
export interface LinhaPrototipo {
  n: number;      // nº ônibus (col B)
  l: string;      // linha completa (col C)
  t: string;      // traseira (col D)
  b: string;      // backseat/inbus (col E/F)
  p: string;      // painel (col G) — detalhe ex.: VIDRO GRANDE
  i: string;      // interna (reservado)
  r: string;      // marcador back ("back")
  c: string;      // cliente de retirada / institucional (col I)
  d: string;      // colocação/início yyyy-mm-dd (col J)
  e: number;      // período dias (col K)
  f: string;      // retirada/fim yyyy-mm-dd (col L)
}

export type Semaforo = "Vencido" | "Vence em 7 dias" | "Em campanha" | "Sem data" | "Disponível";

export interface AnuncioResumo { pos: string; nome: string; f: string; }

export interface OnibusPainel extends LinhaPrototipo {
  s: Semaforo;
  x: number | null;      // dias p/ vencimento
  code: string;          // código linha (antes do '-')
  ads: AnuncioResumo[];  // vários anunciantes, ordenados por fim
  m: string;             // anunciante principal (vence primeiro)
  q: string;             // busca agregada
}

export interface TenantBranding {
  tenant_id: string;
  logo_url: string | null;
  cor_primaria: string;   // #RRGGBB
  cor_secundaria: string; // #RRGGBB
  nome_exibicao: string | null;
}

export interface VeiculacaoInput {
  posicao_id: string;
  campanha_id: string;
  inicio: string; // yyyy-mm-dd
  periodo_dias: number; // 30 | 60 | 90 | custom
}
