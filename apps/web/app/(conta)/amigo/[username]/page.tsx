import { ButtonLink } from "@fellowship/ui";
import type { ProfileCard } from "@fellowship/db";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileActions } from "@/components/account/ProfileActions";
import { ProfileCardView } from "@/components/account/ProfileCardView";
import { AuthCard } from "@/components/auth/AuthCard";
import styles from "@/components/auth/Auth.module.sass";
import { APP_NAME } from "@/lib/brand";
import { myProfileHref } from "@/lib/routes";
import { authEnabled } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

type Params = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { username } = await params;
  const title = `@${username} chamou você para o ${APP_NAME}`;
  const description = "Mesa de RPG com voz, fichas e dados. Crie sua conta e jogue com o grupo.";
  return { title, description, openGraph: { title, description, siteName: APP_NAME, locale: "pt_BR" } };
}

/** Link de amizade e de convite para o app. Sem conta: cria ou entra e volta aqui; com conta: pede amizade. */
export default async function AmigoPage({ params }: { params: Params }) {
  const { username } = await params;
  const next = `/amigo/${username}`;
  if (!authEnabled) redirect("/");
  const { supabase, user } = await getUser();
  if (!user) {
    return (
      <AuthCard title={`@${username} chamou você`} text={`Crie sua conta no ${APP_NAME} para jogar com o grupo. Depois de entrar, vocês viram amigos.`}>
        <ButtonLink className={styles.submit} href={`/cadastro?next=${encodeURIComponent(next)}`} linkAs={Link} variant="primary">
          Criar conta
        </ButtonLink>
        <ButtonLink className={styles.submit} href={`/entrar?next=${encodeURIComponent(next)}`} linkAs={Link}>
          Já tenho conta
        </ButtonLink>
      </AuthCard>
    );
  }
  const { data } = await supabase.rpc("find_profile", { p_username: username });
  const card = (Array.isArray(data) ? data[0] : null) as ProfileCard | null;
  if (!card) {
    return (
      <AuthCard title="Link não encontrado" text="Esse nick não existe mais. Confira com quem mandou.">
        <ButtonLink className={styles.submit} href="/inicio" linkAs={Link}>
          Ir para o Início
        </ButtonLink>
      </AuthCard>
    );
  }
  if (card.friendship === "voce") redirect(myProfileHref);
  return (
    <AuthCard title={`Amizade com ${card.display_name}`} text="Mande o pedido; quando aceitarem, vocês conversam direto.">
      <ProfileCardView profile={card} compact>
        <ProfileActions id={card.id} username={card.username} initial={card.friendship} />
      </ProfileCardView>
      <ButtonLink className={styles.submit} href="/inicio" linkAs={Link}>
        Ir para o Início
      </ButtonLink>
    </AuthCard>
  );
}
