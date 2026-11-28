import type { Adventure } from "@fellowship/core";
import { Icon } from "@fellowship/ui";
import Link from "next/link";
import styles from "./Adventure.module.sass";

/** Vitrine de aventuras: por enquanto só as de teste, para jogar sozinho, só com texto. */
export function AdventureShowcase({ adventures, backHref, hrefBase = "/aventuras", embedded }: { adventures: Adventure[]; backHref?: string; hrefBase?: string; embedded?: boolean }) {
  return (
    <div className={embedded ? styles.embedded : styles.page}>
      {backHref && (
        <div className={styles.top}>
          <Link href={backHref} className={styles.back}>
            <Icon name="back" size={16} /> Voltar
          </Link>
        </div>
      )}
      <main className={styles.wrap}>
        <div>
          <h1 className={styles.heading}>Aventuras</h1>
          <p className={styles.lead}>Histórias curtas para jogar sozinho: você escolhe o caminho e os dados decidem os testes.</p>
        </div>
        <ul className={styles.grid}>
          {adventures.map((a) => (
            <li key={a.id}>
              <Link href={`${hrefBase}/${a.id}`} className={styles.card} style={{ ["--card-color" as string]: a.cor }}>
                <span className={styles.cardTitle}>{a.titulo}</span>
                <span className={styles.cardText}>{a.resumo}</span>
                <span className={styles.tags}>
                  <span className={styles.tag}>Solo</span>
                  <span className={styles.tag}>{a.genero}</span>
                  <span className={styles.tag}>~{a.duracao} min</span>
                  <span className={styles.tag}>Só texto</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.soon}>Em breve: aventuras da comunidade, para jogar com o grupo ou sozinho, e um editor para escrever as suas.</p>
      </main>
    </div>
  );
}
