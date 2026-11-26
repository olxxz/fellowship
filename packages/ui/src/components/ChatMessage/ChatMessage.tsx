import type { ReactNode } from "react";
import { cx } from "../../cx";
import { playerColorStyle, type AccentColor } from "../../player-color";
import { Avatar } from "../Avatar/Avatar";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import { Skeleton, SkeletonText } from "../Skeleton/Skeleton";
import styles from "./ChatMessage.module.sass";

export interface ChatMessageProps {
  /** Ingame mostra o personagem (retrato, nome na cor dele); outgame mostra o perfil do jogador. */
  scope: "ingame" | "outgame";
  /** Quem aparece: o personagem no ingame, o jogador no outgame. */
  author: { name: string; color?: AccentColor; avatarUrl?: string };
  /** Linha discreta ao lado do nome (no ingame, quem joga o personagem). */
  subtitle?: string;
  time: string;
  /** Mensagem seguida do mesmo autor: sem retrato nem cabeçalho. */
  continuation?: boolean;
  /** Envio otimista: aparece na hora, com opacidade reduzida até confirmar. */
  pending?: boolean;
  /** `narration`: texto do mestre, em itálico. */
  kind?: "speech" | "narration";
  /** Sussurro: "para Kael". Só o autor, o destinatário e o mestre veem. */
  whisperTo?: string;
  children: ReactNode;
}

function ChatMessageBase({ scope, author, subtitle, time, continuation, pending, kind = "speech", whisperTo, children }: ChatMessageProps) {
  const ingame = scope === "ingame";
  return (
    <div
      className={cx(styles.message, ingame && styles.ingame, kind === "narration" && styles.narration, !continuation && styles.first, pending && styles.pending)}
      style={author.color ? playerColorStyle(author.color) : undefined}
    >
      {continuation ? (
        <span className={styles.hidden}>{author.name}:</span>
      ) : (
        <>
          <span className={styles.avatarCol}>
            <Avatar name={author.name} src={author.avatarUrl} color={author.color} appearance={ingame ? "ring" : "fill"} />
          </span>
          <div className={styles.header}>
            <span className={styles.name}>{author.name}</span>
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
            {whisperTo && (
              <span className={styles.whisper}>
                <Icon name="lock" size={12} />
                sussurro para {whisperTo}
              </span>
            )}
            <time className={styles.time}>{time}</time>
          </div>
        </>
      )}
      <div className={styles.body}>
        {children}
        {pending && <span className={styles.hidden}> (enviando)</span>}
      </div>
    </div>
  );
}

function ChatMessageSkeleton({ seed = 0 }: { seed?: number }) {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <Skeleton width={40} height={40} circle />
      <span className={styles.skeletonText}>
        <Skeleton width={`${18 + ((seed * 7) % 15)}%`} height={12} />
        <SkeletonText lines={1 + (seed % 2)} seed={seed} />
      </span>
    </div>
  );
}

export const ChatMessage = Object.assign(ChatMessageBase, { Skeleton: ChatMessageSkeleton });

export interface ChatNoticeProps {
  icon?: IconName;
  /** `mesa`: avisos de jogo (cena nova, pedido de teste), na superfície da Mesa. */
  tone?: "neutral" | "mesa";
  children: ReactNode;
}

/** Aviso de sistema no chat: cena nova, pedido de teste, alguém entrou na Mesa. */
export function ChatNotice({ icon, tone = "neutral", children }: ChatNoticeProps) {
  return (
    <div className={cx(styles.notice, tone === "mesa" && styles.noticeMesa)}>
      {icon && <Icon name={icon} size={14} />}
      <span>{children}</span>
    </div>
  );
}
