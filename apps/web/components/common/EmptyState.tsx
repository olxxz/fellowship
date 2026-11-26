import { Icon, type IconName } from "@fellowship/ui";
import type { ReactNode } from "react";
import styles from "./EmptyState.module.sass";

/** Estado vazio: uma frase e uma ação clara. */
export function EmptyState({ icon, title, children, actions }: { icon: IconName; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon name={icon} size={30} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {children && <p className={styles.text}>{children}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
