import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Jornada | Links oficiais", template: "%s | Jornada" },
  description: "Controle de ponto simples, seguro e rastreável para sua empresa.",
  applicationName: "Jornada",
  keywords: ["Jornada", "controle de ponto", "gestão de ponto", "ponto eletrônico"],
  authors: [{ name: "Jornada" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico?v=5", type: "image/x-icon" },
      { url: "/favicon-32.png?v=5", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png?v=5", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png?v=5", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png?v=5", type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: "/apple-touch-icon.png?v=5", type: "image/png", sizes: "180x180" }]
  },
  openGraph: {
    title: "Jornada",
    description: "Controle de ponto simples, seguro e rastreável para sua empresa.",
    siteName: "Jornada",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/assets/jornada/logo-jornada-light.png", alt: "Logo Jornada" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Jornada",
    description: "Controle de ponto simples, seguro e rastreável para sua empresa.",
    images: ["/assets/jornada/logo-jornada-light.png"]
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem("jornada-theme");
                  var theme = storedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                  document.documentElement.classList.toggle("dark", theme === "dark");
                  document.documentElement.style.colorScheme = theme;
                } catch (error) {}
              })();
            `
          }}
        />
        <ThemeProvider>
          <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
