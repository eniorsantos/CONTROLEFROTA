-- Modelo multi-tenant para controle de mídia em ônibus (PostgreSQL / Supabase)
-- Cada linha de negócio carrega tenant_id; o RLS isola uma empresa da outra.

create extension if not exists btree_gist;   -- exigido pela regra anti-sobreposição
create extension if not exists pgcrypto;

create table if not exists tenants (            -- empresa cliente do SaaS (ex.: Expresso Vitória)
  id uuid primary key default gen_random_uuid(),
  nome text not null, plano text not null default 'basico',
  fuso text not null default 'America/Bahia',
  criado_em timestamptz default now());

create table if not exists membros (            -- usuários da empresa e seus papéis
  tenant_id uuid references tenants on delete cascade, user_id uuid references auth.users on delete cascade,
  papel text check (papel in ('admin','comercial','operacao','leitura')),
  primary key (tenant_id, user_id));

create table if not exists linhas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  codigo text not null, nome text not null,      -- ex.: A0885 / V. Abrantes x T. Aeroporto
  unique (tenant_id, codigo));

create table if not exists onibus (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  numero text not null, linha_id uuid references linhas,
  status text default 'ativo' check (status in ('ativo','reserva','manutencao','baixado')),
  unique (tenant_id, numero));

create table if not exists tipos_posicao (      -- configurável por empresa: traseira, backseat, painel...
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  nome text not null, unique (tenant_id, nome));

create table if not exists posicoes (           -- cada "vaga" de anúncio em um ônibus
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  onibus_id uuid not null references onibus on delete cascade,
  tipo_id uuid not null references tipos_posicao,
  detalhe text,                   -- ex.: "vidro grande"
  unique (onibus_id, tipo_id, detalhe));

create table if not exists anunciantes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  nome text not null, contato text, observacoes text, unique (tenant_id, nome));

create table if not exists campanhas (          -- agrupa o contrato do anunciante
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  anunciante_id uuid not null references anunciantes on delete cascade,
  nome text, valor_mensal numeric(12,2), criado_em timestamptz default now());

create table if not exists veiculacoes (        -- O CORAÇÃO: um anunciante em uma posição, com prazo próprio
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  posicao_id uuid not null references posicoes on delete cascade,
  campanha_id uuid not null references campanhas on delete cascade,
  inicio date not null,
  periodo_dias int not null default 30 check (periodo_dias > 0),
  fim date generated always as (inicio + periodo_dias) stored,
  situacao text default 'agendada' check (situacao in ('agendada','ativa','retirada','cancelada')),
  retirada_em date,               -- data real da remoção
  criado_por uuid references auth.users,
  criado_em timestamptz default now(),
  exclude using gist (posicao_id with =, daterange(inicio, inicio + periodo_dias) with &&)
    where (situacao in ('agendada','ativa')));

create table if not exists ordens_servico (     -- tarefa de campo: instalar ou retirar
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  veiculacao_id uuid not null references veiculacoes on delete cascade,
  tipo text check (tipo in ('instalacao','retirada')),
  prazo date, responsavel text, concluida_em timestamptz, foto_url text);

create index if not exists idx_veic_tenant_fim on veiculacoes (tenant_id, fim);
create index if not exists idx_onibus_tenant on onibus (tenant_id);
create index if not exists idx_pos_onibus on posicoes (onibus_id);

-- Auditoria / histórico (RF15)
create table if not exists auditoria (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  ator uuid references auth.users,
  acao text not null, entidade text not null, entidade_id uuid,
  detalhe jsonb default '{}', criado_em timestamptz default now());

-- Importações (RF11)
create table if not exists importacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  arquivo_url text, mapa jsonb default '{}', total int default 0, erros jsonb default '[]',
  status text default 'previa' check (status in ('previa','confirmada','cancelada')),
  criado_em timestamptz default now());

-- Isolamento por empresa (repetir para cada tabela com tenant_id)
alter table tenants enable row level security;
alter table membros enable row level security;
alter table linhas enable row level security;
alter table onibus enable row level security;
alter table tipos_posicao enable row level security;
alter table posicoes enable row level security;
alter table anunciantes enable row level security;
alter table campanhas enable row level security;
alter table veiculacoes enable row level security;
alter table ordens_servico enable row level security;
alter table auditoria enable row level security;
alter table importacoes enable row level security;

drop policy if exists tenant_isolado on veiculacoes;
create policy tenant_isolado on veiculacoes
  using (tenant_id in (select tenant_id from membros where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from membros where user_id = auth.uid()));

drop policy if exists t_onibus on onibus;
create policy t_onibus on onibus
  using (tenant_id in (select tenant_id from membros where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from membros where user_id = auth.uid()));

drop policy if exists t_pos on posicoes;
create policy t_pos on posicoes
  using (tenant_id in (select tenant_id from membros where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from membros where user_id = auth.uid()));

drop policy if exists t_anun on anunciantes;
create policy t_anun on anunciantes
  using (tenant_id in (select tenant_id from membros where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from membros where user_id = auth.uid()));

drop policy if exists t_camp on campanhas;
create policy t_camp on campanhas
  using (tenant_id in (select tenant_id from membros where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from membros where user_id = auth.uid()));

drop policy if exists t_os on ordens_servico;
create policy t_os on ordens_servico
  using (tenant_id in (select tenant_id from membros where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from membros where user_id = auth.uid()));

drop policy if exists t_linhas on linhas;
create policy t_linhas on linhas
  using (tenant_id in (select tenant_id from membros where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from membros where user_id = auth.uid()));

drop policy if exists t_tipos on tipos_posicao;
create policy t_tipos on tipos_posicao
  using (tenant_id in (select tenant_id from membros where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from membros where user_id = auth.uid()));

-- Personalização visual (white-label) por empresa
create table if not exists tenant_branding (
  tenant_id uuid primary key references tenants on delete cascade,
  logo_url text,                       -- arquivo no Storage (PNG/SVG/JPG, até 300 KB)
  cor_primaria text default '#F5B800', -- destaque (botões, faixas, foco)
  cor_secundaria text default '#17212B', -- cabeçalhos de tabela e textos fortes
  nome_exibicao text,
  atualizado_em timestamptz default now(),
  check (cor_primaria ~ '^#[0-9A-Fa-f]{6}$' and cor_secundaria ~ '^#[0-9A-Fa-f]{6}$'));

alter table tenant_branding enable row level security;
drop policy if exists t_brand on tenant_branding;
create policy t_brand on tenant_branding
  using (tenant_id in (select tenant_id from membros where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from membros where user_id = auth.uid()));

-- Cobrança por plano fixo
create table if not exists planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,            -- Essencial, Profissional, Empresarial
  preco_mensal numeric(10,2),           -- a definir
  limite_onibus int, limite_usuarios int, limite_armazenamento_mb int,
  recursos jsonb default '{}');         -- ex.: {"whatsapp":true,"dominio_proprio":false}

insert into planos (nome, preco_mensal, limite_onibus, limite_usuarios, limite_armazenamento_mb, recursos)
values
  ('Essencial', 249.00, 300, 5, 2048, '{"email":true,"importacao":true}'),
  ('Profissional', 549.00, 2000, 25, 20480, '{"email":true,"whatsapp":true,"os_foto":true,"branding":true,"relatorio_anunciante":true}'),
  ('Empresarial', null, null, null, null, '{"tudo":true,"dominio_proprio":true}')
on conflict (nome) do nothing;

create table if not exists assinaturas (
  tenant_id uuid primary key references tenants on delete cascade,
  plano_id uuid not null references planos,
  status text check (status in ('teste','ativa','atrasada','somente_leitura','cancelada')),
  teste_ate date, proxima_cobranca date,
  gateway_cliente_id text);             -- id no Stripe/Asaas

alter table assinaturas enable row level security;
drop policy if exists t_ass on assinaturas;
create policy t_ass on assinaturas
  using (tenant_id in (select tenant_id from membros where user_id = auth.uid()));
