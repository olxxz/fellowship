import { Fragment, type ReactNode } from "react";
import { cx } from "../../cx";
import { playerColorStyle, type PlayerColor } from "../../player-color";
import { Skeleton } from "../Skeleton/Skeleton";
import styles from "./RollCard.module.sass";

export interface RollDie {
  value: number;
  /** Dado descartado (vantagem, desvantagem, keep-highest): aparece riscado. */
  discarded?: boolean;
}

export interface RollCardProps {
  /** Quem rolou: o personagem, ou o Narrador. */
  roller: string;
  /** O que foi rolado ("Atletismo"). Sem rótulo, mostra a fórmula. */
  label?: string;
  /** Fórmula como foi pedida ("1d20 + 4", "2d20kh1 + 4"). */
  formula: string;
  /** Resultado de cada dado, na ordem, gerado no servidor. */
  dice: RollDie[];
  modifier?: number;
  total: number;
  /** Cor do personagem que rolou: pinta o total. */
  color?: PlayerColor;
  /** Rolagem oculta do mestre. */
  hidden?: boolean;
  /** Quem vê é o mestre: a rolagem oculta mostra o valor real. */
  viewerIsMaster?: boolean;
  /** Crítico ou falha crítica: o total ganha um rótulo, além da cor. */
  critical?: { kind: "success" | "failure"; label: string };
  /** Abre o detalhe (quem pediu o teste, dificuldade). Com ele, o cartão vira botão. */
  onOpen?: () => void;
}

function formatModifier(modifier: number) {
  if (modifier === 0) return "";
  return modifier > 0 ? ` + ${modifier}` : ` − ${Math.abs(modifier)}`;
}

/** "1d20 + 4 → [15] + 4", com os dados descartados riscados. */
function Breakdown({ formula, dice, modifier = 0 }: Pick<RollCardProps, "formula" | "dice" | "modifier">) {
  return (
    <span className={styles.formula}>
      {formula} →{" "}
      {dice.map((die, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          {die.discarded ? (
            <span className={styles.discarded}>
              [{die.value}]<span className={styles.hidden}> descartado</span>
            </span>
          ) : (
            `[${die.value}]`
          )}
        </Fragment>
      ))}
      {formatModifier(modifier)}
    </span>
  );
}

function RollCardBase(props: RollCardProps) {
  const { roller, label, formula, total, color, hidden, viewerIsMaster, critical, onOpen } = props;
  const secret = hidden && !viewerIsMaster;

  let header: ReactNode;
  let body: ReactNode;
  let result: ReactNode;

  if (secret) {
    header = `${roller} · rolagem oculta`;
    body = <span className={styles.secret}>Só o mestre vê o resultado</span>;
    result = (
      <span className={styles.result}>
        <strong className={cx(styles.total, styles.totalUnknown)} aria-label="Total oculto">
          ?
        </strong>
      </span>
    );
  } else {
    header = (
      <>
        <span>
          {roller} rolou {label ?? formula}
        </span>
        {hidden && <span className={styles.tag}>Oculta</span>}
      </>
    );
    body = <Breakdown {...props} />;
    const critClass = critical && (critical.kind === "success" ? styles.critSuccess : styles.critFailure);
    result = (
      <span className={cx(styles.result, critClass)}>
        <strong className={styles.total} aria-label={`Total ${total}`}>
          {total}
        </strong>
        {critical && <span className={styles.critLabel}>{critical.label}</span>}
      </span>
    );
  }

  const content = (
    <>
      <span className={styles.header}>{header}</span>
      <span className={styles.body}>
        {body}
        {result}
      </span>
    </>
  );

  const className = cx(styles.card, hidden && styles.hiddenRoll);
  const style = color ? playerColorStyle(color) : undefined;

  return onOpen ? (
    <button type="button" className={className} style={style} onClick={onOpen}>
      {content}
    </button>
  ) : (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

function RollCardSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <Skeleton width="40%" height={10} />
      <span className={styles.skeletonBody}>
        <Skeleton width="55%" height={14} />
        <Skeleton width={32} height={28} />
      </span>
    </div>
  );
}

export const RollCard = Object.assign(RollCardBase, { Skeleton: RollCardSkeleton });
