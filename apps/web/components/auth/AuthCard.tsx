import { Icon } from "@fellowship/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/brand";
import styles from "./Auth.module.sass";

/** Moldura das telas de conta: entrar, criar conta, recuperar senha. */
export function AuthCard({ title, text, children, footer }: { title: string; text?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Link href="/" className={styles.brand} aria-label={`${APP_NAME}, página inicial`}>
          <span className={styles.mark}>
            <Icon name="dice" size={20} />
          </span>
          {APP_NAME}
        </Link>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {text && <p className={styles.text}>{text}</p>}
        </div>
        {children}
        {footer && <p className={styles.small}>{footer}</p>}
      </div>
    </main>
  );
}

export function Divider() {
  return <div className={styles.divider}>ou com e-mail</div>;
}
