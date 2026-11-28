"use client";

import type { Adventure } from "@fellowship/core";
import { ChannelCategory, ChannelRow, Icon, playerColorStyle } from "@fellowship/ui";
import { usePathname } from "next/navigation";
import { PendingLink } from "@/components/nav/PendingLink";
import { useShell } from "@/components/shell/ShellContext";
import styles from "@/components/shell/Sidebar.module.sass";

/** Barra lateral das aventuras: a lista (vitrine) ou, dentro de uma, os canais dela (história e árvore). */
export function AdventureSidebar({ adventures, current }: { adventures: Adventure[]; current?: Adventure }) {
  const path = usePathname();
  const { closeDrawer } = useShell();
  if (!current) {
    return (
      <div className={styles.sidebar}>
        <header className={styles.banner} style={playerColorStyle("#6b5bd6")}>
          <h2 className={styles.bannerName}>Aventuras</h2>
          <p className={styles.bannerSub}>Histórias prontas para jogar sozinho</p>
        </header>
        <div className={styles.scroll}>
          <ChannelCategory name="Para jogar">
            {adventures.map((a) => (
              <ChannelRow key={a.id} icon="book" name={a.titulo} href={`/a/${a.id}`} linkAs={PendingLink} onClick={closeDrawer} meta={`${a.duracao} min`} />
            ))}
          </ChannelCategory>
        </div>
      </div>
    );
  }
  const base = `/a/${current.id}`;
  return (
    <div className={styles.sidebar}>
      <header className={styles.banner} style={playerColorStyle(current.cor)}>
        <PendingLink className={styles.back} href="/a" onClick={closeDrawer}>
          <Icon name="back" size={16} />
          Aventuras
        </PendingLink>
        <h2 className={styles.bannerName}>{current.titulo}</h2>
        <p className={styles.bannerSub}>
          {current.genero} · solo · ~{current.duracao} min
        </p>
      </header>
      <div className={styles.scroll}>
        <ChannelCategory name="Aventura">
          <ChannelRow icon="book" name="História" href={base} linkAs={PendingLink} active={path === base} onClick={closeDrawer} />
          <ChannelRow icon="map" name="Árvore de escolhas" href={`${base}/arvore`} linkAs={PendingLink} active={path === `${base}/arvore`} onClick={closeDrawer} />
        </ChannelCategory>
      </div>
    </div>
  );
}
