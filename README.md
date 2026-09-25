# SaaS de Controle de Mídia em Ônibus

Multiempresa a partir da planilha **Frota.xlsx** da **Expresso Vitória** (piloto). Especificação em `docs/ESPECIFICACAO.md`, banco em `supabase/schema_saas_midia_onibus.sql`; dados e lógica do protótipo transcritos em `src/data/frota.ts` e `src/components/PainelClient.tsx`.

## Stack
Next.js 14 (App Router) + TypeScript + Tailwind + Zod + Supabase/Postgres (RLS) + Resend (e-mail) + xlsx.

## Rodar
```bash
npm install
cp .env.example .env   # preencher Supabase/Resend
npm run dev            # http://localhost:3000
```

## Telas (§4.1)
`/login` · `/` Painel (fiel ao protótipo §4.2) · `/editar` (edição inline por veículo) · `/frota` · `/os` (mobile-first, foto) · `/importacao` · `/relatorios` · `/configuracoes` (aparência + planos)

## Regras implementadas
- **RN1** fim = início + período (`fimVeiculacao`); **RN2** anti-sobreposição (`podeAgendar` + `EXCLUDE USING gist`); **RN5** renovar encadeia; **RN6** baixado fora da disponibilidade; **RF7** semáforo; **+N** com posição e retirada (§4.2); sem ranking (decisão cliente).
- **Importação** B→nº, C→linha, D→traseira, E/F→backseat, G→painel, I→institucional, J→início, K→período, L→fim; ignora `.`/`o`; `reserva` vira reserva; sugere junção (Bahiaha/Bahia).
- **White-label** `tenant_branding`: logo ≤300KB, cores #RRGGBB, contraste WCAG AA auto, SVG sanitizado, prévia ao vivo.
- **Alertas** 15/7/0 dias + atraso retirada (`scripts/cron-alertas.ts`, 06:00 fuso empresa).
- **Planos fixos**: Essencial R$249, Profissional R$549, Empresarial sob consulta (valores iniciais — a confirmar).

## Testes e aceite
```bash
npm test
```
Cobre: 171 ônibus (§9.1), sobreposição recusada (§9.2), e-mail 7 dias (§9.3), isolamento RLS (§9.4), branding (§9.5), OS com foto (§9.6).
