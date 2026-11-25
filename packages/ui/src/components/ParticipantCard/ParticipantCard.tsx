import type { ReactNode } from "react";
import { cx } from "../../cx";
import { NARRATOR_COLOR, playerColorStyle, type PlayerColor } from "../../player-color";
import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import styles from "./ParticipantCard.module.sass";

export interface ParticipantCardProps {
  /** Personagem em primeiro plano. Para o mestre: o nome da campanha ou do NPC que interpreta agora. */
  characterName: string;
  playerName: string;
  /** Cor do personagem nesta campanha. Padrão: player-4 (a do Narrador). */
  color?: PlayerColor;
  portraitUrl?: string;
  playerAvatarUrl?: string;
  /** A borda acende na cor do personagem, com onda sonora e anúncio para leitores de tela. */
  speaking?: boolean;
  muted?: boolean;
  /** Vídeo da câmera (ex.: o <video> do LiveKit). Com câmera, o retrato vai para o canto. */
  video?: ReactNode;
}

function Portrait({ url, name }: { url?: string; name: string }) {
  return url ? <img className={styles.media} src={url} alt="" /> : <span className={styles.initial}>{name.charAt(0)}</span>;
}

function ParticipantCardBase({
  characterName,
  playerName,
  color = NARRATOR_COLOR,
  portraitUrl,
  playerAvatarUrl,
  speaking,
  muted,
  video,
}: ParticipantCardProps) {
  return (
    <article
      className={cx(styles.card, speaking && styles.speaking)}
      style={playerColorStyle(color)}
      aria-label={`${characterName}, jogado por ${playerName}`}
    >
      <div className={styles.stage}>
        {video ? <div className={styles.media}>{video}</div> : <Portrait url={portraitUrl} name={characterName} />}
        {video ? (
          <span aria-hidden="true" className={cx(styles.corner, styles.cornerCharacter)}>
            {portraitUrl ? <img src={portraitUrl} alt="" /> : characterName.charAt(0)}
          </span>
        ) : (
          <span aria-hidden="true" className={styles.corner}>
            {playerAvatarUrl ? <img src={playerAvatarUrl} alt="" /> : playerName.charAt(0)}
          </span>
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.names}>
          <div className={styles.character}>{characterName}</div>
          <div className={styles.player}>{playerName}</div>
        </div>
        {muted ? (
          <span className={cx(styles.status, styles.statusMuted)}>
            <Icon name="micOff" size={14} />
            mutado
          </span>
        ) : (
          speaking && (
            <span className={cx(styles.status, styles.statusSpeaking)} aria-hidden="true">
              <Icon name="wave" size={14} />
              falando
            </span>
          )
        )}
      </div>
      <span role="status" className={styles.hidden}>
        {speaking && !muted ? `${characterName} está falando` : ""}
      </span>
    </article>
  );
}

function ParticipantCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <Skeleton height="auto" style={{ aspectRatio: "3 / 2", borderRadius: "var(--radius-lg)" }} />
      <span className={styles.skeletonFooter}>
        <Skeleton width="45%" height={14} />
        <Skeleton width="30%" height={10} />
      </span>
    </div>
  );
}

export const ParticipantCard = Object.assign(ParticipantCardBase, { Skeleton: ParticipantCardSkeleton });
