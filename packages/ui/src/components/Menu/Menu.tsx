"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "../../cx";
import { Icon } from "../Icon/Icon";
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

function Item({ className, ...props }: WithClass<ComponentProps<typeof BaseMenu.Item>>) {
  return <BaseMenu.Item className={cx(styles.item, className)} {...props} />;
}

/** Item que navega (use `render={<Link href="…" />}` com o Link do Next.js). */
function LinkItem({ className, ...props }: WithClass<ComponentProps<typeof BaseMenu.LinkItem>>) {
  return <BaseMenu.LinkItem className={cx(styles.item, className)} {...props} />;
}

function RadioItem({ className, children, ...props }: WithClass<ComponentProps<typeof BaseMenu.RadioItem>> & { children: ReactNode }) {
  return (
    <BaseMenu.RadioItem className={cx(styles.item, className)} {...props}>
      {children}
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
};
