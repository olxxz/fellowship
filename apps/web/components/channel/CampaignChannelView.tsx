"use client";

import { Avatar, Button, ResourceBar, Sheet, playerColorStyle } from "@fellowship/ui";
import { useState } from "react";
import { ChatView } from "@/components/chat/ChatView";
import { EmptyState } from "@/components/common/EmptyState";
import { CharacterSheet } from "@/components/mesa/CharacterSheet";
import { ContentHeader, MembersToggle } from "@/components/shell/ContentHeader";
import { MembersList } from "@/components/shell/MembersList";
import { useShell } from "@/components/shell/ShellContext";
import { campaignById, campaignChannelInfo, characterById, spaceById, userById, type CampaignChannelId, type DemoCharacter } from "@/lib/demo/data";
import { rollFormula } from "@/lib/demo/dice";
import { useDemo } from "@/lib/demo/store";
import styles from "./Channel.module.sass";
import fichas from "./Fichas.module.sass";
import { campaignMemberGroups } from "./members";

const later: Partial<Record<CampaignChannelId, { title: string; text: string }>> = {
  diario: { title: "O diário chega na fase 1", text: "O mestre divide cada sessão em cenas e registra o que aconteceu. Na fase 4, a transcrição sugere o resumo." },
  compendio: { title: "Nada revelado ainda", text: "Bestiário, itens, magias e lugares aparecem aqui conforme o mestre revela. O que o personagem não sabe, o app não mostra." },
  mapa: { title: "O mapa chega na fase 3", text: "Grid, imagem de fundo e tokens ligados aos personagens. É um módulo que o mestre liga por campanha." },
};

export function CampaignChannelView({ spaceId, campaignId, channelId }: { spaceId: string; campaignId: string; channelId: CampaignChannelId }) {
  const { membersOpen } = useShell();
  const { send, viewer, me } = useDemo();
  const space = spaceById(spaceId)!;
  const campaign = campaignById(space, campaignId)!;
  const info = campaignChannelInfo[channelId];
  const key = `${space.id}/${campaign.id}/${channelId}`;
  const [openId, setOpenId] = useState<string | null>(null);
  const master = viewer === "mestre";

  function roll(c: DemoCharacter, label: string, formula: string) {
    const r = rollFormula(formula);
    if (r) send(`${space.id}/${campaign.id}/ingame`, { type: "roll", authorId: master ? "rafa" : me.id, characterId: c.id, label, ...r });
  }

  let content;
  if (channelId === "ingame" || channelId === "outgame" || channelId === "sussurros") {
    content = (
      <ChatView
        channelKey={key}
        mode={channelId === "sussurros" ? "sussurro" : channelId}
        name={info.name}
        intro={
          channelId === "ingame"
            ? "Aqui falam os personagens. Rolagens da Mesa e da ficha aparecem aqui."
            : channelId === "outgame"
              ? "Conversa entre jogadores, fora do personagem."
              : "Conversas privadas entre um jogador e o mestre."
        }
      />
    );
  } else if (channelId === "fichas") {
    const visible = campaign.characterIds.map((id) => characterById(id)!).filter((c) => master || c.ownerId === me.id);
    const open = openId ? characterById(openId) : undefined;
    content = visible.length ? (
      <div className={fichas.grid}>
        {visible.map((c) => (
          <article key={c.id} className={fichas.card} style={playerColorStyle(c.color)}>
            <div className={fichas.identity}>
              <Avatar name={c.name} color={c.color} appearance="ring" size={44} />
              <div>
                <h2 className={fichas.name}>{c.name}</h2>
                <p className={fichas.sub}>
                  {c.title} · {userById(c.ownerId!)?.name}
                </p>
              </div>
            </div>
            {c.sheet && <ResourceBar label="Vida" tone="hp" value={c.sheet.vitals.hp[0]} max={c.sheet.vitals.hp[1]} />}
            <Button icon="sheet" onClick={() => setOpenId(c.id)}>
              Abrir ficha
            </Button>
          </article>
        ))}
        {!master && <p className={fichas.note}>Você vê só a sua ficha. O mestre vê todas.</p>}
      </div>
    ) : (
      <EmptyState icon="sheet" title="Nenhuma ficha ainda">
        Cada jogador cria o personagem ao entrar na campanha.
      </EmptyState>
    );
    content = (
      <>
        {content}
        {open && (
          <Sheet open onOpenChange={(o) => !o && setOpenId(null)} title={open.name} description={open.title}>
            <CharacterSheet character={open} onRoll={roll} />
          </Sheet>
        )}
      </>
    );
  } else {
    const l = later[channelId]!;
    content = (
      <EmptyState icon={info.icon} title={l.title}>
        {l.text}
      </EmptyState>
    );
  }

  return (
    <>
      <ContentHeader icon={info.icon} title={info.name} topic={`${campaign.name} · ${info.description}`} actions={<MembersToggle />} />
      <div className={styles.body}>
        <main className={styles.main}>{content}</main>
        {membersOpen && <MembersList label={`Na campanha ${campaign.name}`} groups={campaignMemberGroups(campaign)} />}
      </div>
    </>
  );
}
