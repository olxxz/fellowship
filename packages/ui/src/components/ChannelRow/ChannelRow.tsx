import type { MouseEventHandler, ReactNode } from "react";
import { cx } from "../../cx";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import { Skeleton } from "../Skeleton/Skeleton";
import styles from "./ChannelRow.module.sass";

export interface ChannelRowProps {
  /** Ícone do tipo de canal, nunca "#": announcement, rules, calendar, chat, gallery, voice, dice (Mesa)… */
  icon: IconName;
  name: string;
  /** Canal aberto agora. */
  active?: boolean;
  /** Mensagens não lidas: nome em 600 e ponto à direita. */
  unread?: boolean;
  /** Complemento à direita: contador, pessoas na sala, horário da agenda. */
  meta?: ReactNode;
  /** `mesa` pinta o complemento em mesa-text (horário da próxima sessão). */
  metaTone?: "faint" | "mesa";
  /** Com href, a linha é um link; sem, é um botão. */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  /** Mostra a engrenagem de configurações no hover. */
  onSettings?: () => void;
}

function ChannelRowBase({ icon, name, active, unread, meta, metaTone = "faint", href, onClick, onSettings }: ChannelRowProps) {
  const content = (
    <>
      <Icon name={icon} />
      <span className={styles.name}>{name}</span>
      {meta != null && <span className={cx(styles.meta, metaTone === "mesa" && styles.metaMesa)}>{meta}</span>}
      {unread && (
        <>
          <span aria-hidden="true" className={styles.dot} />
          <span className={styles.hidden}>, não lido</span>
        </>
      )}
    </>
  );

  return (
    <div className={cx(styles.row, active && styles.active, unread && !active && styles.unread)}>
      {href ? (
        <a className={styles.main} href={href} aria-current={active ? "page" : undefined} onClick={onClick}>
          {content}
        </a>
      ) : (
        <button type="button" className={styles.main} aria-current={active ? "page" : undefined} onClick={onClick}>
          {content}
        </button>
      )}
      {onSettings && (
        <button type="button" className={styles.settings} aria-label={`Configurações de ${name}`} onClick={onSettings}>
          <Icon name="settings" size={16} />
        </button>
      )}
    </div>
  );
}

function ChannelRowSkeleton({ width = "55%" }: { width?: string }) {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <Skeleton width={18} height={18} />
      <Skeleton width={width} height={12} />
    </div>
  );
}

export const ChannelRow = Object.assign(ChannelRowBase, { Skeleton: ChannelRowSkeleton });
