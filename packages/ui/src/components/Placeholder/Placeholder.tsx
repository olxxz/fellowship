import type { CSSProperties } from "react";
import { cx } from "../../cx";
import { playerColorStyle, type AccentColor } from "../../player-color";
import { seededRandom } from "../../seed";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import styles from "./Placeholder.module.sass";

// Placeholders gerados a partir do id: sempre a mesma imagem para a mesma coisa, sem arquivo guardado.
// Quando alguém subir uma imagem, ela substitui o placeholder.

/**
 * Banner de Cenário ou campanha (3:1): blocos e discos na cor escolhida, como a capa do design system.
 * A composição sai da semente (o id), então cada campanha tem a sua.
 */
export function GeneratedBanner({ seed, color, className }: { seed: string; color: AccentColor; className?: string }) {
  const rand = seededRandom(seed);
  const W = 300;
  const H = 100;
  const unit = 12;
  const blocks = Array.from({ length: 5 + Math.floor(rand() * 3) }, () => {
    const w = (2 + Math.floor(rand() * 6)) * unit;
    const h = (2 + Math.floor(rand() * 5)) * unit;
    // Concentra os blocos à direita: o nome do Cenário fica legível à esquerda.
    const x = W * 0.38 + rand() * (W * 0.7) - w / 2;
    const y = -unit + rand() * (H + unit) - h / 3;
    return { x, y, w, h, o: 0.18 + rand() * 0.6 };
  });
  const discs = Array.from({ length: 2 + Math.floor(rand() * 3) }, () => ({
    cx: W * 0.45 + rand() * W * 0.55,
    cy: rand() * H,
    r: unit * (0.5 + rand() * 1.2),
    o: 0.35 + rand() * 0.5,
  }));
  // O degradê que deixa o nome legível é CSS (sem ids no SVG: o mesmo banner pode aparecer duas vezes na página).
  return (
    <div className={cx(styles.banner, className)} style={playerColorStyle(color, { color: "var(--player-color)" })} aria-hidden="true">
      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <rect width={W} height={H} style={{ fill: "var(--bg-sidebar)" }} />
        <rect width={W} height={H} fill="currentColor" opacity={0.14} />
        {blocks.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={unit * 0.75} fill="currentColor" opacity={b.o} />
        ))}
        {discs.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} style={{ fill: "var(--bg-sidebar)" }} opacity={d.o} />
        ))}
      </svg>
    </div>
  );
}

/** Avatar de perfil gerado: dois discos e um bloco na cor da pessoa (alternativa à inicial). */
export function GeneratedAvatar({ seed, color, size = 40 }: { seed: string; color: AccentColor; size?: number }) {
  const rand = seededRandom(seed);
  const shapes = [0, 1, 2].map(() => ({ x: rand() * 40, y: rand() * 40, r: 8 + rand() * 14, o: 0.35 + rand() * 0.55 }));
  const block = { x: rand() * 24, y: rand() * 24, s: 14 + rand() * 12 };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      style={playerColorStyle(color, { color: "var(--player-color)", borderRadius: "50%", overflow: "hidden" } as CSSProperties)}
    >
      <g>
        <rect width="40" height="40" style={{ fill: "var(--bg-raised)" }} />
        <rect width="40" height="40" fill="currentColor" opacity={0.3} />
        <rect x={block.x} y={block.y} width={block.s} height={block.s} rx="4" fill="currentColor" opacity={0.85} />
        {shapes.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="currentColor" opacity={c.o} />
        ))}
      </g>
    </svg>
  );
}

export type Archetype = "guerreiro" | "arcano" | "ladino" | "suporte" | "patrulheiro" | "criatura";

const ARCHETYPE_ICON: Record<Archetype, IconName> = {
  guerreiro: "sword",
  arcano: "sparkle",
  ladino: "dagger",
  suporte: "shield",
  patrulheiro: "bow",
  criatura: "claw",
};

export const ARCHETYPES = Object.keys(ARCHETYPE_ICON) as Archetype[];

/** Retrato de personagem sem imagem: emblema do arquétipo na cor dele e a inicial no canto. */
export function CharacterPlaceholder({ name, color, archetype }: { name: string; color: AccentColor; archetype: Archetype }) {
  return (
    <div className={styles.character} style={playerColorStyle(color)} role="img" aria-label={`${name} (sem retrato)`}>
      <Icon name={ARCHETYPE_ICON[archetype]} size={64} className={styles.characterIcon} />
      <span className={styles.characterInitial} aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

export type CompendiumKind = "bestiario" | "item" | "magia" | "lugar" | "faccao" | "personagem" | "historia" | "regra";

const KIND_ICON: Record<CompendiumKind, IconName> = {
  bestiario: "claw",
  item: "sword",
  magia: "sparkle",
  lugar: "map",
  faccao: "flag",
  personagem: "users",
  historia: "book",
  regra: "rules",
};

export const COMPENDIUM_KINDS = Object.keys(KIND_ICON) as CompendiumKind[];

/** Miniatura de entrada do compêndio sem imagem: ícone do tipo sobre a cor da campanha. */
export function CompendiumThumb({ kind, color, label }: { kind: CompendiumKind; color: AccentColor; label?: string }) {
  return (
    <div className={styles.thumb} style={playerColorStyle(color)} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <Icon name={KIND_ICON[kind]} size={40} className={styles.thumbIcon} />
    </div>
  );
}
