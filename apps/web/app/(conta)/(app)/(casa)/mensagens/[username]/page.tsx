import { ButtonLink } from "@fellowship/ui";
import type { ProfileCard } from "@fellowship/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChatRoom } from "@/components/chat/room/ChatRoom";
import { dmPair, getReactions, getStickers } from "@/lib/app/queries";
import channelStyles from "@/components/channel/Channel.module.sass";
import { EmptyState } from "@/components/common/EmptyState";
import { ContentHeader } from "@/components/shell/ContentHeader";
import { getDirectMessages, requireAccount } from "@/lib/app/queries";
import { myProfileHref, userHref } from "@/lib/routes";

type Params = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: `Conversa com @${(await params).username}` };
}

export default async function DirectPage({ params }: { params: Params }) {
  const { username } = await params;
  const { supabase, profile } = await requireAccount(`/mensagens/${username}`);
  const { data } = await supabase.rpc("find_profile", { p_username: username });
  const other = (Array.isArray(data) ? data[0] : null) as ProfileCard | null;
  if (!other) notFound();
  if (other.friendship === "voce") redirect(myProfileHref);
  const friends = other.friendship === "amigos";
  const [messages, stickers] = await Promise.all([friends ? getDirectMessages(supabase, profile.id, other.id) : [], friends ? getStickers(supabase) : []]);
  const reactions = await getReactions(supabase, "direct_reactions", messages.map((m) => m.id));
  const [userA, userB] = dmPair(profile.id, other.id);

  return (
    <>
      <ContentHeader icon="chat" title={other.display_name} topic={`@${other.username}`} />
      <div className={channelStyles.body}>
        <main className={channelStyles.main}>
          {other.friendship === "amigos" ? (
            <ChatRoom
              key={other.id}
              source={{ type: "dm", userA, userB, name: other.display_name }}
              me={profile}
              authors={{ [other.id]: other }}
              initialMessages={messages}
              initialReactions={reactions}
              stickers={stickers}
              canSend
              canManage={false}
              intro={{ title: other.display_name, text: `O começo da conversa com ${other.display_name}.` }}
            />
          ) : (
            <EmptyState
              icon="users"
              title="Só amigos conversam direto"
              actions={
                <ButtonLink href={userHref(other.username)} linkAs={Link} variant="primary">
                  Ver perfil
                </ButtonLink>
              }
            >
              Adicione {other.display_name} como amigo para mandar mensagens.
            </EmptyState>
          )}
        </main>
      </div>
    </>
  );
}
