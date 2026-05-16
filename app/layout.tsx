import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ponto Eletronico | Links oficiais",
  description:
    "Pagina oficial de links do Ponto Eletronico para demonstracao, atendimento, conteudos e suporte.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
