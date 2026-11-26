"use client";

import { ContentHeader, MembersToggle } from "@/components/shell/ContentHeader";
import { MembersList } from "@/components/shell/MembersList";
import { useShell } from "@/components/shell/ShellContext";
import { ChatView } from "@/components/chat/ChatView";
import { EmptyState } from "@/components/common/EmptyState";
import { channelById, channelKey, spaceById } from "@/lib/demo/data";
import styles from "./Channel.module.sass";
import { spaceMemberGroups } from "./members";

const placeholders = {
  voz: { title: "Salas de voz chegam na fase 2", text: "Aqui o grupo vai conversar, ver câmeras e compartilhar tela, sem as ferramentas de jogo da Mesa." },
  galeria: { title: "A galeria chega na fase 1", text: "Um mural de imagens em colunas, com descrição, tags e comentários em cada imagem." },
  funcional: { title: "Ferramenta em construção", text: "Canais funcionais trocam o chat por uma ferramenta: agenda de sessões, enquete de data, regras da casa." },
} as const;

export function SpaceChannelView({ spaceId, channelId }: { spaceId: string; channelId: string }) {
  const { membersOpen } = useShell();
  const space = spaceById(spaceId)!;
  const channel = channelById(space, channelId)!;
  const isChat = channel.kind === "texto" || channel.kind === "anuncios";

  return (
    <>
      <ContentHeader icon={channel.icon} title={channel.name} topic={channel.topic} actions={<MembersToggle />} />
      <div className={styles.body}>
        <main className={styles.main}>
          {isChat ? (
            <ChatView
              channelKey={channelKey(space.id, channel.id)}
              mode="outgame"
              name={channel.name}
              intro={channel.kind === "anuncios" ? "Avisos do Narrador para todo o Cenário." : `O começo do canal ${channel.name} em ${space.name}.`}
              masterOnly={channel.kind === "anuncios"}
            />
          ) : (
            <EmptyState icon={channel.icon} title={placeholders[channel.kind as keyof typeof placeholders].title}>
              {placeholders[channel.kind as keyof typeof placeholders].text}
            </EmptyState>
          )}
        </main>
        {membersOpen && <MembersList label={`Membros de ${space.name}`} groups={spaceMemberGroups()} />}
      </div>
    </>
  );
}
