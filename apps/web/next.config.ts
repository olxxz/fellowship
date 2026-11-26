import type { NextConfig } from "next";

// No GitHub Pages o app é exportado como site estático, servido em /<repositório>.
// Fora dele (dev, Vercel) continua um app Next.js normal, com servidor.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.PAGES_BASE_PATH || undefined;

const config: NextConfig = {
  // Os pacotes do monorepo são publicados como código-fonte TypeScript + Sass.
  transpilePackages: ["@fellowship/ui", "@fellowship/core"],
  // Páginas e layouts são .tsx; rotas de API são .ts. No export estático, as rotas de API ficam de fora
  // (o Pages não tem servidor), e a Mesa funciona sem voz.
  pageExtensions: staticExport ? ["tsx"] : ["tsx", "ts"],
  env: {
    // A voz só aparece quando há servidor para gerar o token e o endereço do LiveKit está configurado.
    NEXT_PUBLIC_VOICE_ENABLED: !staticExport && process.env.NEXT_PUBLIC_LIVEKIT_URL ? "1" : "",
  },
  ...(staticExport && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default config;
