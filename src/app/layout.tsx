import type { Metadata } from "next";
import AplicarTema from "@/components/AplicarTema";
import Nav from "@/components/Nav";
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
        <Nav />
        {children}
      </body>
    </html>
  );
}
