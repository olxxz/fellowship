"use client";

import { Button, ButtonLink, playerColorStyle } from "@fellowship/ui";
import type { PublicSpace } from "@fellowship/db";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { joinPublicSpaceAction, listPublicSpacesAction } from "@/lib/app/social-actions";
import { appSpaceHref } from "@/lib/routes";
import styles from "./Settings.module.sass";

export function ExploreList({ initial }: { initial: PublicSpace[] }) {
  const [spaces, setSpaces] = useState(initial);
  const [query, setQuery] = useState("");
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  // Busca com uma pausa curta enquanto a pessoa digita.
  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => start(async () => setSpaces(await listPublicSpacesAction(query))), 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <>
      <input
        className={styles.input}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!e.target.value) setSpaces(initial);
        }}
        placeholder="Buscar pelo nome"
        aria-label="Buscar Cenários públicos"
      />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {spaces.length === 0 ? (
        <p className={styles.help}>{query ? "Nenhum Cenário público com esse nome." : "Ainda não há Cenários públicos. Torne o seu público nas configurações dele."}</p>
      ) : (
        <ul className={styles.exploreGrid}>
          {spaces.map((s) => (
            <li key={s.id} className={styles.exploreCard} style={playerColorStyle(s.color)}>
              <div className={styles.exploreBanner}>
                <span className={styles.previewIcon} aria-hidden="true">
                  {s.short}
                </span>
              </div>
              <div className={styles.exploreBody}>
                <p className={styles.previewName}>{s.name}</p>
                {s.description && <p className={styles.help}>{s.description}</p>}
                <p className={styles.help}>
                  {s.member_count} {s.member_count === 1 ? "membro" : "membros"}
                </p>
                {s.is_member ? (
                  <ButtonLink href={appSpaceHref(s.id)} linkAs={Link}>
                    Abrir
                  </ButtonLink>
                ) : (
                  <Button
                    variant="primary"
                    loading={joining === s.id}
                    loadingLabel="Entrando…"
                    onClick={() => {
                      setJoining(s.id);
                      setError(null);
                      start(async () => {
                        const result = await joinPublicSpaceAction(s.id);
                        if (result?.error) setError(result.error);
                        setJoining(null);
                      });
                    }}
                  >
                    Entrar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
