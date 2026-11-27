"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "../../cx";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import styles from "./Menu.module.sass";

type WithClass<T> = Omit<T, "className"> & { className?: string };

interface PopupProps {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  children: ReactNode;
  className?: string;
}

function Popup({ side = "bottom", align = "start", children, className }: PopupProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner className={styles.positioner} side={side} align={align} sideOffset={6} collisionPadding={8}>
        <BaseMenu.Popup className={cx(styles.popup, className)}>{children}</BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

interface Extra {
  /** Ícone à esquerda (18px, apagado). */
  icon?: IconName;
  /** `danger`: ação destrutiva (sair, apagar), em vermelho. */
  tone?: "danger";
  /** Texto menor à direita (atalho, contagem). */
  hint?: ReactNode;
}

function ItemContent({ icon, hint, children }: Extra & { children?: ReactNode }) {
  return (
    <>
      {icon && <Icon name={icon} size={18} className={styles.icon} />}
      <span className={styles.label}>{children}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
    </>
  );
}

function Item({ className, icon, tone, hint, children, ...props }: WithClass<ComponentProps<typeof BaseMenu.Item>> & Extra) {
  return (
    <BaseMenu.Item className={cx(styles.item, tone === "danger" && styles.danger, className)} {...props}>
      <ItemContent icon={icon} hint={hint}>
        {children as ReactNode}
      </ItemContent>
    </BaseMenu.Item>
  );
}

/** Item que navega (use `render={<Link href="…" />}` com o Link do Next.js). */
function LinkItem({ className, icon, tone, hint, children, ...props }: WithClass<ComponentProps<typeof BaseMenu.LinkItem>> & Extra) {
  return (
    <BaseMenu.LinkItem className={cx(styles.item, tone === "danger" && styles.danger, className)} {...props}>
      <ItemContent icon={icon} hint={hint}>
        {children as ReactNode}
      </ItemContent>
    </BaseMenu.LinkItem>
  );
}

/** Cabeçalho do menu (ex.: quem está logado). Não é clicável por si; ponha um LinkItem dentro se precisar. */
function Header({ children }: { children: ReactNode }) {
  return <div className={styles.header}>{children}</div>;
}

function RadioItem({ className, children, icon, ...props }: WithClass<ComponentProps<typeof BaseMenu.RadioItem>> & { children: ReactNode; icon?: IconName }) {
  return (
    <BaseMenu.RadioItem className={cx(styles.item, className)} {...props}>
      {icon && <Icon name={icon} size={18} className={styles.icon} />}
      <span className={styles.label}>{children}</span>
      <BaseMenu.RadioItemIndicator className={styles.indicator}>
        <Icon name="check" size={16} />
      </BaseMenu.RadioItemIndicator>
    </BaseMenu.RadioItem>
  );
}

function Separator() {
  return <BaseMenu.Separator className={styles.separator} />;
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <BaseMenu.Group>
      <BaseMenu.GroupLabel className={styles.groupLabel}>{label}</BaseMenu.GroupLabel>
      {children}
    </BaseMenu.Group>
  );
}

/** Menu com o visual do Fellowship sobre o Base UI Menu. Use `Trigger` com `render={<Button />}`. */
export const Menu = {
  Root: BaseMenu.Root,
  Trigger: BaseMenu.Trigger,
  Popup,
  Item,
  LinkItem,
  RadioGroup: BaseMenu.RadioGroup,
  RadioItem,
  Group,
  Separator,
  Header,
};

function ContextPopup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner className={styles.positioner} collisionPadding={8}>
        <BaseContextMenu.Popup className={cx(styles.popup, className)}>{children}</BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}

/**
 * Menu do clique direito (no celular, segurar o dedo), como no Notion e no Canva. Os itens são os mesmos
 * do `Menu` (`Menu.Item`, `Menu.Separator`…).
 */
export const ContextMenu = {
  Root: BaseContextMenu.Root,
  Trigger: BaseContextMenu.Trigger,
  Popup: ContextPopup,
};
