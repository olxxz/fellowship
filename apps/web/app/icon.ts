// .ts (e não .tsx) de propósito: no export estático do Pages só .tsx vira rota, e lá o favicon é um SVG embutido
// (o Next não aplica o basePath aos ícones gerados). Na Vercel, estes PNGs servem para o app instalado.
import { ImageResponse } from "next/og";
import { createElement } from "react";
import { AppIconArt } from "@/lib/appIcon";

export const contentType = "image/png";
export const dynamic = "force-static";

export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType },
    { id: "192", size: { width: 192, height: 192 }, contentType },
    { id: "512", size: { width: 512, height: 512 }, contentType },
  ];
}

export default async function Icon({ id }: { id: Promise<string> | string }) {
  const size = Number(await id);
  return new ImageResponse(createElement(AppIconArt, { size }), { width: size, height: size });
}
