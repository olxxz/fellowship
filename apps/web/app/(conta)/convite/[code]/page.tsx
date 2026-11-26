import { ButtonLink, playerColorStyle } from "@fellowship/ui";
import type { InvitePreview } from "@fellowship/db";
import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInviteForm } from "@/components/account/AcceptInviteForm";
import settings from "@/components/account/Settings.module.sass";
import { AuthCard } from "@/components/auth/AuthCard";
import styles from "@/components/auth/Auth.module.sass";
import { appSpaceHref } from "@/lib/routes";
import { authEnabled } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Convite" };

const INVALID: Record<string, string> = {
  expirado: "Este convite expirou. Peça um link novo para quem convidou você.",
  esgotado: "Este convite já foi usado o máximo de vezes. Peça um link novo.",
  revogado: "Este convite foi cancelado por quem criou.",
};

export default async function ConvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!authEnabled) {
    return (
      <AuthCard title="Convite" text="Convites só funcionam no app com login.">
        <ButtonLink href="/" linkAs={Link}>
          Página inicial
        </ButtonLink>
      </AuthCard>
    );
  }
  const { supabase, user } = await getUser();
  const { data } = await supabase.rpc("get_invite", { p_code: code });
  const invite = (Array.isArray(data) ? data[0] : null) as InvitePreview | null;

  if (!invite) {
    return (
      <AuthCard title="Convite não encontrado" text="O link pode estar incompleto. Confira com quem mandou.">
        <ButtonLink href={user ? "/inicio" : "/"} linkAs={Link}>
          {user ? "Ir para o Início" : "Página inicial"}
        </ButtonLink>
      </AuthCard>
    );
  }

  const next = `/convite/${code}`;
  const members = `${invite.member_count} ${invite.member_count === 1 ? "membro" : "membros"}`;

  return (
    <AuthCard title="Você foi convidado" text={`${invite.inviter} chamou você para o Cenário.`}>
      <div className={settings.preview} style={playerColorStyle(invite.color)}>
        <span className={settings.previewIcon} aria-hidden="true">
          {invite.short}
        </span>
        <div>
          <p className={settings.previewName}>{invite.name}</p>
          <p className={styles.small}>{invite.description ? `${invite.description} · ${members}` : members}</p>
        </div>
      </div>

      {invite.already_member ? (
        <ButtonLink className={styles.submit} href={appSpaceHref(invite.space_id)} linkAs={Link} variant="primary">
          Você já está aqui. Abrir o Cenário
        </ButtonLink>
      ) : invite.status !== "valido" ? (
        <p className={styles.error} role="alert">
          {INVALID[invite.status]}
        </p>
      ) : user ? (
        <AcceptInviteForm code={code} spaceName={invite.name} />
      ) : (
        <>
          <ButtonLink className={styles.submit} href={`/cadastro?next=${encodeURIComponent(next)}`} linkAs={Link} variant="primary">
            Criar conta e entrar
          </ButtonLink>
          <ButtonLink className={styles.submit} href={`/entrar?next=${encodeURIComponent(next)}`} linkAs={Link}>
            Já tenho conta
          </ButtonLink>
        </>
      )}
    </AuthCard>
  );
}
