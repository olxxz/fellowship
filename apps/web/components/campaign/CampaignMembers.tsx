"use client";

import { Avatar, Button, toast } from "@fellowship/ui";
import type { CampaignRole } from "@fellowship/db";
import { useTransition } from "react";
import settings from "@/components/account/Settings.module.sass";
import { leaveCampaignAction, setCampaignMemberAction } from "@/lib/app/campaign-actions";
import styles from "./Campaign.module.sass";

const ROLES: Array<[CampaignRole | "", string]> = [
  ["", "Fora da campanha"],
  ["jogador", "Jogador"],
  ["espectador", "Assistindo"],
  ["mestre", "Mestre"],
];

/** Quem joga: o mestre põe pessoas do Cenário na campanha e escolhe o papel; qualquer um pode sair. */
export function CampaignMembers({
  spaceId,
  campaignId,
  people,
  roles,
  ownerId,
  meId,
  isMaster,
}: {
  spaceId: string;
  campaignId: string;
  people: Array<{ id: string; name: string; username: string; avatarUrl: string | null; color: string }>;
  roles: Record<string, CampaignRole>;
  ownerId: string;
  meId: string;
  isMaster: boolean;
}) {
  const [pending, start] = useTransition();
  const sorted = [...people].sort((a, b) => Number(!!roles[b.id]) - Number(!!roles[a.id]) || a.name.localeCompare(b.name, "pt-BR"));
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.toolbar}>
          <h2 className={styles.sectionTitle}>Membros da campanha</h2>
          {roles[meId] && meId !== ownerId && (
            <Button
              variant="ghost"
              icon="doorOpen"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await leaveCampaignAction(spaceId, campaignId);
                  if (r?.error) toast.error(r.error);
                })
              }
            >
              Sair da campanha
            </Button>
          )}
        </div>
        <p className={settings.help}>
          {isMaster ? "Escolha quem joga, quem assiste e quem também mestra. Só aparece quem está no Cenário." : "Quem está na campanha. Para entrar ou mudar de papel, fale com o mestre."}
        </p>
        <ul className={settings.list}>
          {sorted.map((p) => (
            <li key={p.id} className={settings.personRow}>
              <span className={settings.personLink}>
                <Avatar name={p.name} src={p.avatarUrl ?? undefined} color={p.color} size={40} />
                <span className={settings.personText}>
                  <span className={settings.personName}>{p.name}</span>
                  <span className={settings.help}>@{p.username}</span>
                </span>
              </span>
              {isMaster && p.id !== ownerId ? (
                <select
                  className={settings.input}
                  style={{ width: "auto" }}
                  value={roles[p.id] ?? ""}
                  disabled={pending}
                  aria-label={`Papel de ${p.name}`}
                  onChange={(e) =>
                    start(async () => {
                      const r = await setCampaignMemberAction(spaceId, campaignId, p.id, (e.target.value || null) as CampaignRole | null);
                      if (r.error) toast.error(r.error);
                      else toast.success("Papel atualizado");
                    })
                  }
                >
                  {ROLES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={settings.help}>{p.id === ownerId ? "Mestre (dono do Cenário)" : (ROLES.find(([v]) => v === (roles[p.id] ?? ""))?.[1] ?? "")}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
