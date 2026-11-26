import { ButtonLink } from "@fellowship/ui";
import type { ProfileCard } from "@fellowship/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DirectChat } from "@/components/account/DirectChat";
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
  const messages = other.friendship === "amigos" ? await getDirectMessages(supabase, profile.id, other.id) : [];

  return (
    <>
      <ContentHeader icon="chat" title={other.display_name} topic={`@${other.username}`} />
      <div className={channelStyles.body}>
        <main className={channelStyles.main}>
          {other.friendship === "amigos" ? (
            <DirectChat key={other.id} me={profile} other={other} initialMessages={messages} />
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
