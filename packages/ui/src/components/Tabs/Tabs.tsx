"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps } from "react";
import { cx } from "../../cx";
import styles from "./Tabs.module.sass";

type WithClass<T> = Omit<T, "className"> & { className?: string };

function List({ className, ...props }: WithClass<ComponentProps<typeof BaseTabs.List>>) {
  return <BaseTabs.List className={cx(styles.list, className)} {...props} />;
}

function Tab({ className, ...props }: WithClass<ComponentProps<typeof BaseTabs.Tab>>) {
  return <BaseTabs.Tab className={cx(styles.tab, className)} {...props} />;
}

function Panel({ className, ...props }: WithClass<ComponentProps<typeof BaseTabs.Panel>>) {
  return <BaseTabs.Panel className={cx(styles.panel, className)} {...props} />;
}

/** Abas com o visual do Fellowship sobre o Base UI Tabs (teclado e ARIA prontos). */
export const Tabs = { Root: BaseTabs.Root, List, Tab, Panel };
