// Endereço público do site (produção). Na Vercel vem sozinho de VERCEL_PROJECT_PRODUCTION_URL (next.config.ts);
// dá para fixar outro com NEXT_PUBLIC_SITE_URL (ex.: quando houver domínio próprio).
// Links compartilhados (convites) usam sempre este endereço: os endereços de prévia e da conta na Vercel
// ficam atrás do login da Vercel e não abrem para quem recebe.
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || undefined;

export function publicOrigin() {
  return siteUrl ?? window.location.origin;
}
