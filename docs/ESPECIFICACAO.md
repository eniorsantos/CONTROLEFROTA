# Especificação — SaaS de controle de mídia em ônibus (resumo executável)

Fonte completa: conversa do projeto. Este arquivo ancora o que foi implementado.

1. **Painel (§4.2)**: header logo+nome/data/tema; 5 KPIs clicáveis; ocupação por posição; próximos 6; tabela Nº/linha/anunciante(+N)/painel/colocação/período/retirada/situação+dias; busca + filtros + ordenação; sem ranking.
2. **Vários anunciantes**: principal = vence primeiro; empate traseira→backseat→institucional; `+N` expansível acessível.
3. **Backend**: Postgres+RLS por `tenant_id`; REST `/api/*` com Zod; cron 06:00; Storage logos/fotos; Resend; planos fixos (Stripe/Asaas).
4. **Aceite §9**: 171 ônibus · 2 anunciantes prazos diferentes + 3º recusado · e-mail 7 dias · isolamento · branding imediato · retirada com foto.
