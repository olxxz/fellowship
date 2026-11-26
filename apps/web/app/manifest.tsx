import type { MetadataRoute } from "next";
import { APP_ICON_SVG_DATA_URI } from "@/lib/appIcon";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";

export const dynamic = "force-static";

// Instalável como app (PWA). Instalado, o iPhone não tem o gesto de voltar do Safari na borda,
// e as gavetas laterais respondem ao arrastar em toda a tela. Caminhos relativos funcionam também no Pages (/fellowship).
export default function manifest(): MetadataRoute.Manifest {
  const auth = process.env.NEXT_PUBLIC_AUTH_ENABLED === "1";
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    lang: "pt-BR",
    start_url: auth ? "/inicio" : "./",
    scope: auth ? "/" : "./",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1c1d22",
    theme_color: "#1c1d22",
    // No export estático (Pages) os PNGs gerados não existem: usa o SVG embutido.
    icons:
      process.env.STATIC_EXPORT === "1"
        ? [{ src: APP_ICON_SVG_DATA_URI, sizes: "any", type: "image/svg+xml" }]
        : [
            { src: "icon/192", sizes: "192x192", type: "image/png" },
            { src: "icon/512", sizes: "512x512", type: "image/png" },
            { src: "icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
  };
}
