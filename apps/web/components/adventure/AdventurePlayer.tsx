"use client";

import { choose, startAdventure, visibleChoices, type Adventure, type AdventureChoice, type AdventureState } from "@fellowship/core";
import { Button, Icon } from "@fellowship/ui";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DiceStage, type DiceStageHandle } from "@/components/campaign/mesa/DiceStage";
import styles from "./Adventure.module.sass";

type Check = { roll: number; bonus: number; total: number; cd: number; ok: boolean; stat: string };
type Saved = { state: AdventureState; check: Check | null };

const KEY = (id: string) => `fellowship:aventura:${id}`;
const noop = () => () => {};

function load(a: Adventure): Saved | null {
  try {
    const raw = localStorage.getItem(KEY(a.id));
    const saved = raw ? (JSON.parse(raw) as Saved) : null;
    return saved && a.cenas[saved.state.cena] ? saved : null;
  } catch {
    return null;
  }
}

const ENDING = {
  vitoria: { title: "Vitória", text: "Você chegou ao melhor final." },
  parcial: { title: "Fim, por enquanto", text: "Há um final melhor. Que tal tentar outro caminho?" },
  derrota: { title: "Derrota", text: "A história acabou mal desta vez." },
} as const;

/** Jogar uma aventura solo: lê a cena, escolhe; nos testes, o d20 cai na tela (o progresso fica salvo neste aparelho). */
export function AdventurePlayer({ adventure: a }: { adventure: Adventure }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [game, setGame] = useState<Saved | null>(null);
  const [rolling, setRolling] = useState(false);
  const dice = useRef<DiceStageHandle>(null);
  const top = useRef<HTMLDivElement>(null);

  // Retoma o jogo salvo (ou começa) só no navegador.
  const current: Saved = game ?? (mounted ? (load(a) ?? { state: startAdventure(a), check: null }) : { state: startAdventure(a), check: null });

  useEffect(() => {
    if (!game) return;
    try {
      localStorage.setItem(KEY(a.id), JSON.stringify(game));
    } catch {
      // sem armazenamento: o progresso vale só nesta visita
    }
  }, [game, a.id]);

  const { state, check } = current;
  const scene = a.cenas[state.cena]!;
  const choices = visibleChoices(a, state);
  const statName = (key: string) => a.stats.find((s) => s.key === key)?.nome ?? key;

  function pick(c: AdventureChoice) {
    if (rolling) return;
    if (!c.teste) {
      setGame({ ...choose(a, state, c), check: null });
      top.current?.scrollIntoView({ block: "start" });
      return;
    }
    const roll = 1 + Math.floor(Math.random() * 20);
    setRolling(true);
    dice.current?.show({ formula: "1d20", total: roll, modifier: 0, dice: [{ value: roll, sides: 20 }] }, "#7a1e2b");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(
      () => {
        const r = choose(a, state, c, roll);
        setGame({ state: r.state, check: r.check });
        setRolling(false);
        top.current?.scrollIntoView({ block: "start" });
      },
      reduce ? 0 : 1700,
    );
  }

  function restart() {
    setGame({ state: startAdventure(a), check: null });
  }

  return (
    <div className={styles.page}>
      <div className={styles.top} ref={top}>
        <Link href="/aventuras" className={styles.back}>
          <Icon name="back" size={16} /> Aventuras
        </Link>
      </div>
      <main className={styles.wrap}>
        <h1 className={styles.heading}>{a.titulo}</h1>

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
          <div className={styles.diceStage}>
            <DiceStage ref={dice} />
          </div>
        </section>

        {scene.fim ? (
          <div className={styles.ending}>
            <span className={styles.endingTitle}>{ENDING[scene.fim].title}</span>
            <span className={styles.lead}>
              {ENDING[scene.fim].text} Você passou por {new Set(state.caminho).size} de {Object.keys(a.cenas).length} cenas.
            </span>
            <div>
              <Button variant="primary" icon="dice" onClick={restart}>
                Jogar de novo
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.choices} role="group" aria-label="O que você faz?">
            {choices.map((c, i) => (
              <button key={i} type="button" className={styles.choice} disabled={rolling} onClick={() => pick(c)}>
                <span>{c.texto}</span>
                {c.teste && (
                  <span className={styles.choiceHint}>
                    {statName(c.teste.stat)} · CD {c.teste.cd}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
