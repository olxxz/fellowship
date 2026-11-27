"use server";

// Prévia de link (Open Graph). Busca no servidor com limites: só http(s), sem endereços internos,
// 4 s de prazo e no máximo 300 KB lidos. Resultado guardado em memória por 1 hora.

export interface LinkPreview {
  url: string;
  title: string;
  description?: string;
  image?: string;
  site?: string;
}

const cache = new Map<string, { value: LinkPreview | null; until: number }>();
const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?|.*\.local$|.*\.internal$)/i;

function meta(html: string, key: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  return tag?.match(/content=["']([^"']*)["']/i)?.[1];
}

const decode = (s?: string) =>
  s?.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

export async function getLinkPreview(raw: string): Promise<LinkPreview | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || PRIVATE.test(url.hostname)) return null;
  const hit = cache.get(url.href);
  if (hit && hit.until > Date.now()) return hit.value;

  let value: LinkPreview | null = null;
  try {
    const res = await fetch(url.href, {
      signal: AbortSignal.timeout(4000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)", accept: "text/html" },
      redirect: "follow",
    });
    if (res.ok && (res.headers.get("content-type") ?? "").includes("text/html") && res.body) {
      const reader = res.body.getReader();
      let html = "";
      const decoder = new TextDecoder();
      while (html.length < 300_000) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        html += decoder.decode(chunk, { stream: true });
        if (html.includes("</head>")) break;
      }
      void reader.cancel().catch(() => {});
      const title = decode(meta(html, "og:title") ?? meta(html, "twitter:title") ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]);
      if (title) {
        const image = decode(meta(html, "og:image") ?? meta(html, "twitter:image"));
        value = {
          url: url.href,
          title: title.slice(0, 200),
          description: decode(meta(html, "og:description") ?? meta(html, "description"))?.slice(0, 300),
          image: image ? new URL(image, url).href : undefined,
          site: decode(meta(html, "og:site_name")) ?? url.hostname.replace(/^www\./, ""),
        };
      }
    }
  } catch {
    value = null;
  }
  cache.set(url.href, { value, until: Date.now() + 3600_000 });
  return value;
}
