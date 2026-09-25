import type { Metadata } from "next";
import Link from "next/link";
import AplicarTema from "@/components/AplicarTema";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frota Publicitária · Expresso Vitória",
  description: "SaaS de controle de mídia em ônibus"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <AplicarTema />
        <nav aria-label="Principal" style={{ borderBottom: "4px solid var(--y)", background: "var(--card)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 16px", display: "flex", gap: 12, flexWrap: "wrap", fontSize: 14 }}>
            {[
              ["/", "Painel"],
              ["/editar", "Editar"],
              ["/frota", "Frota"],
              ["/os", "Ordens de serviço"],
              ["/importacao", "Importação"],
              ["/relatorios", "Relatórios"],
              ["/configuracoes", "Configurações"]
            ].map(([h, l]) => (
              <Link key={h} href={h} style={{ color: "var(--ink)" }}>{l}</Link>
            ))}
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
