"use client";

import type { RollPayload } from "@fellowship/db";
import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef } from "react";
import styles from "./Mesa.module.sass";

// Dados 3D por cima do palco. O resultado já vem do servidor: a física só anima até a face sorteada
// (notação "2d20@15,3" da biblioteca). A biblioteca (three.js + física) só baixa na primeira rolagem.

const SIDES = new Set([4, 6, 8, 10, 12, 20, 100]);
const MAX_DICE = 12;

interface DiceBoxLike {
  initialize: () => Promise<void>;
  roll: (notation: string) => Promise<unknown>;
  clearDice: () => void;
  updateConfig: (config: Record<string, unknown>) => Promise<void> | void;
}

export interface DiceStageHandle {
  show: (roll: RollPayload, color?: string) => void;
}

/** "1d20+2d6@15,3,4": agrupa por tipo de dado, na ordem, com os valores sorteados. */
export function toNotation(roll: RollPayload) {
  const dice = roll.dice.filter((d) => SIDES.has(d.sides)).slice(0, MAX_DICE);
  if (!dice.length) return null;
  const groups = new Map<number, number[]>();
  for (const d of dice) groups.set(d.sides, [...(groups.get(d.sides) ?? []), d.value]);
  const parts = [...groups].map(([sides, values]) => `${values.length}d${sides}`);
  const values = [...groups.values()].flat();
  return `${parts.join("+")}@${values.join(",")}`;
}

export const DiceStage = forwardRef<DiceStageHandle>(function DiceStage(_, ref) {
  const container = useRef<HTMLDivElement>(null);
  const box = useRef<Promise<DiceBoxLike> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // A biblioteca acha o palco por seletor CSS: o id do React vira só letras e números.
  const id = useRef(`dados-${useId().replace(/[^a-zA-Z0-9]/g, "")}`);

  const getBox = useCallback(() => {
    box.current ??= import("@3d-dice/dice-box-threejs").then(async (mod) => {
      const DiceBox = (mod as unknown as { default: new (selector: string, config: Record<string, unknown>) => DiceBoxLike }).default;
      const b = new DiceBox(`#${id.current}`, {
        sounds: false,
        shadows: true,
        theme_material: "plastic",
        theme_customColorset: { name: "fellowship", foreground: "#f5efe6", background: "#7a1e2b", outline: "#1a0d10", texture: "none", material: "plastic" },
        light_intensity: 0.9,
        gravity_multiplier: 400,
        baseScale: 90,
        strength: 1.2,
      });
      await b.initialize();
      return b;
    });
    return box.current;
  }, []);

  useImperativeHandle(ref, () => ({
    show(roll, color) {
      const notation = toNotation(roll);
      const el = container.current;
      if (!notation || !el) return;
      clearTimeout(hide.current);
      el.dataset.visible = "";
      void getBox()
        .then(async (b) => {
          if (color) await b.updateConfig({ theme_customColorset: { name: `c${color}`, foreground: "#ffffff", background: color, outline: "#111111", texture: "none", material: "plastic" } });
          await b.roll(notation);
          // Fica um instante na mesa e some.
          hide.current = setTimeout(() => {
            delete el.dataset.visible;
            setTimeout(() => b.clearDice(), 400);
          }, 2600);
        })
        .catch(() => delete el.dataset.visible);
    },
  }));

  useEffect(() => () => clearTimeout(hide.current), []);

  return <div ref={container} id={id.current} className={styles.diceStage} aria-hidden="true" />;
});
