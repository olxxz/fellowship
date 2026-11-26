import "@fellowship/ui/styles/globals.sass";
import "./fonts.css";

import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";
import { DemoProvider } from "@/lib/demo/store";
import { themeScript } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export const viewport: Viewport = {
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
