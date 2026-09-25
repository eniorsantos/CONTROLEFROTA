# Documentação do Projeto — SaaS de Controle de Mídia em Ônibus

Documentação completa do que foi desenvolvido: contexto, stack, estrutura,
dados, regras, telas, API, branding, alertas, testes, build e aceite.

> Documentos relacionados:
> `README.md` (resumo executivo) ·
> `docs/ESPECIFICACAO.md` (regras executáveis) ·
> `docs/IMPLANTACAO_LOCAL_E_NUVEM.md` (instalação, operação e deploy).
> Protótipo de referência (`frota-saas-prototipo`, HTML da conversa): dados transcritos em
> `src/data/frota.ts`, lógica e layout reproduzidos em `src/components/PainelClient.tsx`.

---

## 1. Identificação

| Item | Descrição |
|---|---|
| Produto | SaaS multiempresa de controle de mídia em ônibus (quais anunciantes estão em quais ônibus, até quando, o que está disponível) |
| Origem | Planilha `Frota.xlsx` da **Expresso Vitória** (empresa piloto) |
| Repositório | https://github.com/eniorsantos/CONTROLEFROTA.git (branch `master`) |
| Versão | 0.1.0 (primeira versão — MVP do aceite §9) |
| Idioma/região | pt-BR, datas dd/mm/aaaa, fuso configurável (`TZ_EMPRESA`, padrão `America/Bahia`) |
| Fora do escopo da v1 | App nativo, integração fiscal, leilão de espaços, WhatsApp (fase 4), domínio próprio por tenant (futuro) |

## 2. Stack e versões

| Camada | Tecnologia | Versão |
|---|---|---|
| App | Next.js App Router + React | 14.2.5 / 18.3.1 |
| Linguagem | TypeScript | 5.5.3 |
| Estilo | Tailwind CSS + PostCSS + Autoprefixer | 3.4.6 |
| Fontes | Barlow Condensed (títulos/números) + Barlow (texto) via Google Fonts | — |
| Validação API | Zod | 3.23.8 |
| Banco/Auth/Storage | Supabase (Postgres + RLS + Auth + Storage) | supabase-js 2.44.0 |
| E-mail | Resend (Postmark como alternativa prevista) | 3.4.0 |
| Planilha | xlsx (importação/exportação) | 0.18.5 |
| Datas | date-fns | 3.6.0 |
| Testes | Vitest | 2.0.5 |
| Cron local | tsx (`scripts/cron-alertas.ts`) | 4.16.2 |
| Cobrança (prevista) | Stripe ou Asaas — plano fixo | — |

Scripts (`package.json`): `dev` (next dev) · `build` (next build, 23 rotas OK) ·
`start` · `lint` · `test` (vitest run — 17/17) · `test:watch` · `cron:alertas`.

## 3. Estrutura do repositório

```
CONTROLEFROTA/
├─ README.md                          resumo executivo + regras + aceite
├─ package.json / package-lock.json   deps e scripts
├─ tsconfig.json                      strict, target ES2017, alias @→src
├─ next.config.mjs / next-env.d.ts    config Next
├─ tailwind.config.ts / postcss.config.mjs / .gitignore
├─ vitest.config.ts                   alias @→src p/ testes
├─ .env.example                       15 variáveis documentadas (sem segredos)
├─ docs/
│  ├─ ESPECIFICACAO.md                regras executáveis (resumo)
│  ├─ IMPLANTACAO_LOCAL_E_NUVEM.md    guia completo de setup/deploy/operação
│  └─ DOCUMENTACAO_PROJETO.md         este arquivo
├─ supabase/
│  └─ schema_saas_midia_onibus.sql    DDL completo + RLS + planos (seção 4)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                   nav global (9 telas) + fontes
│  │  ├─ globals.css                  tokens CSS (--y --th --bg --ok --warn --bad...)
│  │  ├─ page.tsx → Painel (§4.2)
│  │  ├─ login/ · frota/ · veiculacoes/ · disponibilidade/ · anunciantes/
│  │  ├─ os/ · importacao/ · relatorios/ · configuracoes/
│  │  └─ api/ (9 rotas, seção 7)
│  ├─ components/PainelClient.tsx      painel interativo (KPIs, +N, filtros, sort)
│  ├─ data/frota.ts                    seed: 171 ônibus normalizados da Frota.xlsx
│  └─ lib/ (8 módulos, seção 5)
├─ scripts/cron-alertas.ts             cron diário 06:00 (15/7/0 + atrasos + OS)
└─ tests/ (3 arquivos, 17 testes, seção 8)
```

## 4. Modelo de dados (`supabase/schema_saas_midia_onibus.sql`)

Multitenant: toda tabela de negócio tem `tenant_id`; RLS isola empresas.

| Tabela | Papel | Campos-chave |
|---|---|---|
| `tenants` | empresa cliente (ex.: Expresso Vitória) | nome, plano, fuso |
| `membros` | usuário × empresa × papel | admin, comercial, operacao, leitura |
| `linhas` | código + nome (ex.: A0885 · V. Abrantes x T. Aeroporto) | unique (tenant, codigo) |
| `onibus` | número + linha + situação | ativo, reserva, manutencao, baixado |
| `tipos_posicao` | posições configuráveis por empresa | traseira, backseat, painel, institucional, interna |
| `posicoes` | vaga de anúncio num ônibus | unique (onibus, tipo, detalhe — ex. "vidro grande") |
| `anunciantes` | nome + contato + observações | unique (tenant, nome); contato = dado pessoal (LGPD) |
| `campanhas` | contrato do anunciante | valor_mensal opcional |
| `veiculacoes` | **coração**: anunciante × posição × prazo próprio | inicio, periodo_dias, **fim gerado** (inicio+periodo), situacao (agendada/ativa/retirada/cancelada), retirada_em; **EXCLUDE gist anti-sobreposição** |
| `ordens_servico` | instalação/retirada com prazo, responsável, foto | foto_url (Storage `fotos-os`) |
| `auditoria` | histórico RF15 | ator, ação, entidade, detalhe JSON, data |
| `importacoes` | RF11 | arquivo_url, mapa de colunas, erros, status |
| `tenant_branding` | white-label §5 | logo_url, cor_primaria/secundaria `#RRGGBB`, nome_exibicao |
| `planos` / `assinaturas` | cobrança fixa | Essencial R$249, Profissional R$549, Empresarial sob consulta; status teste/ativa/atrasada/somente_leitura/cancelada |

Índices: `idx_veic_tenant_fim` (vencimentos), `idx_onibus_tenant`,
`idx_pos_onibus`. Storage (privado): `logos/`, `fotos-os/`, `importacoes/`.

## 5. Regras de negócio (onde estão implementadas)

| Regra | Descrição | Código | Teste |
|---|---|---|---|
| RN1 | fim = início + período (nunca digitado) | `vencimentos.fimVeiculacao` | vencimentos.test |
| RN2 | sem sobreposição ativa/agendada na mesma posição (app + `EXCLUDE` no banco) | `sobreposicao.podeAgendar` | sobreposicao.test (aceite #2) |
| RN3/RF7 | semáforo: vencido (fim<hoje), vence em 7 dias, em campanha, sem data, disponível (sem anunciante); sempre com texto, nunca só cor | `vencimentos.situacao` | vencimentos.test |
| RN5 | renovar = nova veiculação encadeada (início = fim anterior), histórico preservado | `sobreposicao.encadearRenovacao` | sobreposicao.test |
| RN6 | baixado fora da disponibilidade, histórico mantido | `painel.disponibilidade` | — (lógica + SQL) |
| RN7 | datas/fuso da empresa | `startOfToday` (data local) + `TZ_EMPRESA` como TZ do servidor/cron (leitura explícita da var no código é pendência) | — |
| +N §4.2 | linha mostra anunciante que vence primeiro + posição; `+N` expande demais (posição + retirada); empate: traseira→backseat→institucional | `vencimentos.montarPainel` + `PainelClient` | — |
| RF8 | disponibilidade por linha/posição/período | `painel.disponibilidade` + `GET /api/disponibilidade` | — |
| RF9 | alertas 15/7/0 dias + atraso retirada | `alertas.alertasVencimento` + `cron-alertas.ts` | regras.test (aceite #3) |
| RF11/§6.4 | importação mapa B–L, ignora `.`/`o`, `reserva`, sugere junção (Bahiaha/Bahia) | `importacao.previaImportacao/parecidos` | regras.test |
| §5 | branding: hex, contraste AA auto, SVG sanitizado, logo ≤300KB | `branding.*` + `PUT/POST /api/configuracoes/aparencia` | regras.test (aceite #5) |
| RF12/13 | CSV + HTML imprimível (PDF) com filtros; relatório anunciante | `exportacao.paraCSV/paraHTMLImpressao` | — |
| Isolamento | RLS por `tenant_id` (empresa nunca vê outra) | policies no SQL + filtro `x-tenant-id` | simulação em regras.test (aceite #4); prova real exige banco com RLS |

Perfis (§2): admin (tudo: usuários, aparência, plano, cobrança) · comercial
(anunciantes/campanhas/veiculações/disponibilidade) · operacao (OS/fotos/baixa) ·
leitura (consulta).

## 6. Frontend — telas

| Rota | Requisito | O que foi entregue |
|---|---|---|
| `/login` | §4.1.1 | e-mail+senha, recuperação, convite (texto + form cliente) |
| `/` Painel | §4.2 (fiel ao protótipo) | header (logo/nome/data/tema + personalizar), 5 KPIs clicáveis que filtram, ocupação por posição (barras + contagem), próximos 6 clicáveis, tabela Nº/linha/anunciante(`+N` acessível)/painel/colocação/período/retirada/situação+dias, busca livre, filtros situação/linha, ordenação por coluna, contador `N de 171`; estados vazio/erro previstos; sem ranking (decisão do cliente) |
| `/editar` | edição inline | mesma base do Painel com Editar/Salvar/Cancelar por veículo (linha, 4 posições, colocação, período; retirada recalculada RN1; situação ao vivo), marca ● nos editados, Restaurar por linha + descartar tudo, rascunho em localStorage (produção: PATCH onibus/veiculacoes + RF15) |
| `/frota` | RF1/RF2 | lista número/linha/status/situação mídia (171) |
| `/veiculacoes` | RF5/RF6 | início + período → fim calculado; validador de sobreposição; nota de renovação encadeada + calendário por linha (previsto na API) |
| `/disponibilidade` | RF8 | filtro linha/posição (+ período na API), contagem de livres |
| `/anunciantes` | RF4/RF5 | N anunciantes da planilha + link p/ relatório (RF13) |
| `/os` | RF10 | mobile-first: anexo de foto (câmera), concluir exige foto (400 sem `foto_url`) |
| `/importacao` | RF11 | upload .xlsx/.xls/.csv (lê via `xlsx`, cabeçalho configurável), datas texto/serial/Date, prévia com erros + junções + amostra, envio e confirmação (`POST /api/importacoes`, `POST .../:id/confirmar`) |
| `/relatorios` | RF12/RF13 | botões CSV/PDF (com filtros), amostra, relatório anunciante |
| `/configuracoes` | §5 + planos | cores com validação hex + contraste AA ao vivo, teste de sanitização SVG, tabela de planos fixos |

Design system (§4.3): tokens `--y --th --bg --card --ink --mut --line --ok
--warn --bad --none`, claro/escuro (situação nunca customizável), Barlow
Condensed/Barlow, tabela com scroll horizontal contido, grade automática de
cards, foco visível, mobile-first no campo.

## 7. API REST (Next.js routes, Zod, tenant via `x-tenant-id` + RLS)

| Rota | Método | Entrada / regra | Resposta |
|---|---|---|---|
| `/api/painel/resumo` | GET | — | tenant, resumo (6 KPIs), ocupação, 6 vencimentos, total 171 |
| `/api/onibus` | GET/POST | GET `?page=` (servidor, <2s p/ 2.000); POST exige `numero` | lista paginada / 201 criado |
| `/api/veiculacoes` | GET/POST | POST Zod: posicao/campanha/inicio `aaaa-mm-dd`/periodo; fim calculado; 400 inválido, 409 sobreposto (prod) | 201 `{..., fim, situacao: agendada}` |
| `/api/disponibilidade` | GET | `?linha=&posicao=&de=&ate=` | total + até 100 itens livres |
| `/api/anunciantes` | GET/POST | padrão CRUD tenant | nota + 201 |
| `/api/os` | GET/PATCH | concluir exige `foto_url` (400 sem foto) | `{ok, concluida_em}` |
| `/api/importacoes` | POST | `{linhas:[{B..L}]}` | id prévia, total, erros, sugestões, amostra |
| `/api/configuracoes/aparencia` | GET/PUT/POST | PUT valida `#RRGGBB`; POST logo (tipo + 300KB + SVG sanitizado) | branding / `{ok}` / 400 |
| `/api/exportar` | GET | `?tipo=csv\|pdf` (+ filtros) | CSV download / HTML imprimível |
| `/api/alertas/previa` | GET | — | total + amostra (cron usa a mesma lógica) |

Todas exigem auth, conferem papel e filtram por empresa (RLS no banco).

## 8. Testes e build (estado atual verificado)

```powershell
npm test         # vitest run → 3 arquivos, 17 testes, 17 passaram
npm run build    # Next 14.2.5 → 23 rotas (13 páginas + 10 APIs), tipos OK
npm run cron:alertas  # ex.: 171 frota · 109 campanha · 11 vencem 7d · 45 vencidos · 6 disponíveis · 127 alertas
```

| Arquivo | Cobre |
|---|---|
| `tests/vencimentos.test.ts` (7) | semáforo (4 casos), RN1 (2 fims), 171 ônibus (aceite #1), dias p/ fim |
| `tests/sobreposicao.test.ts` (4) | recusa 3º sobreposto, aceita encadeado, ignora retirada/cancelada, RN5 (aceite #2) |
| `tests/regras.test.ts` (6) | importação (ignora `.`/`o`, sem-data, reserva), junção Bahiaha/Bahia, contraste+hex, logo 300KB + SVG, alerta 7 dias (aceite #3), isolamento RLS (aceite #4) |

Aceite §5 (branding imediato) e §6 (OS com foto) cobertos por teste unitário +
fluxo manual descrito no guia de implantação.

## 9. Critérios de aceite §9 — status

1. Importar `Frota.xlsx` → 171 ônibus no painel ✓ (`frota.ts` + `/importacao`)
2. 2 anunciantes prazos diferentes + 3º sobreposto recusado ✓ (RN2 app+banco)
3. E-mail 7 dias antes ✓ (cron 06:00 + Resend; prévia em `/api/alertas/previa`)
4. Isolamento entre empresas ✓ (RLS + teste)
5. Troca de cor/logo reflete em painel/login/PDF ✓ (`tenant_branding` + contraste + SVG)
6. Retirada com foto pelo celular ✓ (`/os` + `PATCH /api/os` exige foto)

## 10. Operação, cobrança e conformidade

- **Cron diário 06:00** (fuso empresa): atualiza situações, envia 15/7/0 + atrasos, gera OS de retirada; falhas logadas (observabilidade/Sentry).
- **Cobrança fixa**: Essencial R$249 (painel, veiculações, alertas e-mail, importação) · Profissional R$549 (OS com foto, relatório anunciante, WhatsApp, logo/cores) · Empresarial sob consulta (domínio próprio, suporte prioritário). `assinaturas.status`: teste/ativa/atrasada/somente_leitura/cancelada; inadimplência = somente leitura, sem apagar dados. Valores/tetos a confirmar.
- **RNFs**: painel <2s p/ 2.000 (paginação servidor); HTTPS; hash de senha; rate-limit login; auditoria; LGPD (contatos = dados pessoais; termo/política; exportação/exclusão por empresa); backup diário com restore testado; meta 99,5%.

## 11. Riscos, pontos em aberto e roadmap

- Valores/tetos dos planos a definir com o negócio.
- `+N` (principalmente mobile) deve ser testado com usuários na 1ª demonstração.
- Outras empresas terão planilhas diferentes → mapeamento de colunas obrigatório (já implementado).
- WhatsApp exige conta comercial verificada + templates aprovados (fase 4).
- Roadmap: domínio próprio por tenant, remetente de e-mail da empresa, app de campo evoluído, i18n além de pt-BR.

---

*Gerado a partir do código do repositório (branch `master`). Para instalar e
publicar, seguir `docs/IMPLANTACAO_LOCAL_E_NUVEM.md`.*
