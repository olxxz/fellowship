// Cartões de prévia de link (Open Graph, 1200×630) desenhados em código para o ImageResponse.
import { readableOn, seededRandom } from "@fellowship/ui";
import { APP_NAME, APP_TAGLINE } from "./brand";

const BG = "#0e0f12";
const TEXT = "#ececf1";
const MUTED = "#a0a1ab";
const GOLD = "#d4a24c";
const INK = "#1a1408";

function Mark({ size = 56 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l9 5v10l-9 5-9-5V7z" />
        <path d="M12 7l5 8H7z" />
      </svg>
    </div>
  );
}

/** Blocos e discos na cor, à direita (mesma linguagem do banner gerado). */
function Blocks({ seed, color }: { seed: string; color: string }) {
  const rand = seededRandom(seed);
  const items = Array.from({ length: 7 }, () => ({
    x: 640 + rand() * 520,
    y: -40 + rand() * 640,
    w: 80 + rand() * 200,
    h: 80 + rand() * 160,
    o: 0.15 + rand() * 0.55,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {items.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 36, background: color, opacity: b.o }} />
      ))}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${BG} 0%, ${BG} 48%, rgba(14,15,18,0.6) 66%, rgba(14,15,18,0) 100%)` }} />
    </div>
  );
}

export function SiteOgCard() {
  return (
    <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: BG, color: TEXT, position: "relative", fontFamily: "Inter" }}>
      <Blocks seed="fellowship" color={GOLD} />
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Mark />
        <div style={{ fontSize: 40, fontWeight: 700, fontFamily: "Space Grotesk" }}>{APP_NAME}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, fontFamily: "Space Grotesk" }}>{APP_TAGLINE}</div>
        <div style={{ fontSize: 30, color: MUTED, lineHeight: 1.35 }}>Voz com a cara dos personagens, ficha, dados e a memória da campanha.</div>
      </div>
    </div>
  );
}

export interface InviteOgProps {
  name: string;
  short: string;
  color: string;
  inviter: string;
  memberCount: number;
  description: string | null;
}

export function InviteOgCard({ name, short, color, inviter, memberCount, description }: InviteOgProps) {
  return (
    <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: BG, color: TEXT, position: "relative", fontFamily: "Inter" }}>
      <Blocks seed={name} color={color} />
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Mark />
        <div style={{ fontSize: 40, fontWeight: 700, fontFamily: "Space Grotesk" }}>{APP_NAME}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 700 }}>
        <div style={{ fontSize: 32, color: MUTED }}>{`${inviter} chamou você para o Cenário`}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ width: 120, height: 120, flexShrink: 0, borderRadius: 32, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, fontWeight: 700, fontFamily: "Space Grotesk", color: readableOn(color) }}>
            {short}
          </div>
          <div style={{ fontSize: name.length > 22 ? 58 : 72, fontWeight: 700, lineHeight: 1.05, fontFamily: "Space Grotesk" }}>{name}</div>
        </div>
        <div style={{ fontSize: 28, color: MUTED, lineHeight: 1.35 }}>
          {[description, `${memberCount} ${memberCount === 1 ? "membro" : "membros"}`].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}

async function googleFont(family: string, weight: number) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`)).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype|woff)'\)/)?.[1];
  if (!url) throw new Error(`fonte ${family} não encontrada`);
  return (await fetch(url)).arrayBuffer();
}

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };

/** Inter (texto) e Space Grotesk (títulos), as fontes do design system. Se não der para baixar, fica a padrão. */
export async function ogFonts(): Promise<OgFont[]> {
  try {
    const [inter, grotesk] = await Promise.all([googleFont("Inter", 400), googleFont("Space+Grotesk", 700)]);
    return [
      { name: "Inter", data: inter, weight: 400, style: "normal" },
      { name: "Space Grotesk", data: grotesk, weight: 700, style: "normal" },
    ];
  } catch {
    return [];
  }
}
