import "@fellowship/ui/styles/globals.sass";
import "./fonts.css";

import type { Metadata, Viewport } from "next";
import { Toaster } from "@fellowship/ui";
import { Inter, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { APP_ICON_SVG_DATA_URI } from "@/lib/appIcon";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";
import { DemoProvider } from "@/lib/demo/store";
import { siteUrl } from "@/lib/site";
import { themeScript } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  // Base para os links absolutos das prévias (og:image) apontarem para o domínio público.
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  openGraph: { type: "website", siteName: APP_NAME, locale: "pt_BR", title: APP_NAME, description: APP_DESCRIPTION },
  twitter: { card: "summary_large_image", title: APP_NAME, description: APP_DESCRIPTION },
  applicationName: APP_NAME,
  // "default": no app instalado no iPhone, a barra de status fica sólida (na theme-color) e a página começa abaixo dela.
  // Com "black-translucent" o iOS desenha a página por baixo com um borrado e erra a altura (sobra uma faixa embaixo).
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  // No export estático os ícones gerados (app/icon.ts) não existem; o favicon vai embutido.
  ...(process.env.STATIC_EXPORT === "1" && { icons: { icon: APP_ICON_SVG_DATA_URI } }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinça para ampliar continua liberada (acessibilidade); o zoom automático ao digitar é evitado com campos de 16px.
  // Sem viewportFit "cover": no app instalado (iOS), "cover" faz o sistema desenhar a página por baixo da barra
  // de status com um borrado por cima e calcular a altura sem ela (sobra uma faixa embaixo). Sem ele, a página fica
  // entre a barra de status e o indicador de início, como os outros apps web.
  // Com o teclado aberto, o conteúdo encolhe em vez de a página rolar por baixo (Chrome no Android).
  interactiveWidget: "resizes-content",
  themeColor: [
    // Mesma cor do cabeçalho do conteúdo (bg-content), para a barra de status não virar uma faixa.
    { media: "(prefers-color-scheme: dark)", color: "#1c1d22" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

// Sem data-theme no <html>, o app segue o sistema. A escolha "escuro / claro / sistema" fica no menu do painel do usuário.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: o script abaixo pode pôr data-theme no <html> antes do React hidratar.
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <DemoProvider>{children}</DemoProvider>
        <Toaster />
      </body>
    </html>
  );
}
