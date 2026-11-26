"use client";

import { Icon, IconButton, type IconName } from "@fellowship/ui";
import type { ReactNode } from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import styles from "./ContentHeader.module.sass";
import { useShell } from "./ShellContext";

/** Cabeçalho da área de conteúdo: botão da gaveta (celular), canal e ações. */
export function ContentHeader({ icon, title, topic, actions }: { icon: IconName; title: string; topic?: string; actions?: ReactNode }) {
  const { openDrawer } = useShell();
  return (
    <header className={styles.header}>
      <IconButton className={styles.menu} icon="menu" label="Abrir navegação" onClick={openDrawer} />
      <Icon name={icon} size={20} className={styles.icon} />
      <div className={styles.titles}>
        <h1 className={styles.title}>{title}</h1>
        {topic && <p className={styles.topic}>{topic}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}

/** Botão que mostra ou esconde a lista de membros (a escolha fica salva). */
export function MembersToggle() {
  const { membersOpen, setMembersOpen, mobileMembersOpen, setMobileMembersOpen, closeDrawer } = useShell();
  const mobile = useIsMobile();
  const open = mobile ? mobileMembersOpen : membersOpen;
  return (
    <IconButton
      icon="users"
      label={open ? "Esconder membros" : "Mostrar membros"}
      aria-pressed={open}
      onClick={() => {
        if (!mobile) return setMembersOpen(!membersOpen);
        closeDrawer();
        setMobileMembersOpen(!mobileMembersOpen);
      }}
    />
  );
}
