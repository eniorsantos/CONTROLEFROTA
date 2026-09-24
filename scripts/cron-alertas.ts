// Cron diário 06:00 (fuso da empresa): atualiza situações, envia alertas 15/7/0 + atraso retirada, gera OS de retirada.
// Uso: npm run cron:alertas  (agendar no provedor: Vercel Cron / pg_cron / GitHub Actions)
import { FROTA } from "../src/data/frota";
import { montarPainel, resumoPainel } from "../src/lib/painel";
import { alertasVencimento } from "../src/lib/alertas";

const rows = montarPainel(FROTA);
console.log("resumo", resumoPainel(rows));
const alertas = alertasVencimento(rows, (process.env.ALERTA_DESTINATARIOS ?? "comercial@empresa.com.br").split(","));
console.log(`${alertas.length} alertas (15/7/0 dias + atrasos). Enviar via Resend; WhatsApp na fase 4.`);
for (const a of alertas.slice(0, 10)) console.log("-", a.assunto);
