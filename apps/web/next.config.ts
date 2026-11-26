import type { NextConfig } from "next";

// No GitHub Pages o app é exportado como site estático, servido em /<repositório>.
// Fora dele (dev, Vercel) continua um app Next.js normal, com servidor.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.PAGES_BASE_PATH || undefined;

const config: NextConfig = {
  // Os pacotes do monorepo são publicados como código-fonte TypeScript + Sass.
  transpilePackages: ["@fellowship/ui", "@fellowship/core"],
  ...(staticExport && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default config;
