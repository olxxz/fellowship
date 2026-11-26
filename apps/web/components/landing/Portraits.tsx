// Retratos ilustrados da página de entrada: elfo, anão, ogro e felina na chamada, de headset.
// Vetor plano, cores chapadas; o fundo usa a cor do personagem misturada ao tema (claro ou escuro).
import type { ReactNode } from "react";

const INK = "#1d1f26";
const HEADSET = "#2b2d36";
const HEADSET_LIGHT = "#454857";

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMax slice" role="img" aria-label={label} style={{ display: "block", width: "100%", height: "100%" }}>
      <rect width="300" height="200" style={{ fill: "color-mix(in srgb, var(--player-color) 26%, var(--bg-raised))" }} />
      {/* luz suave atrás da cabeça */}
      <circle cx="150" cy="92" r="78" style={{ fill: "color-mix(in srgb, var(--player-color) 40%, var(--bg-raised))" }} />
      {children}
    </svg>
  );
}

/** Headset: arco sobre a cabeça, conchas nas laterais e microfone até a boca. */
function Headset({ cx = 150, top = 46, left = 108, right = 192, cupY = 102, mic = true, micTo = { x: 166, y: 132 } }) {
  return (
    <g>
      <path d={`M ${left} ${cupY - 6} C ${left - 2} ${top - 4}, ${right + 2} ${top - 4}, ${right} ${cupY - 6}`} fill="none" stroke={HEADSET} strokeWidth="7" strokeLinecap="round" />
      <rect x={left - 11} y={cupY - 16} width="18" height="30" rx="8" fill={HEADSET} />
      <rect x={right - 7} y={cupY - 16} width="18" height="30" rx="8" fill={HEADSET} />
      <rect x={left - 7} y={cupY - 10} width="6" height="18" rx="3" fill={HEADSET_LIGHT} />
      <rect x={right + 1} y={cupY - 10} width="6" height="18" rx="3" fill={HEADSET_LIGHT} />
      {mic && (
        <>
          <path d={`M ${left - 2} ${cupY + 10} C ${left} ${micTo.y + 6}, ${micTo.x - 26} ${micTo.y + 4}, ${micTo.x - 6} ${micTo.y}`} fill="none" stroke={HEADSET} strokeWidth="4" strokeLinecap="round" />
          <rect x={micTo.x - 9} y={micTo.y - 5} width="13" height="9" rx="4.5" fill={HEADSET} />
        </>
      )}
      <circle cx={cx} cy={top} r="0" />
    </g>
  );
}

export function ElfArt() {
  const skin = "#f2cdaa";
  const skinShade = "#e2ad86";
  const hair = "#efdc9a";
  const hairShade = "#d9bf6b";
  return (
    <Frame label="Kael, elfo, falando">
      {/* cabelo de trás, caindo nos ombros */}
      <path d="M104 92 C100 140 98 172 110 196 L190 196 C202 172 200 140 196 92 C190 60 110 60 104 92 Z" fill={hairShade} />
      {/* ombros e túnica */}
      <path d="M58 200 C62 168 96 152 150 150 C204 152 238 168 242 200 Z" fill="#2f7f74" />
      <path d="M128 151 L150 178 L172 151 Z" fill="#e9dfc3" />
      <path d="M58 200 C62 176 80 162 104 156 L112 200 Z" fill="#276c63" />
      {/* pescoço */}
      <rect x="137" y="122" width="26" height="34" rx="8" fill={skinShade} />
      {/* orelhas longas */}
      <path d="M115 100 L74 64 C80 84 92 104 117 114 Z" fill={skin} />
      <path d="M113 102 L86 77 C92 92 100 104 114 109 Z" fill={skinShade} />
      <path d="M185 100 L226 64 C220 84 208 104 183 114 Z" fill={skin} />
      <path d="M187 102 L214 77 C208 92 200 104 186 109 Z" fill={skinShade} />
      {/* rosto */}
      <path d="M114 92 C114 62 186 62 186 92 C186 122 170 140 150 140 C130 140 114 122 114 92 Z" fill={skin} />
      {/* cabelo da frente, repartido */}
      <path d="M110 96 C106 58 134 46 150 48 C168 46 196 58 190 96 C184 80 172 70 156 66 C150 76 136 84 118 86 C114 90 112 93 110 96 Z" fill={hair} />
      <path d="M156 66 C162 72 168 80 172 92 C176 78 168 70 156 66 Z" fill={hairShade} opacity="0.6" />
      {/* olhos amendoados e sobrancelhas finas */}
      <path d="M126 101 C130 94 142 94 146 101 C142 106 130 106 126 101 Z" fill="#ffffff" />
      <path d="M154 101 C158 94 170 94 174 101 C170 106 158 106 154 101 Z" fill="#ffffff" />
      <circle cx="137" cy="100.5" r="4.4" fill="#3d7a4f" />
      <circle cx="163" cy="100.5" r="4.4" fill="#3d7a4f" />
      <circle cx="137" cy="100.5" r="2.2" fill={INK} />
      <circle cx="163" cy="100.5" r="2.2" fill={INK} />
      <circle cx="138.4" cy="99" r="1" fill="#ffffff" />
      <circle cx="164.4" cy="99" r="1" fill="#ffffff" />
      <path d="M125 100 C130 93 142 93 147 99 M153 99 C158 93 170 93 175 100" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M126 89 L144 86" stroke={hairShade} strokeWidth="3" strokeLinecap="round" />
      <path d="M156 86 L174 89" stroke={hairShade} strokeWidth="3" strokeLinecap="round" />
      {/* nariz e boca aberta (falando) */}
      <path d="M150 104 L147 116 L152 117" fill="none" stroke={skinShade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M140 124 C144 132 156 132 160 124 Z" fill="#7a2e2b" />
      <path d="M144 128 C147 131 153 131 156 128" fill="none" stroke="#e46d6d" strokeWidth="3" strokeLinecap="round" />
      <circle cx="127" cy="113" r="6" fill="#ec9a8c" opacity="0.45" />
      <circle cx="173" cy="113" r="6" fill="#ec9a8c" opacity="0.45" />
      <Headset left={113} right={187} top={44} cupY={110} micTo={{ x: 140, y: 132 }} />
    </Frame>
  );
}

export function DwarfArt() {
  const skin = "#e8b08b";
  const skinShade = "#d18e69";
  const beard = "#c75b2e";
  const beardShade = "#a8461f";
  return (
    <Frame label="Brom, anão">
      {/* ombros com couro e ombreira */}
      <path d="M52 200 C56 166 92 150 150 148 C208 150 244 166 248 200 Z" fill="#6f4a33" />
      <path d="M52 200 C54 176 70 160 96 154 C104 170 104 186 100 200 Z" fill="#8a8f9b" />
      <path d="M248 200 C246 176 230 160 204 154 C196 170 196 186 200 200 Z" fill="#8a8f9b" />
      {/* orelhas */}
      <ellipse cx="108" cy="100" rx="9" ry="13" fill={skinShade} />
      <ellipse cx="192" cy="100" rx="9" ry="13" fill={skinShade} />
      {/* rosto largo */}
      <path d="M108 98 C108 62 192 62 192 98 C192 120 176 134 150 134 C124 134 108 120 108 98 Z" fill={skin} />
      {/* barba grande com tranças */}
      <path d="M108 100 C106 138 118 176 150 192 C182 176 194 138 192 100 C186 116 172 124 150 124 C128 124 114 116 108 100 Z" fill={beard} />
      <path d="M138 150 C136 166 140 180 146 190" fill="none" stroke={beardShade} strokeWidth="4" strokeLinecap="round" />
      <path d="M162 150 C164 166 160 180 154 190" fill="none" stroke={beardShade} strokeWidth="4" strokeLinecap="round" />
      <rect x="139" y="168" width="10" height="8" rx="2" fill="#d4a24c" />
      <rect x="151" y="168" width="10" height="8" rx="2" fill="#d4a24c" />
      {/* bigode */}
      <path d="M124 122 C134 112 146 114 150 120 C154 114 166 112 176 122 C166 126 156 126 150 124 C144 126 134 126 124 122 Z" fill={beardShade} />
      {/* nariz redondo */}
      <ellipse cx="150" cy="108" rx="10" ry="9" fill={skinShade} />
      {/* olhos pequenos e sobrancelhas grossas */}
      <circle cx="133" cy="96" r="3.6" fill={INK} />
      <circle cx="167" cy="96" r="3.6" fill={INK} />
      <path d="M122 88 C128 82 138 82 143 86" fill="none" stroke={beard} strokeWidth="6" strokeLinecap="round" />
      <path d="M157 86 C162 82 172 82 178 88" fill="none" stroke={beard} strokeWidth="6" strokeLinecap="round" />
      {/* elmo */}
      <path d="M104 86 C104 40 196 40 196 86 Z" fill="#9aa0ab" />
      <path d="M100 82 L200 82 C202 86 202 90 200 92 L100 92 C98 90 98 86 100 82 Z" fill="#767c88" />
      <path d="M146 44 L154 44 L154 82 L146 82 Z" fill="#767c88" />
      <circle cx="116" cy="87" r="2.2" fill="#c5cad3" />
      <circle cx="184" cy="87" r="2.2" fill="#c5cad3" />
      <Headset left={107} right={193} top={42} cupY={104} micTo={{ x: 134, y: 126 }} />
    </Frame>
  );
}

export function OgreArt() {
  const skin = "#8fb164";
  const skinShade = "#749a4b";
  return (
    <Frame label="Morg, ogra, com o microfone desligado">
      {/* ombros largos e colete */}
      <path d="M40 200 C44 160 88 144 150 142 C212 144 256 160 260 200 Z" fill={skinShade} />
      <path d="M88 200 C92 170 116 156 150 155 C184 156 208 170 212 200 Z" fill="#7b5236" />
      <path d="M140 156 L150 200 L160 156 Z" fill="#5f3e28" />
      {/* orelhas pequenas */}
      <ellipse cx="102" cy="100" rx="10" ry="12" fill={skinShade} />
      <ellipse cx="198" cy="100" rx="10" ry="12" fill={skinShade} />
      {/* cabeça larga com mandíbula forte */}
      <path d="M104 92 C104 58 196 58 196 92 C200 116 196 140 176 148 C160 152 140 152 124 148 C104 140 100 116 104 92 Z" fill={skin} />
      {/* coque */}
      <ellipse cx="150" cy="56" rx="14" ry="11" fill="#3b3a35" />
      <path d="M118 70 C130 60 170 60 182 70 C170 66 130 66 118 70 Z" fill="#3b3a35" />
      {/* testa pesada e olhos pequenos */}
      <path d="M118 92 C128 84 142 86 146 92 M154 92 C158 86 172 84 182 92" fill="none" stroke={skinShade} strokeWidth="7" strokeLinecap="round" />
      <circle cx="134" cy="100" r="3.4" fill={INK} />
      <circle cx="166" cy="100" r="3.4" fill={INK} />
      {/* nariz achatado */}
      <path d="M142 116 C142 106 158 106 158 116 C156 120 144 120 142 116 Z" fill={skinShade} />
      {/* boca fechada com presas */}
      <path d="M130 134 C142 138 158 138 170 134" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M134 135 L137 124 L141 136 Z" fill="#f4efe1" />
      <path d="M166 135 L163 124 L159 136 Z" fill="#f4efe1" />
      {/* brinco */}
      <circle cx="198" cy="114" r="5" fill="none" stroke="#d4a24c" strokeWidth="3" />
      {/* headset com o microfone levantado (mutada) */}
      <Headset left={103} right={197} top={52} cupY={102} mic={false} />
      <path d="M92 96 C80 80 86 62 100 58" fill="none" stroke={HEADSET} strokeWidth="4" strokeLinecap="round" />
      <rect x="96" y="52" width="13" height="9" rx="4.5" fill={HEADSET} />
    </Frame>
  );
}

export function FelineArt() {
  const fur = "#e6a15c";
  const furShade = "#c7783a";
  const muzzle = "#f7ead9";
  return (
    <Frame label="Sasha, felina">
      {/* capa com capuz caído */}
      <path d="M50 200 C54 164 92 148 150 146 C208 148 246 164 250 200 Z" fill="#3e5f9e" />
      <path d="M96 156 C112 146 188 146 204 156 C190 168 110 168 96 156 Z" fill="#33508a" />
      <circle cx="150" cy="166" r="6" fill="#d4a24c" />
      {/* orelhas de gato */}
      <path d="M108 82 L112 34 L142 62 Z" fill={fur} />
      <path d="M114 72 L116 46 L134 62 Z" fill="#f0a6a0" />
      <path d="M192 82 L188 34 L158 62 Z" fill={fur} />
      <path d="M186 72 L184 46 L166 62 Z" fill="#f0a6a0" />
      {/* cabeça */}
      <path d="M106 96 C106 60 194 60 194 96 C194 128 174 146 150 146 C126 146 106 128 106 96 Z" fill={fur} />
      {/* listras */}
      <path d="M142 62 C144 70 144 76 142 82 M150 60 L150 80 M158 62 C156 70 156 76 158 82" fill="none" stroke={furShade} strokeWidth="4" strokeLinecap="round" />
      <path d="M108 104 L122 106 M108 114 L120 114 M192 104 L178 106 M192 114 L180 114" stroke={furShade} strokeWidth="4" strokeLinecap="round" />
      {/* focinho claro */}
      <path d="M128 118 C128 104 172 104 172 118 C172 134 162 140 150 140 C138 140 128 134 128 118 Z" fill={muzzle} />
      {/* olhos verdes de pupila fina */}
      <ellipse cx="133" cy="98" rx="8" ry="7" fill="#a6d36a" />
      <ellipse cx="167" cy="98" rx="8" ry="7" fill="#a6d36a" />
      <ellipse cx="133" cy="98" rx="2.2" ry="6" fill={INK} />
      <ellipse cx="167" cy="98" rx="2.2" ry="6" fill={INK} />
      {/* nariz, boca e bigodes */}
      <path d="M144 114 L156 114 L150 121 Z" fill="#e0837c" />
      <path d="M150 121 L150 126 M150 126 C146 130 141 130 139 127 M150 126 C154 130 159 130 161 127" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M128 122 L102 118 M128 127 L104 130 M172 122 L198 118 M172 127 L196 130" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
      {/* headset passando entre as orelhas */}
      <Headset left={107} right={193} top={58} cupY={104} micTo={{ x: 162, y: 134 }} />
    </Frame>
  );
}
