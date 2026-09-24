# Implantação local e em nuvem — SaaS de Controle de Mídia em Ônibus

Guia instrutivo e descritivo para instalar, configurar, operar e publicar o projeto
(Next.js 14 + TypeScript + Tailwind + Supabase/Postgres + Resend).
Empresa piloto: **Expresso Vitória**. Leia na ordem: cada etapa depende da anterior.

> Arquivos de referência do repositório:
> `README.md` (resumo) · `docs/ESPECIFICACAO.md` (regras) ·
> `supabase/schema_saas_midia_onibus.sql` (banco + RLS) ·
> `src/data/frota.ts` (171 ônibus demo) · `scripts/cron-alertas.ts` (alertas) ·
> `.env.example` (variáveis).

---

## 1. Visão geral da arquitetura

```
Navegador (Painel, Frota, OS mobile, Configurações)
   │ HTTPS
   ▼
Next.js 14 App Router (Vercel ou localhost:3000)
   ├─ Páginas: /login / (painel) /frota /veiculacoes /disponibilidade
   │           /anunciantes /os /importacao /relatorios /configuracoes
   ├─ API: /api/onibus /api/veiculacoes /api/disponibilidade /api/painel/resumo
   │        /api/os /api/importacoes /api/configuracoes/aparencia
   │        /api/exportar /api/alertas/previa  (validação Zod + filtro por tenant)
   ▼
Supabase (Postgres + Auth + Storage)
   ├─ Tabelas de negócio com tenant_id + RLS (isolamento por empresa)
   ├─ tenant_branding (logo/cores/nome) · planos/assinaturas (plano fixo)
   └─ Storage: logos/ · fotos-os/ · importacoes/ (URLs assinadas)
Cron diário 06:00 (fuso da empresa) → alertas 15/7/0 dias + atraso + OS retirada
E-mail: Resend (WhatsApp oficial: fase 4) · Cobrança: Stripe ou Asaas
```

**Multitenancy:** toda linha de negócio carrega `tenant_id`. O Postgres impõe
`Row Level Security` (cada empresa só lê o próprio `tenant_id`) e a API sempre
filtra pelo tenant do usuário logado (tabela `membros`: admin, comercial,
operacao, leitura).

**Regras centrais implementadas em `src/lib/`:**
`vencimentos.ts` (semáforo RF7: vencido / vence em 7 dias / em campanha /
sem data / disponível; RN1 fim = início + período) ·
`sobreposicao.ts` (RN2 anti-sobreposição + RN5 renovação encadeada) ·
`painel.ts` (resumo, ocupação, próximos a vencer, disponibilidade RF8/RN6) ·
`importacao.ts` (mapa B→nº, C→linha, D→traseira, E/F→backseat, G→painel,
I→institucional, J→início, K→período, L→fim; ignora `.`/`o`; `reserva`) ·
`branding.ts` (hex, contraste WCAG AA, SVG sanitizado, 300 KB) ·
`alertas.ts` (15/7/0 + atraso) · `exportacao.ts` (CSV/PDF).

---

## 2. Pré-requisitos

| Item | Local | Nuvem |
|---|---|---|
| SO/shell | Windows (PowerShell 5.1), macOS ou Linux | — |
| Node.js | 20 LTS ou 22 (repositório usa 22) | provido pela Vercel |
| npm | 10+ | — |
| Git | qualquer versão recente | conta GitHub conectada à Vercel |
| Banco | **opção A (recomendada):** projeto Supabase Cloud gratuito p/ dev · **opção B:** Supabase CLI + Docker · **opção C:** Postgres 15+ puro | projeto Supabase Cloud (produção) |
| E-mail | chave Resend de teste (ou pular: alertas só logam no console) | chave Resend + domínio verificado |
| Cobrança | opcional local | Stripe ou Asaas (fase de cobrança) |
| Celular | navegador p/ testar `/os` com câmera | idem |

Verifique o Node antes de começar:

```powershell
node --version   # esperado: v20+ ou v22+
npm --version    # esperado: 10+
```

---

## 3. Instalação local — passo a passo

### 3.1 Clonar e instalar dependências

```powershell
git clone https://github.com/eniorsantos/CONTROLEFROTA.git
Set-Location CONTROLEFROTA
npm install --no-audit --no-fund
```

O que isso instala: `next`, `react`, `react-dom`, `@supabase/supabase-js`,
`zod`, `date-fns`, `xlsx`, `resend` (+ dev: `typescript`, `tailwindcss`,
`vitest`, `tsx`).

### 3.2 Criar o arquivo `.env`

```powershell
Copy-Item .env.example .env
```

Abra `.env` e preencha. Tabela completa de variáveis na seção 6; mínimo local:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co   # ou http://localhost:54321 (CLI)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...                   # só no servidor, nunca expor
TZ_EMPRESA=America/Bahia
RESEND_API_KEY=re_...                                     # opcional p/ teste de e-mail
ALERTA_FROM=midia@expressovitoria.com.br
```

> Sem a `SERVICE_ROLE_KEY` o schema pode ser aplicado pelo SQL Editor do
> dashboard mesmo assim; ela só é exigida para tarefas servidoras (cron, seed).

### 3.3 Subir o banco (escolha UMA opção)

**Opção A — Supabase Cloud (recomendada, 10 min, sem Docker).**
1. Acesse `https://supabase.com` → New project → anote `URL`, `anon key`,
   `service_role key` (Settings → API).
2. No dashboard: SQL Editor → New query → cole **todo** o conteúdo de
   `supabase/schema_saas_midia_onibus.sql` → Run. Ele cria extensão
   `btree_gist` (anti-sobreposição), tabelas, índices, RLS/policies,
   `tenant_branding`, `planos` (Essencial/Profissional/Empresarial) e
   `assinaturas`.
3. Confira em Table Editor que as tabelas existem.

**Opção B — Supabase local (CLI + Docker, espelha produção).**
```powershell
npm install -g supabase
supabase init
supabase start   # sobe Postgres/Auth/Storage em localhost:54321
```
Depois aplique o schema com `psql` ou pelo Studio local
(`http://localhost:54323` → SQL Editor), colando o mesmo arquivo SQL.
Pare com `supabase stop` quando terminar.

**Opção C — Postgres puro (sem Auth/Storage do Supabase).**
1. Instale Postgres 15+ e crie o banco: `createdb midia_onibus`.
2. Como superusuário, rode o schema. Observações:
   - `create extension btree_gist;` é obrigatória (regra RN2).
   - As policies referenciam `auth.users`/`auth.uid()` (Supabase Auth). Sem o
     Supabase, crie um schema `auth` mínimo ou adapte as policies para sua
     autenticação — **não suba em produção sem RLS equivalente**.

### 3.4 Buckets do Storage + tenant piloto + usuário admin

No dashboard do Supabase (Cloud ou local):

1. **Storage → New bucket** (todos privados):
   - `logos` — logos PNG/JPG/SVG das empresas (até 300 KB, validado em app).
   - `fotos-os` — fotos de instalação/retirada da equipe de campo.
   - `importacoes` — planilhas enviadas (auditoria RF11/RF15).
2. **Criar o tenant piloto + admin** (SQL Editor):
```sql
insert into tenants (nome, plano, fuso) values ('Expresso Vitória', 'basico', 'America/Bahia')
returning id;  -- anote o UUID, ex.: 00000000-0000-0000-0000-000000000001

-- depois de criar o usuário em Authentication → Users (e-mail/senha), vincule:
insert into membros (tenant_id, user_id, papel)
values ('<TENANT_UUID>', '<USER_UUID>', 'admin');

insert into tenant_branding (tenant_id, cor_primaria, cor_secundaria, nome_exibicao)
values ('<TENANT_UUID>', '#F5B800', '#17212B', 'Expresso Vitória');

insert into tipos_posicao (tenant_id, nome)
values ('<TENANT_UUID>','traseira'), ('<TENANT_UUID>','backseat'),
       ('<TENANT_UUID>','painel'), ('<TENANT_UUID>','institucional');
```
3. **Policies de Storage** (exemplo mínimo — ajuste ao seu modelo):
   leitura/escrita autenticada restrita às pastas do tenant; URLs públicas
   **nunca** para `fotos-os` (usar URL assinada temporária).

### 3.5 Carga inicial: os 171 ônibus

O arquivo `src/data/frota.ts` já contém os 171 ônibus normalizados da
`Frota.xlsx` e alimenta o Painel demo sem banco. Para carga real, use a
**tela `/importacao`** (RF11):

1. `npm run dev` → abra `http://localhost:3000/importacao`.
2. Envie a `Frota.xlsx`. O mapeamento padrão é:
   B→número, C→linha (código = antes do 1º `-`), D→traseira, E/F→backseat,
   G→painel, I→cliente retirada (institucional), J→início, K→período,
   L→fim.
3. Confira a **prévia**: linhas válidas × erros (ex.: cliente sem data),
   avisos de `.`/`o` ignorados, `reserva` → status reserva, e sugestões de
   junção (ex.: `Faculdade Bahiaha` → `Faculdade Bahia`, com confirmação).
4. Confirme. Critério de aceite §9.1: o Painel deve mostrar **171 ônibus**.

API equivalente: `POST /api/importacoes` (prévia) →
`POST /api/importacoes/:id/confirmar`.

### 3.6 Rodar, testar e validar localmente

```powershell
npm run dev      # app em http://localhost:3000
npm test         # vitest: 17 testes (vencimento, sobreposição, importação, branding, alertas, RLS)
npm run build    # confere tipos + build de produção (23 rotas)
npm run cron:alertas   # simula o cron diário no terminal
```

Roteiro de validação (espelha o aceite §9):

| # | O que fazer | Esperado |
|---|---|---|
| 1 | Abrir `/` | 171 ônibus; KPIs; ocupação; próximos 6; tabela com busca/filtros/ordenação |
| 2 | `/veiculacoes`: criar 2 anunciantes no mesmo ônibus/posição com períodos diferentes; tentar um 3º sobreposto | 3º bloqueado (RN2; em prod o banco retorna 409 via `EXCLUDE`) |
| 3 | `npm run cron:alertas` ou `GET /api/alertas/previa` | alertas 15/7/0 dias + atraso retirada listados |
| 4 | Trocar `x-tenant-id` / logar com outra empresa | nenhum dado cruzado (RLS) |
| 5 | `/configuracoes`: trocar cor + logo | reflexo imediato no Painel/login/PDF; aviso se contraste < AA |
| 6 | `/os` no celular: anexar foto → concluir | `PATCH /api/os/:id/concluir` exige `foto_url`; sem foto retorna 400 |

Papel de cada perfil (testar com usuários diferentes em `membros`):
admin (tudo) · comercial (anunciantes/campanhas/veiculações) ·
operacao (OS/fotos/baixa) · leitura (só consulta).

---

## 4. Operação diária (local ou nuvem — mesmo fluxo)

1. **Painel (`/`)**: semáforo diário — `Vencido` (retirar + OS), `Vence em 7 dias`
   (renovar/negociar), `Em campanha`, `Sem data`, `Disponível` (vender).
   KPIs filtram a tabela; `+N` expande os demais anunciantes do ônibus.
2. **Disponibilidade (`/disponibilidade`)**: filtrar por linha/posição/período
   antes de vender (baixados excluídos — RN6).
3. **Veiculações (`/veiculacoes`)**: fim sempre calculado (início + período);
   renovar encadeia (início = fim anterior) preservando histórico/auditoria.
4. **OS (`/os`)**: instalação e retirada geram OS com prazo; campo conclui com
   foto pelo celular; atraso gera alerta.
5. **Relatórios (`/relatorios`)**: CSV/PDF com filtros aplicados; relatório do
   anunciante com fotos/período/ônibus + link compartilhável (RF13).
6. **Branding (`/configuracoes`)**: logo PNG/JPG/SVG ≤ 300 KB (SVG sanitizado),
   cores `#RRGGBB`, nome de exibição; contraste texto/fundo calculado; vale
   para login, painel e PDFs; plano futuro: domínio próprio.

---

## 5. Implantação em nuvem — passo a passo (Vercel + Supabase)

Arquitetura alvo: **Vercel** (Next.js + cron) + **Supabase Cloud** (Postgres +
Auth + Storage) + **Resend** (e-mail) + **Stripe/Asaas** (cobrança, quando ativar).

### 5.1 Banco de produção (Supabase)

1. New project (região `sa-east-1` São Paulo — menor latência p/ Bahia/Brasil).
2. SQL Editor → rodar `supabase/schema_saas_midia_onibus.sql` **inteiro**.
3. Criar buckets `logos`, `fotos-os`, `importacoes` (privados) + policies.
4. Authentication → configurar: e-mail/senha, URLs (`Site URL` = domínio prod,
   Redirect URLs = domínio + `localhost:3000` p/ dev), template de convite.
5. Repetir o bloco SQL da seção 3.4 (tenant real, admin, branding, posições).
6. Backups: Database → Backups (diário; testar restore em staging — RNF 99,5%).

### 5.2 E-mail (Resend) e cobrança

- **Resend**: criar API key de produção, verificar domínio (SPF/DKIM),
  `ALERTA_FROM=midia@suaempresa.com.br`. WhatsApp oficial fica para a fase 4
  (conta comercial + templates aprovados).
- **Stripe/Asaas**: criar produtos/planos espelhando `planos`
  (Essencial R$249 · Profissional R$549 · Empresarial sob consulta — valores
  iniciais a confirmar); webhook atualiza `assinaturas.status`
  (`teste|ativa|atrasada|somente_leitura|cancelada`). Inadimplência = somente
  leitura, sem apagar dados.

### 5.3 App na Vercel

1. GitHub → `New repository` (ou usar o existente) → push da `master`.
2. Vercel → Add New Project → importar o repositório → framework Next.js.
3. **Environment Variables** (Production + Preview + Development conforme):
   ver tabela da seção 6 — no mínimo `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `TZ_EMPRESA`, `RESEND_API_KEY`, `ALERTA_FROM`.
4. Deploy. Cada PR gera Preview URL (homologação); `master` = produção.
5. Domínio: Settings → Domains → apontar DNS; plano Empresarial prevê
   `midia.suaempresa.com.br` por tenant (futuro).

### 5.4 Ambientes, CI/CD e cron

- **Ambientes**: `development` (local) · `preview` (PRs Vercel) ·
  `production` (master). Migrações SQL versionadas: nunca edite o banco no
  clique em prod — versione o próximo delta em `supabase/migrations/` e
  aplique na ordem.
- **CI sugerido** (`.github/workflows/ci.yml`): `npm ci` → `npm test` →
  `npm run build`; bloquear merge se falhar. Testes exigidos: vencimento,
  sobreposição, isolamento entre empresas, fluxo criar→alertar→retirar.
- **Cron 06:00 (fuso da empresa)**: preferir **Vercel Cron** chamando rota
  protegida que executa `alertasVencimento` + gera OS de retirada + envia via
  Resend (15/7/0 dias + atrasos). Alternativas: `pg_cron` ou GitHub Actions
  agendado chamando `npm run cron:alertas`. Registrar falhas de envio
  (observabilidade) e métricas de uso por empresa.
- **Observabilidade**: Sentry (erros front/back), logs de envio de alerta,
  métricas por tenant (frota, usuários, MB). Meta: painel < 2 s p/ 2.000
  ônibus (paginação no servidor — `GET /api/onibus?page=`).

### 5.5 Go-live (checklist)

- [ ] Schema aplicado + RLS ativo em todas as tabelas com `tenant_id`
- [ ] Buckets + policies + teste de upload (logo ≤ 300 KB, foto OS)
- [ ] Auth + convite + 4 perfis testados
- [ ] Env vars em Production/Preview; `service_role` só no servidor
- [ ] Importação da Frota.xlsx → 171 ônibus no Painel prod
- [ ] Cron 06:00 executando; e-mail de 7 dias recebido
- [ ] Teste cruzado: empresa A não vê empresa B
- [ ] Branding aplicado (login, painel, PDF)
- [ ] OS com foto pelo celular concluída
- [ ] Backup/restore testado; Sentry ativo; termo de uso + política (LGPD)

---

## 6. Variáveis de ambiente (referência)

| Variável | Onde | Obrigatória | Descrição |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | todas | sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | todas | sim | chave pública (RLS aplica) |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | sim p/ cron/seed | **secreta** — nunca expor no browser |
| `TENANT_ID_DEFAULT` | dev | não | tenant demo local |
| `TZ_EMPRESA` | todas | sim | ex.: `America/Bahia` (cálculos RN7) |
| `RESEND_API_KEY` | prod/cron | sim p/ e-mail | Resend (ou Postmark) |
| `ALERTA_FROM` | prod/cron | sim p/ e-mail | remetente verificado |
| `ALERTA_DESTINATARIOS` | cron | não | lista padrão separada por vírgula |
| `STRIPE_SECRET_KEY` / `ASAAS_API_KEY` | prod | ao ativar cobrança | gateway de plano fixo |
| `CRON_HOUR` | cron | não | padrão `6` (06:00 fuso empresa) |
| `SENTRY_DSN` | prod | recomendado | observabilidade |

---

## 7. Segurança e LGPD (resumo operacional)

HTTPS sempre; senhas com hash (Supabase Auth); rate-limit no login;
RLS em **todas** as tabelas com `tenant_id` (testado); `service_role` só no
servidor; Storage privado com URL assinada; auditoria (`auditoria`) de
veiculações/alterações com autor+data (RF15); contatos de anunciantes = dados
pessoais — exigir termo de uso + política de privacidade, exportação e
exclusão de dados por empresa.

---

## 8. Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `auth.users` não existe ao rodar SQL | Postgres puro sem Supabase Auth | usar Supabase (A/B) ou adaptar policies (§3.3) |
| `btree_gist` falha | sem permissão de extensão | rodar como superusuário / usar Supabase |
| Painel mostra 0 ônibus | seed não carregado / tenant errado | conferir `src/data/frota.ts` (demo) ou refazer importação §3.5; checar `x-tenant-id` |
| 409 ao criar veiculação | sobreposição real (RN2) | ajustar início/período; renovar encadeia em vez de sobrepor |
| E-mail não chega | `RESEND_API_KEY`/domínio | verificar key, domínio SPF/DKIM, `ALERTA_FROM`, logs do cron |
| Logo recusada | > 300 KB ou tipo inválido | comprimir ≤ 300 KB; PNG/JPG/SVG; SVG com script é sanitizado |
| Aviso de contraste | cor com texto ilegível | escolher cor mais escura/clara; o app sugere texto auto |
| Build falha em `vitest` | imports `@/` | `vitest.config.ts` já tem alias `@→src`; rodar `npm test` antes do build |
| Lentidão > 2 s | tabela sem paginação | usar `GET /api/onibus?page=`; índice `idx_veic_tenant_fim` já criado |

---

## 9. Comandos úteis (cola rápida)

```powershell
npm install; Copy-Item .env.example .env   # setup
npm run dev          # http://localhost:3000
npm test             # 17 testes
npm run build        # build produção (23 rotas)
npm run start        # serve o build (requer .env)
npm run cron:alertas # alertas 15/7/0 + atrasos no terminal
git status; git log --oneline -5           # higiene antes de commit/PR
```

Critérios de aceite (§9) — onde conferir no repo:
`tests/vencimentos.test.ts` (171 + semáforo) ·
`tests/sobreposicao.test.ts` (2 prazos + 3º recusado) ·
`tests/regras.test.ts` (e-mail 7 dias, branding, importação, isolamento RLS).
