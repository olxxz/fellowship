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
  /** Retrato desenhado (ex.: ilustração em SVG), no lugar da imagem ou da inicial. */
  portraitArt?: ReactNode;
  playerAvatarUrl?: string;
  /** A borda acende na cor do personagem, com onda sonora e anúncio para leitores de tela. */
  speaking?: boolean;
  muted?: boolean;
  /** Não está conectado à voz: card esmaecido e status "fora da chamada". */
  offline?: boolean;
  /** Vídeo da câmera (ex.: o <video> do LiveKit). Com câmera, o retrato vai para o canto. */
  video?: ReactNode;
  /**
   * `full`: retrato, nomes e status. `portrait`: só o retrato, para grades densas e o celular;
   * o status vira um selo sobre a imagem e o nome fica no rótulo acessível e na dica ao passar o mouse.
   */
  variant?: "full" | "portrait";
}

function Portrait({ url, name }: { url?: string; name: string }) {
  return url ? <img className={styles.media} src={url} alt="" /> : <span className={styles.initial}>{name.charAt(0)}</span>;
}

function ParticipantCardBase({
  characterName,
  playerName,
  color = NARRATOR_COLOR,
  portraitUrl,
  portraitArt,
  playerAvatarUrl,
  speaking,
  muted,
  offline,
  video,
  variant = "full",
}: ParticipantCardProps) {
  const portraitOnly = variant === "portrait";
  const label = `${characterName}, jogado por ${playerName}${offline ? ", fora da chamada" : muted ? ", mutado" : ""}`;

  return (
    <article
      className={cx(styles.card, portraitOnly && styles.portraitOnly, offline && styles.offline, speaking && !muted && !offline && styles.speaking)}
      style={playerColorStyle(color)}
      aria-label={label}
      title={portraitOnly ? label : undefined}
    >
      <div className={styles.stage}>
        {portraitOnly && !offline && (muted || speaking) && (
          <span aria-hidden="true" className={cx(styles.badge, muted ? styles.badgeMuted : styles.badgeSpeaking)}>
            <Icon name={muted ? "micOff" : "wave"} size={14} motion={muted ? undefined : "wave"} />
          </span>
        )}
        {video ? (
          <div className={styles.media}>{video}</div>
        ) : portraitArt ? (
          <div className={styles.media}>{portraitArt}</div>
        ) : (
          <Portrait url={portraitUrl} name={characterName} />
        )}
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
      {!portraitOnly && (
        <div className={styles.footer}>
          <div className={styles.names}>
            <div className={styles.character}>{characterName}</div>
            <div className={styles.player}>{playerName}</div>
          </div>
          {offline ? (
            <span className={styles.status}>fora da chamada</span>
          ) : muted ? (
            <span className={cx(styles.status, styles.statusMuted)}>
              <Icon name="micOff" size={14} />
              mutado
            </span>
          ) : (
            speaking && (
              <span className={cx(styles.status, styles.statusSpeaking)} aria-hidden="true">
                <Icon name="wave" size={14} motion="wave" />
                falando
              </span>
            )
          )}
        </div>
      )}
      <span role="status" className={styles.hidden}>
        {speaking && !muted && !offline ? `${characterName} está falando` : ""}
      </span>
    </article>
  );
}

function ParticipantCardSkeleton({ variant = "full" }: Pick<ParticipantCardProps, "variant">) {
  const portraitOnly = variant === "portrait";
  return (
    <div className={cx(styles.card, portraitOnly && styles.portraitOnly)} aria-hidden="true">
      <Skeleton height="auto" style={{ aspectRatio: "3 / 2", borderRadius: "var(--radius-lg)" }} />
      {!portraitOnly && (
        <span className={styles.skeletonFooter}>
          <Skeleton width="45%" height={14} />
          <Skeleton width="30%" height={10} />
        </span>
      )}
    </div>
  );
}

export const ParticipantCard = Object.assign(ParticipantCardBase, { Skeleton: ParticipantCardSkeleton });
