// .ts de propósito: ver app/icon.ts.
import { ImageResponse } from "next/og";
import { createElement } from "react";
import { AppIconArt } from "@/lib/appIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function AppleIcon() {
  return new ImageResponse(createElement(AppIconArt, { size: 180 }), size);
}
