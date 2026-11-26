// .ts de propósito (como app/icon.ts): só existe no deploy com servidor.
import { ImageResponse } from "next/og";
import { createElement } from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { ogFonts, SiteOgCard } from "@/lib/og";

export const alt = `${APP_NAME}: ${APP_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function OpenGraphImage() {
  return new ImageResponse(createElement(SiteOgCard), { ...size, fonts: await ogFonts() });
}
