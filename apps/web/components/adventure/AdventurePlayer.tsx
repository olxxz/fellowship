"use client";

import { choose, startAdventure, visibleChoices, type Adventure, type AdventureChoice } from "@fellowship/core";
import { Button, Icon } from "@fellowship/ui";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { DiceStage, type DiceStageHandle } from "@/components/campaign/mesa/DiceStage";
import { adventuresVersion, loadSave, storeSave, subscribeAdventures, type AdventureSave } from "@/lib/adventures/progress";
import styles from "./Adventure.module.sass";

/** d20 do navegador (aventura solo: não há com quem trapacear, então não precisa do servidor). */
function rollD20() {
  return 1 + (crypto.getRandomValues(new Uint32Array(1))[0]! % 20);
}

const ENDING = {
  vitoria: { title: "Vitória", text: "Você chegou ao melhor final." },
  parcial: { title: "Fim, por enquanto", text: "Há um final melhor. Que tal tentar outro caminho?" },
  derrota: { title: "Derrota", text: "A história acabou mal desta vez." },
} as const;

/**
 * Jogar uma aventura solo: lê a cena, escolhe; nos testes, o d20 cai na tela. O progresso fica salvo neste
 * aparelho e alimenta a árvore de escolhas. `embedded`: dentro da casca do app (sem o cabeçalho próprio).
 */
export function AdventurePlayer({ adventure: a, embedded, treeHref }: { adventure: Adventure; embedded?: boolean; treeHref?: string }) {
  // Lê o progresso salvo (relê quando ele muda, inclusive em outra aba).
  const saved = useSyncExternalStore(
    subscribeAdventures,
    () => `${adventuresVersion()}:${typeof localStorage === "undefined" ? "" : (localStorage.getItem(`fellowship:aventura:${a.id}`) ?? "")}`,
    () => "",
  );
  const [rolling, setRolling] = useState(false);
  const dice = useRef<DiceStageHandle>(null);
  const top = useRef<HTMLDivElement>(null);

  const stored = saved ? loadSave(a.id) : null;
  const current: AdventureSave = stored && a.cenas[stored.state.cena] ? stored : { state: startAdventure(a), check: null };
  const { state, check } = current;
  const scene = a.cenas[state.cena]!;
  const choices = visibleChoices(a, state);
  const statName = (key: string) => a.stats.find((s) => s.key === key)?.nome ?? key;

  function go(next: AdventureSave) {
    storeSave(a.id, next);
    if (embedded) top.current?.scrollTo({ top: 0 });
    else top.current?.scrollIntoView({ block: "start" });
  }

  function pick(c: AdventureChoice) {
    if (rolling) return;
    if (!c.teste) return go({ ...choose(a, state, c), check: null });
    const roll = rollD20();
    setRolling(true);
    // O dado cai na tela inteira e o resultado só aparece depois que ele para.
    dice.current?.show({ formula: "1d20", total: roll, modifier: 0, dice: [{ value: roll, sides: 20 }] }, a.cor);
    setTimeout(() => {
      const r = choose(a, state, c, roll);
      go({ state: r.state, check: r.check });
      setRolling(false);
    }, 2300);
  }

  const body = (
    <main className={styles.wrap}>
      {!embedded && <h1 className={styles.heading}>{a.titulo}</h1>}

      <div className={styles.status} aria-label="Seu personagem">
        <span className={styles.life} aria-label={`Vida ${Math.max(0, state.vida)} de ${a.vida}`}>
          Vida
          <span className={styles.lifeBar} aria-hidden="true">
            <span style={{ width: `${(Math.max(0, state.vida) / a.vida) * 100}%` }} />
          </span>
          {Math.max(0, state.vida)}/{a.vida}
        </span>
        <span className={styles.stats}>
          {a.stats.map((s) => (
            <span key={s.key}>
              {s.nome} {s.valor >= 0 ? `+${s.valor}` : s.valor}
            </span>
          ))}
        </span>
        {state.itens.length > 0 && (
          <span className={styles.items}>
            {state.itens.map((i) => (
              <span key={i} className={styles.item}>
                {a.itens[i] ?? i}
              </span>
            ))}
          </span>
        )}
      </div>

      <section className={styles.scene} key={`${state.cena}-${state.caminho.length}`} aria-live="polite">
        <h2 className={styles.sceneTitle}>{scene.titulo}</h2>
        {scene.imagem && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.sceneImage} src={scene.imagem} alt="" />
        )}
        {scene.arte && (
          <pre className={styles.art} aria-hidden="true">
            {scene.arte}
          </pre>
        )}
        {check && (
          <p className={styles.check}>
            Teste de {statName(check.stat)}: <strong className={check.ok ? styles.ok : styles.fail}>{check.total}</strong>
            <span>
              (d20 {check.roll} {check.bonus >= 0 ? "+" : "−"} {Math.abs(check.bonus)}, precisava de {check.cd}) · {check.ok ? "passou" : "não passou"}
            </span>
          </p>
        )}
        {scene.texto.split(/\n\n+/).map((p, i) => (
          <p key={i} className={styles.paragraph}>
            {p}
          </p>
        ))}
      </section>

      {scene.fim ? (
        <div className={styles.ending}>
          <span className={styles.endingTitle}>{ENDING[scene.fim].title}</span>
          <span className={styles.lead}>
            {ENDING[scene.fim].text} Você passou por {new Set(state.caminho).size} de {Object.keys(a.cenas).length} cenas.
          </span>
          <div className={styles.endingActions}>
            <Button variant="primary" icon="dice" onClick={() => go({ state: startAdventure(a), check: null })}>
              Jogar de novo
            </Button>
            {treeHref && (
              <Link href={treeHref} className={styles.textLink}>
                Ver a árvore de escolhas
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.choices} role="group" aria-label="O que você faz?">
          {choices.map((c, i) => (
            <button key={i} type="button" className={styles.choice} disabled={rolling} onClick={() => pick(c)}>
              <span>{c.texto}</span>
              {c.teste && (
                <span className={styles.choiceHint}>
                  <Icon name="dice" size={14} /> {statName(c.teste.stat)} · CD {c.teste.cd}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <div className={styles.diceLayer}>
        <DiceStage ref={dice} />
      </div>
    </main>
  );

  if (embedded) {
    return (
      <div className={styles.embedded} ref={top}>
        {body}
      </div>
    );
  }
  return (
    <div className={styles.page}>
      <div className={styles.top} ref={top}>
        <Link href="/aventuras" className={styles.back}>
          <Icon name="back" size={16} /> Aventuras
        </Link>
      </div>
      {body}
    </div>
  );
}

