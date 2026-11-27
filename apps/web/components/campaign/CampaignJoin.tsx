"use client";

import { Button, toast } from "@fellowship/ui";
import type { Campaign } from "@fellowship/db";
import { useTransition } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { joinCampaignAction } from "@/lib/app/campaign-actions";

/** Quem não está na campanha: entrar como jogador (se for aberta) ou assistir. */
export function CampaignJoin({ spaceId, campaign, masters }: { spaceId: string; campaign: Campaign; masters: string[] }) {
  const [pending, start] = useTransition();
  const join = (role: "jogador" | "espectador") =>
    start(async () => {
      const r = await joinCampaignAction(spaceId, campaign.id, role);
      if (r.error) toast.error(r.error);
      else toast.success(role === "jogador" ? "Você entrou na campanha" : "Você está assistindo");
    });
  return (
    <EmptyState
      icon="dice"
      title={campaign.name}
      actions={
        <>
          {campaign.open_to_join && (
            <Button variant="primary" icon="dice" disabled={pending} onClick={() => join("jogador")}>
              Entrar como jogador
            </Button>
          )}
          <Button icon="eye" disabled={pending} onClick={() => join("espectador")}>
            Assistir
          </Button>
        </>
      }
    >
      {campaign.description ?? "Uma campanha deste Cenário."} {campaign.open_to_join ? "" : `Para jogar, peça a ${masters.join(" ou ") || "quem mestra"}.`}
    </EmptyState>
  );
}
