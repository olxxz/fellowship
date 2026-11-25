import type { MouseEventHandler } from "react";
import { cx } from "../../cx";
import { playerColorStyle, type PlayerColor } from "../../player-color";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import { Skeleton } from "../Skeleton/Skeleton";
import styles from "./CampaignCard.module.sass";

export interface CampaignParticipant {
  name: string;
  color: PlayerColor;
  avatarUrl?: string;
}

export interface CampaignCardProps {
  name: string;
  /** Ícone da campanha. Padrão: d20. */
  icon?: IconName;
  /** Cor do ícone fora de sessão. Ao vivo, o ícone usa mesa-gold. */
  color?: PlayerColor;
  /** Sessão ao vivo: superfície da Mesa, ponto verde e quem está na Mesa. */
  live?: { session: number; participants?: CampaignParticipant[] };
  /** Fora de sessão: data da próxima sessão ("sáb 15h"). */
  nextSession?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
}

const MAX_AVATARS = 3;

function listNames(names: string[], extra: number) {
  if (extra > 0) return `${names.join(", ")} e mais ${extra}`;
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

function CampaignCardBase({ name, icon = "dice", color, live, nextSession, href, onClick }: CampaignCardProps) {
  const participants = live?.participants ?? [];
  const shown = participants.slice(0, MAX_AVATARS);
  const extra = participants.length - shown.length;

  const body = (
    <>
      <span className={styles.icon} style={color && !live ? playerColorStyle(color) : undefined}>
        <Icon name={icon} size={22} />
      </span>
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        {live ? (
          <span className={styles.status}>
            <span aria-hidden="true" className={styles.liveDot} />
            <span className={styles.statusText}>Ao vivo · Sessão {live.session}</span>
          </span>
        ) : (
          nextSession && (
            <span className={styles.status}>
              <span className={styles.statusText}>Próxima: {nextSession}</span>
            </span>
          )
        )}
      </span>
      {shown.length > 0 && (
        <>
          <span aria-hidden="true" className={styles.avatars}>
            {shown.map((p) => (
              <span key={p.name} className={styles.avatar} style={playerColorStyle(p.color)}>
                {p.avatarUrl ? <img src={p.avatarUrl} alt="" /> : p.name.charAt(0)}
              </span>
            ))}
            {extra > 0 && <span className={cx(styles.avatar, styles.more)}>+{extra}</span>}
          </span>
          <span className={styles.hidden}>
            . Na Mesa: {listNames(shown.map((p) => p.name), extra)}
          </span>
        </>
      )}
    </>
  );

  const className = cx(styles.card, live && styles.live);
  return href ? (
    <a className={className} href={href} onClick={onClick}>
      {body}
    </a>
  ) : (
    <button type="button" className={className} onClick={onClick}>
      {body}
    </button>
  );
}

function CampaignCardSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <Skeleton width={40} height={40} />
      <span className={styles.skeletonText}>
        <Skeleton width="65%" height={14} />
        <Skeleton width="40%" height={10} />
      </span>
    </div>
  );
}

export const CampaignCard = Object.assign(CampaignCardBase, { Skeleton: CampaignCardSkeleton });
