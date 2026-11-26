"use client";

import { ChannelCategory, ChannelRow } from "@fellowship/ui";
import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { Rail } from "./Rail";
import styles from "./Sidebar.module.sass";
import { UserPanel } from "./UserPanel";

/** Início: área social pessoal. Amigos e mensagens diretas chegam na fase 3. */
export function HomeShell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      rail={<Rail />}
      sidebar={
        <div className={styles.sidebar}>
          <div className={styles.scroll}>
            <ChannelCategory name="Início">
              <ChannelRow icon="home" name="Seus Cenários" active />
              <ChannelRow icon="users" name="Amigos" meta="fase 3" />
              <ChannelRow icon="chat" name="Mensagens diretas" meta="fase 3" />
            </ChannelCategory>
          </div>
          <UserPanel />
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
