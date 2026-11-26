import "@fellowship/ui/styles/globals.sass";
import "./fonts.css";

import type { Metadata, Viewport } from "next";
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
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
  // No export estático os ícones gerados (app/icon.ts) não existem; o favicon vai embutido.
  ...(process.env.STATIC_EXPORT === "1" && { icons: { icon: APP_ICON_SVG_DATA_URI } }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinça para ampliar continua liberada (acessibilidade); o zoom automático ao digitar é evitado com campos de 16px.
  viewportFit: "cover",
  // Com o teclado aberto, o conteúdo encolhe em vez de a página rolar por baixo (Chrome no Android).
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0f12" },
    { media: "(prefers-color-scheme: light)", color: "#e3e4e8" },
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
      </body>
    </html>
  );
}
