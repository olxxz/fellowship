import type { ReactNode } from "react";
import styles from "./ErrorScreen.module.sass";

// Mapa estranho do aventureiro perdido (por enquanto em texto; depois vira ilustração).
const MAP = String.raw`
  .-------------------------.
  |  ~~   /\  /\     ? ~~   |
  | ~~   /  \/  \  .....    |
  |     /  ..... \ :   :  ~ |
  |  .....     :   : X :    |
  |  :   ?     ......:..    |
  |  :....  ~~      ?   ~~  |
  |    ~~      ~~~      ?   |
  '-------------------------'
        \o/   "isto não
         |     estava aqui"
        / \
`;

/** Tela de erro com o aventureiro perdido: título, explicação curta e ações (links ou botões). */
export function ErrorScreen({ code, title, children, actions }: { code?: string; title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <main className={styles.screen}>
      <div className={styles.inner}>
        <pre className={styles.map} aria-hidden="true">
          {MAP}
        </pre>
        {code && <p className={styles.code}>{code}</p>}
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.text}>{children}</p>
        <div className={styles.actions}>{actions}</div>
      </div>
    </main>
  );
}
