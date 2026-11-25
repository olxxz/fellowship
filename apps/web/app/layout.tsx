import "@fellowship/ui/styles/globals.sass";
import "./fonts.css";

import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Fellowship", template: "%s · Fellowship" },
  description: "Cenários, campanhas e a Mesa do seu grupo num lugar só.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0f12" },
    { media: "(prefers-color-scheme: light)", color: "#e3e4e8" },
  ],
};

// Sem data-theme no <html>, o app segue o sistema. A escolha "escuro / claro / sistema" entra nas configurações do usuário.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
