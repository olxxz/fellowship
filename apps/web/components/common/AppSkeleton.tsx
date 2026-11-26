import { ChatMessage, Skeleton } from "@fellowship/ui";
import styles from "./PageSkeleton.module.sass";

/** Casca inteira carregando (abrir o app ou trocar de Cenário), com a mesma grade do AppShell. */
export function AppSkeleton() {
  return (
    <div className={styles.shell} aria-busy="true">
      <span role="status" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
        Carregando…
      </span>
      <div className={styles.rail} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={48} height={48} circle />
        ))}
      </div>
      <div className={styles.sidebar} aria-hidden="true">
        <Skeleton width="70%" height={20} />
        <Skeleton width="45%" height={12} />
        {[60, 45, 70, 50, 40].map((w, i) => (
          <Skeleton key={i} width={`${w}%`} height={14} style={{ marginTop: i === 0 ? 16 : 6 }} />
        ))}
      </div>
      <div className={styles.content} aria-hidden="true">
        <div className={styles.header}>
          <Skeleton width={20} height={20} />
          <Skeleton width={120} height={16} />
        </div>
        <div className={styles.messages}>
          {[0, 1, 2].map((i) => (
            <ChatMessage.Skeleton key={i} seed={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
