"use client";

import { Button, Icon } from "@fellowship/ui";
import type { CampaignSession } from "@fellowship/db";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import settings from "@/components/account/Settings.module.sass";
import styles from "./Campaign.module.sass";

const date = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const time = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

interface Result {
  id: string;
  content: string;
  created_at: string;
  author: string;
  channel: string;
  session_id: string | null;
}

/** Lista das sessões (aberta e encerradas) e busca no chat da campanha, mostrando em que sessão foi dito. */
export function CampaignSessions({ sessions, query, results }: { spaceId: string; campaignId: string; sessions: CampaignSession[]; query: string; results: Result[] }) {
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState(query);
  const [pending, start] = useTransition();
  const byId = new Map(sessions.map((s) => [s.id, s]));

  return (
    <main className={styles.page}>
      <div className={styles.inner} style={{ maxWidth: 760 }}>
        <form
          className={settings.inlineForm}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            start(() => router.push(q.trim() ? `${path}?q=${encodeURIComponent(q.trim())}` : path));
          }}
        >
          <input className={settings.input} value={q} maxLength={80} placeholder="Procurar no que foi dito (ex.: Lady Saphira)" aria-label="Procurar nas sessões" onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" variant="primary" loading={pending} loadingLabel="Procurando…">
            Procurar
          </Button>
        </form>

        {query && (
          <section className={settings.section}>
            <h3 className={settings.sectionTitle}>
              {results.length ? `${results.length === 60 ? "60+" : results.length} resultado${results.length === 1 ? "" : "s"} para “${query}”` : `Nada encontrado para “${query}”`}
            </h3>
            <ol className={styles.searchResults}>
              {results.map((r) => {
                const s = r.session_id ? byId.get(r.session_id) : undefined;
                return (
                  <li key={r.id} className={styles.searchResult}>
                    <span className={styles.searchMeta}>
                      <strong>{s ? `Sessão ${s.number}` : "Fora de sessão"}</strong> · {r.channel} · {r.author} · {date(r.created_at)} {time(r.created_at)}
                    </span>
                    <span className={styles.searchText}>{r.content}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <section className={settings.section}>
          <h3 className={settings.sectionTitle}>Sessões</h3>
          {sessions.length === 0 ? (
            <p className={settings.help}>Nenhuma sessão ainda. O mestre abre a sessão na Mesa; tudo o que for dito e rolado fica guardado nela.</p>
          ) : (
            <ol className={styles.sessionList}>
              {sessions.map((s) => (
                <li key={s.id} className={styles.sessionItem}>
                  <Icon name="book" size={18} />
                  <span className={styles.sessionText}>
                    <strong>
                      Sessão {s.number}
                      {s.title ? `: ${s.title}` : ""}
                    </strong>
                    <span className={settings.help}>
                      {date(s.started_at)}, {time(s.started_at)}
                      {s.ended_at ? ` – ${time(s.ended_at)}` : " · ao vivo"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
