"use client";

import { Avatar, cx, HoverCard, playerColorStyle, type AccentColor, type PresenceStatus } from "@fellowship/ui";
import { ProfileCardView, type ProfileCardData } from "@/components/account/ProfileCardView";
import { useIsMobile } from "@/lib/useIsMobile";
import { useShell } from "./ShellContext";
import styles from "./MembersList.module.sass";

const STATUS: Record<PresenceStatus, string> = { online: "online", ausente: "ausente", "em-sessao": "em sessão", offline: "offline" };

export interface MemberEntry {
  id: string;
  /** Nome em destaque: o personagem na campanha, o jogador no Cenário. */
  name: string;
  color: AccentColor;
  /** Sem status (ainda não há presença em tempo real no app com login), o ponto não aparece. */
  status?: PresenceStatus;
  sub?: string;
  avatarUrl?: string;
  /** Na campanha, o personagem vem antes do jogador (retrato com anel, nome na cor dele). */
  asCharacter?: boolean;
  /** App real: parar o mouse mostra o cartão de perfil; clicar abre o perfil. */
  profile?: ProfileCardData;
}

/**
 * Lista de membros. No desktop é uma coluna que a pessoa mostra ou esconde (salvo);
 * no celular fica à direita do conteúdo, que é empurrado ao abrir (botão ou arrastando para a esquerda).
 */
export function MembersList({ groups, label }: { groups: Array<{ title: string; members: MemberEntry[] }>; label: string }) {
  const { membersOpen, mobileMembersOpen } = useShell();
  const mobile = useIsMobile();
  return (
    <aside
      className={cx(styles.members, !membersOpen && styles.desktopHidden)}
      aria-label={label}
      data-drawer="members"
      inert={mobile && !mobileMembersOpen ? true : undefined}
    >
      {groups
        .filter((g) => g.members.length > 0)
        .map((group) => (
          <section key={group.title} className={styles.group}>
            <h2 className={styles.groupTitle}>
              {group.title} — {group.members.length}
            </h2>
            <ul className={styles.list}>
              {group.members.map((m) => {
                const row = (
                  <>
                    <Avatar name={m.name} src={m.avatarUrl} color={m.color} size={32} status={m.status} appearance={m.asCharacter ? "ring" : "fill"} />
                    <span className={styles.text}>
                      <span className={cx(styles.name, m.asCharacter && styles.characterName)}>
                        {m.name}
                        {m.status && <span className={styles.hidden}>, {STATUS[m.status]}</span>}
                      </span>
                      {m.sub && <span className={styles.sub}>{m.sub}</span>}
                    </span>
                  </>
                );
                return (
                  <li key={m.id} className={cx(styles.member, m.status === "offline" && styles.offline, m.profile && styles.memberLink)} style={playerColorStyle(m.color)}>
                    {m.profile ? (
                      <HoverCard trigger={row} href={`/u/${m.profile.username}`} triggerClassName={styles.memberTrigger}>
                        <ProfileCardView profile={m.profile} compact />
                      </HoverCard>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </aside>
  );
}
