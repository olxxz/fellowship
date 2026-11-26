import type { NextConfig } from "next";

// No GitHub Pages o app é exportado como site estático, servido em /<repositório>.
// Fora dele (dev, Vercel) continua um app Next.js normal, com servidor.
const staticExport = process.env.STATIC_EXPORT === "1";
// Endereço público: NEXT_PUBLIC_SITE_URL, ou o domínio de produção que a Vercel informa no build.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
const basePath = process.env.PAGES_BASE_PATH || undefined;

const config: NextConfig = {
  // Os pacotes do monorepo são publicados como código-fonte TypeScript + Sass.
  transpilePackages: ["@fellowship/ui", "@fellowship/core", "@fellowship/db"],
  // Páginas e layouts são .tsx; rotas de API são .ts. No export estático, as rotas de API ficam de fora
  // (o Pages não tem servidor), e a Mesa funciona sem voz.
  pageExtensions: staticExport ? ["tsx"] : ["tsx", "ts"],
  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl,
    // A voz só aparece quando há servidor para gerar o token e o endereço do LiveKit está configurado.
    NEXT_PUBLIC_VOICE_ENABLED: !staticExport && process.env.NEXT_PUBLIC_LIVEKIT_URL ? "1" : "",
    // Login e dados reais: precisa de servidor e das chaves públicas do Supabase.
    NEXT_PUBLIC_AUTH_ENABLED:
      !staticExport && process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        ? "1"
        : "",
  },
  ...(staticExport && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default config;
